import { addDays, format, parseISO, subDays } from "date-fns";
import type {
  Material,
  MaterialPlan,
  OrderSuggestion,
  PlanningBucket,
  ProductionPlanEntry,
  ProductionPlanItem,
  PurchaseOrder,
} from "../types";

export const isoToday = () => format(new Date(), "yyyy-MM-dd");

/**
 * A production plan entry may hold multiple inventory items (current shape), or
 * be an older single-material doc from before multi-item entries existed
 * (materialId/qty at the top level instead of an items array).
 */
export function getProductionPlanItems(
  entry: Pick<ProductionPlanEntry, "items" | "materialId" | "qty">,
): ProductionPlanItem[] {
  if (entry.items && entry.items.length > 0) return entry.items;
  if (entry.materialId) return [{ materialId: entry.materialId, qty: entry.qty ?? 0 }];
  return [];
}

/**
 * The inventory items one production plan entry consumes.
 *
 * Most entries name a product and a quantity and carry no item list of their
 * own: the materials come from that product's Bill of Materials recipe,
 * multiplied by the order quantity. Holding the recipe in one place means a
 * BOM correction flows through the whole plan instead of having to be
 * re-imported into every entry that used it.
 */
export function resolveEntryItems(
  entry: ProductionPlanEntry,
  productById?: Map<string, Material>,
): ProductionPlanItem[] {
  const explicit = getProductionPlanItems(entry);
  if (explicit.length > 0) return explicit;
  if (!entry.productId || !productById) return [];
  const bom = productById.get(entry.productId)?.bom ?? [];
  if (bom.length === 0) return [];
  const orderQty = entry.productQty ?? 0;
  return bom.map((line) => ({
    materialId: line.materialId,
    qty: line.qty * orderQty,
  }));
}

/** Planned demand per material, then per needed-by date. */
export type DemandIndex = Map<string, Map<string, number>>;

/**
 * Rolls the whole production plan up once, so projecting a material doesn't
 * have to walk every entry (and every entry's exploded recipe) again — with
 * a few hundred harnesses of ~85 components each against ~900 materials,
 * re-walking per material is tens of millions of iterations.
 */
export function buildDemandIndex(
  productionPlan: ProductionPlanEntry[],
  products: Material[] = [],
): DemandIndex {
  const productById = new Map(products.map((p) => [p.id, p]));
  const index: DemandIndex = new Map();
  for (const entry of productionPlan) {
    for (const item of resolveEntryItems(entry, productById)) {
      let byDate = index.get(item.materialId);
      if (!byDate) {
        byDate = new Map();
        index.set(item.materialId, byDate);
      }
      byDate.set(
        entry.neededByDate,
        (byDate.get(entry.neededByDate) ?? 0) + item.qty,
      );
    }
  }
  return index;
}

/** Expected arrival = order date + the material's configured lead time. */
export function computeExpectedArrival(
  orderDate: string,
  leadTimeDays: number,
): string {
  return format(addDays(parseISO(orderDate), leadTimeDays), "yyyy-MM-dd");
}

/**
 * An outstanding order is "delayed" once its expected arrival date has
 * passed without it being marked received — computed live against today's
 * date rather than stored, so it updates on its own with no manual status
 * change.
 */
export function isOrderDelayed(
  po: Pick<PurchaseOrder, "status" | "expectedArrivalDate">,
  today: string = isoToday(),
): boolean {
  return po.status === "outstanding" && po.expectedArrivalDate < today;
}

/**
 * Builds a time-phased projection of on-hand stock for one material, combining
 * current warehouse stock, outstanding (not-yet-arrived) purchase orders, and
 * planned demand from production. Whenever the projection would dip below the
 * material's safety stock, it produces a suggestion for when a new purchase
 * order must be placed (using the material's own lead time) and how much to
 * order, so buyers don't have to work this out by hand for every material.
 */
export function computeMaterialPlan(
  material: Material,
  purchaseOrders: PurchaseOrder[],
  productionPlan: ProductionPlanEntry[],
  products: Material[] = [],
  today: string = isoToday(),
): MaterialPlan {
  return planFromDemand(
    material,
    purchaseOrders,
    buildDemandIndex(productionPlan, products).get(material.id) ?? new Map(),
    today,
  );
}

function planFromDemand(
  material: Material,
  purchaseOrders: PurchaseOrder[],
  demandByDate: Map<string, number>,
  today: string,
): MaterialPlan {
  const outstanding = purchaseOrders.filter(
    (po) => po.materialId === material.id && po.status === "outstanding",
  );

  const incomingByDate = new Map<string, number>();
  for (const po of outstanding) {
    incomingByDate.set(
      po.expectedArrivalDate,
      (incomingByDate.get(po.expectedArrivalDate) ?? 0) + po.qty,
    );
  }

  const dates = Array.from(
    new Set([...incomingByDate.keys(), ...demandByDate.keys()]),
  )
    .filter((date) => date >= today)
    .sort();

  // Without a lead time we can't compute a meaningful order-by date, so
  // surface the material separately instead of guessing (which would either
  // invent false urgency or hide a real shortfall).
  const leadTimeMissing = material.leadTimeDays <= 0;

  const suggestionArrivals = new Map<string, number>();
  const buckets: PlanningBucket[] = [];
  const suggestions: OrderSuggestion[] = [];
  let balance = material.onHandQty;

  for (const date of dates) {
    const incoming =
      (incomingByDate.get(date) ?? 0) + (suggestionArrivals.get(date) ?? 0);
    const demand = demandByDate.get(date) ?? 0;
    balance = balance + incoming - demand;

    const bucket: PlanningBucket = {
      date,
      incoming,
      demand,
      projectedBalance: balance,
      belowSafetyStock: balance < material.safetyStock,
    };
    buckets.push(bucket);

    if (bucket.belowSafetyStock && !leadTimeMissing) {
      const shortfall = material.safetyStock - balance;
      const rawQty = Math.max(shortfall, material.minOrderQty);
      const suggestedQty =
        material.minOrderQty > 0
          ? Math.ceil(rawQty / material.minOrderQty) * material.minOrderQty
          : Math.ceil(rawQty);

      const orderByDate = format(
        subDays(parseISO(date), material.leadTimeDays),
        "yyyy-MM-dd",
      );

      suggestions.push({
        materialId: material.id,
        orderByDate,
        neededByDate: date,
        suggestedQty,
        urgent: orderByDate <= today,
        reason: `Projected stock drops to ${balance} on ${date}, below safety stock of ${material.safetyStock}.`,
      });

      // Assume the suggested order is placed and reflect its arrival so later
      // shortfalls in the same horizon aren't double-counted.
      balance += suggestedQty;
      bucket.projectedBalance = balance;
      bucket.belowSafetyStock = false;
    }
  }

  return { material, buckets, suggestions, leadTimeMissing };
}

export function computeAllPlans(
  materials: Material[],
  purchaseOrders: PurchaseOrder[],
  productionPlan: ProductionPlanEntry[],
  products: Material[] = [],
  today: string = isoToday(),
): MaterialPlan[] {
  const demand = buildDemandIndex(productionPlan, products);
  const ordersByMaterial = new Map<string, PurchaseOrder[]>();
  for (const po of purchaseOrders) {
    const list = ordersByMaterial.get(po.materialId);
    if (list) list.push(po);
    else ordersByMaterial.set(po.materialId, [po]);
  }
  return materials.map((m) =>
    planFromDemand(
      m,
      ordersByMaterial.get(m.id) ?? [],
      demand.get(m.id) ?? new Map(),
      today,
    ),
  );
}
