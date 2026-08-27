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
  notes?: string;
  updatedAt?: number;
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

export interface ProductionPlanEntry {
  id: string;
  materialId: string;
  /** Date the material is required by, to feed production/consumption. */
  neededByDate: string; // ISO date
  qty: number;
  source?: string; // e.g. sales order / work order reference
  notes?: string;
  updatedAt?: number;
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
}
