import { addDays, format, parseISO, subDays } from "date-fns";
import type {
  Material,
  MaterialPlan,
  OrderSuggestion,
  PlanningBucket,
  ProductionPlanEntry,
  PurchaseOrder,
} from "../types";

export const isoToday = () => format(new Date(), "yyyy-MM-dd");

/** Expected arrival = order date + the material's configured lead time. */
export function computeExpectedArrival(
  orderDate: string,
  leadTimeDays: number,
): string {
  return format(addDays(parseISO(orderDate), leadTimeDays), "yyyy-MM-dd");
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
  today: string = isoToday(),
): MaterialPlan {
  const outstanding = purchaseOrders.filter(
    (po) => po.materialId === material.id && po.status === "outstanding",
  );
  const demands = productionPlan.filter((d) => d.materialId === material.id);

  const incomingByDate = new Map<string, number>();
  for (const po of outstanding) {
    incomingByDate.set(
      po.expectedArrivalDate,
      (incomingByDate.get(po.expectedArrivalDate) ?? 0) + po.qty,
    );
  }

  const demandByDate = new Map<string, number>();
  for (const d of demands) {
    demandByDate.set(d.neededByDate, (demandByDate.get(d.neededByDate) ?? 0) + d.qty);
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
  today: string = isoToday(),
): MaterialPlan[] {
  return materials.map((m) =>
    computeMaterialPlan(m, purchaseOrders, productionPlan, today),
  );
}
