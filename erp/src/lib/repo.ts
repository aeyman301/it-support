import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Material, ProductionPlanEntry, PurchaseOrder } from "../types";

const materialsCol = collection(db, "materials");
const purchaseOrdersCol = collection(db, "purchaseOrders");
const productionPlanCol = collection(db, "productionPlan");

export function watchMaterials(cb: (items: Material[]) => void) {
  const q = query(materialsCol, orderBy("code"));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Material));
  });
}

export function watchPurchaseOrders(cb: (items: PurchaseOrder[]) => void) {
  const q = query(purchaseOrdersCol, orderBy("expectedArrivalDate"));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as PurchaseOrder));
  });
}

export function watchProductionPlan(cb: (items: ProductionPlanEntry[]) => void) {
  const q = query(productionPlanCol, orderBy("neededByDate"));
  return onSnapshot(q, (snap) => {
    cb(
      snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ProductionPlanEntry),
    );
  });
}

export function createMaterial(data: Omit<Material, "id" | "updatedAt">) {
  return addDoc(materialsCol, { ...data, updatedAt: serverTimestamp() });
}

export function updateMaterial(id: string, data: Partial<Material>) {
  return updateDoc(doc(materialsCol, id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export function deleteMaterial(id: string) {
  return deleteDoc(doc(materialsCol, id));
}

export function createPurchaseOrder(
  data: Omit<PurchaseOrder, "id" | "updatedAt">,
) {
  return addDoc(purchaseOrdersCol, { ...data, updatedAt: serverTimestamp() });
}

export function updatePurchaseOrder(id: string, data: Partial<PurchaseOrder>) {
  return updateDoc(doc(purchaseOrdersCol, id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export function deletePurchaseOrder(id: string) {
  return deleteDoc(doc(purchaseOrdersCol, id));
}

export function createProductionPlanEntry(
  data: Omit<ProductionPlanEntry, "id" | "updatedAt">,
) {
  return addDoc(productionPlanCol, { ...data, updatedAt: serverTimestamp() });
}

export function updateProductionPlanEntry(
  id: string,
  data: Partial<ProductionPlanEntry>,
) {
  return updateDoc(doc(productionPlanCol, id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export function deleteProductionPlanEntry(id: string) {
  return deleteDoc(doc(productionPlanCol, id));
}
