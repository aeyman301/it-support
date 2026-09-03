// Core domain types for the material planning module.

export interface Material {
  id: string;
  code: string;
  name: string;
  uom: string;
  /** Days between placing a purchase order and the material arriving at our warehouse. */
  leadTimeDays: number;
  /** Extra buffer stock we never want to dip below. */
  safetyStock: number;
  /** Smallest quantity a supplier will accept per order. */
  minOrderQty: number;
  /** Quantity currently physically at the warehouse. */
  onHandQty: number;
  supplier?: string;
  /** City/country the material ships from, e.g. "SHIMIZU, JAPAN". */
  shipFrom?: string;
  notes?: string;
  updatedAt?: number;
  /**
   * "product" marks this as a finished good sold to a customer (e.g. a wire
   * harness part number), not a raw material to purchase. Absent/"material"
   * is the normal case. Products are excluded from BOM/purchasing views and
   * only offered in the production plan's product picker.
   */
  kind?: "material" | "product";
  /** For kind:"product" — grouping label shown in the picker, e.g. "Perodua D42L". */
  model?: string;
  /**
   * For kind:"product" — the raw materials consumed to build ONE unit of
   * this product. The production plan multiplies this by the order
   * quantity to project future purchasing needs.
   */
  bom?: ProductionPlanItem[];
}

export type PurchaseOrderStatus = "outstanding" | "received" | "cancelled";

export interface PurchaseOrder {
  id: string;
  materialId: string;
  poNumber: string;
  orderDate: string; // ISO date (yyyy-MM-dd)
  qty: number;
  /** Auto-computed from orderDate + material lead time, but can be overridden once the supplier confirms. */
  expectedArrivalDate: string; // ISO date
  status: PurchaseOrderStatus;
  receivedDate?: string;
  notes?: string;
  updatedAt?: number;
}

export interface ProductionPlanItem {
  materialId: string;
  qty: number;
}

export interface ProductionPlanEntry {
  id: string;
  /** The finished product this customer order is for (Product.id). */
  productId?: string;
  /** Quantity of the product ordered, e.g. 200 pcs. */
  productQty?: number;
  /** Display label for the product — auto-filled from the picker, or free text for older entries. */
  productName?: string;
  /** Raw BOM items this order consumes, each with its own quantity (optional). */
  items?: ProductionPlanItem[];
  /** Date the order/items are required by. */
  neededByDate: string; // ISO date
  source?: string; // e.g. sales order / work order reference
  notes?: string;
  updatedAt?: number;
  // Legacy single-material shape from before multi-item entries existed.
  // Older Firestore docs may still have these instead of `items`.
  materialId?: string;
  qty?: number;
}

/** One row of the time-phased planning table for a single material. */
export interface PlanningBucket {
  date: string; // ISO date, start of bucket
  incoming: number; // outstanding POs arriving in this bucket
  demand: number; // production plan requirement in this bucket
  projectedBalance: number; // running balance after incoming/demand
  belowSafetyStock: boolean;
}

export interface OrderSuggestion {
  materialId: string;
  /** Date by which a new PO must be placed to arrive before stock runs out. */
  orderByDate: string;
  /** Date the shortfall would actually occur if nothing is ordered. */
  neededByDate: string;
  suggestedQty: number;
  /** True if orderByDate is today or already in the past — action needed now. */
  urgent: boolean;
  reason: string;
}

export interface MaterialPlan {
  material: Material;
  buckets: PlanningBucket[];
  suggestions: OrderSuggestion[];
  /** True when leadTimeDays isn't configured yet, so order-by dates can't be computed. */
  leadTimeMissing: boolean;
}
