import { useMemo, useState } from "react";
import type { Material, PurchaseOrder, PurchaseOrderStatus } from "../types";
import {
  createPurchaseOrder,
  deletePurchaseOrder,
  updateMaterial,
  updatePurchaseOrder,
} from "../lib/repo";
import { computeExpectedArrival, isOrderDelayed, isoToday } from "../lib/mrp";
import { usePagedSearch } from "../lib/pagination";
import { Pagination } from "../components/Pagination";
import { SearchBox } from "../components/SearchBox";

function emptyForm(materials: Material[]) {
  return {
    materialId: materials[0]?.id ?? "",
    poNumber: "",
    orderDate: isoToday(),
    qty: 1,
    expectedArrivalDate: "",
    arrivalOverridden: false,
    status: "outstanding" as PurchaseOrderStatus,
    notes: "",
  };
}

export function PurchaseOrdersPage({
  materials,
  purchaseOrders,
}: {
  materials: Material[];
  purchaseOrders: PurchaseOrder[];
}) {
  const [form, setForm] = useState(() => emptyForm(materials));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<
    PurchaseOrderStatus | "all" | "delayed"
  >("outstanding");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const materialById = useMemo(
    () => new Map(materials.map((m) => [m.id, m])),
    [materials],
  );

  const autoArrival = useMemo(() => {
    const material = materialById.get(form.materialId);
    if (!material || !form.orderDate) return "";
    return computeExpectedArrival(form.orderDate, material.leadTimeDays);
  }, [form.materialId, form.orderDate, materialById]);

  const effectiveArrival = form.arrivalOverridden
    ? form.expectedArrivalDate
    : autoArrival;

  function startEdit(po: PurchaseOrder) {
    setEditingId(po.id);
    const material = materialById.get(po.materialId);
    const auto = material
      ? computeExpectedArrival(po.orderDate, material.leadTimeDays)
      : po.expectedArrivalDate;
    setForm({
      materialId: po.materialId,
      poNumber: po.poNumber,
      orderDate: po.orderDate,
      qty: po.qty,
      expectedArrivalDate: po.expectedArrivalDate,
      arrivalOverridden: po.expectedArrivalDate !== auto,
      status: po.status,
      notes: po.notes ?? "",
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm(materials));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.materialId) {
      setError("Pick a material.");
      return;
    }
    if (!form.poNumber.trim()) {
      setError("PO number is required.");
      return;
    }
    if (!effectiveArrival) {
      setError("Expected arrival date could not be determined.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const payload = {
        materialId: form.materialId,
        poNumber: form.poNumber,
        orderDate: form.orderDate,
        qty: form.qty,
        expectedArrivalDate: effectiveArrival,
        status: form.status,
        notes: form.notes,
      };
      if (editingId) {
        await updatePurchaseOrder(editingId, payload);
      } else {
        await createPurchaseOrder(payload);
      }
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: string) {
    if (!confirm("Delete this purchase order?")) return;
    await deletePurchaseOrder(id);
    if (editingId === id) resetForm();
  }

  async function markReceived(po: PurchaseOrder) {
    await updatePurchaseOrder(po.id, {
      status: "received",
      receivedDate: isoToday(),
    });
    const material = materialById.get(po.materialId);
    if (material) {
      await updateMaterial(material.id, {
        onHandQty: material.onHandQty + po.qty,
      });
    }
  }

  const delayedCount = purchaseOrders.filter((po) => isOrderDelayed(po)).length;

  const visible = purchaseOrders.filter((po) => {
    if (statusFilter === "all") return true;
    if (statusFilter === "delayed") return isOrderDelayed(po);
    return po.status === statusFilter;
  });

  const matchesPO = (po: PurchaseOrder, q: string) =>
    po.poNumber.toLowerCase().includes(q) ||
    po.status.includes(q) ||
    (materialById.get(po.materialId)?.code.toLowerCase().includes(q) ?? false) ||
    (materialById.get(po.materialId)?.name.toLowerCase().includes(q) ?? false);

  const { query, setQuery, page, setPage, pageCount, pageItems, total } =
    usePagedSearch(visible, matchesPO);

  return (
    <div className="page">
      <section className="card">
        <h2>{editingId ? "Edit purchase order" : "Record a purchase order"}</h2>
        <p className="hint">
          Orders you've placed but haven't received yet ("outstanding") count
          as incoming stock in the planning dashboard, arriving on the
          expected date below.
        </p>
        <form className="form-grid" onSubmit={onSubmit}>
          <label>
            Material
            <select
              value={form.materialId}
              onChange={(e) =>
                setForm({ ...form, materialId: e.target.value })
              }
            >
              {materials.length === 0 && <option value="">No materials yet</option>}
              {materials.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.code} — {m.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            PO number
            <input
              value={form.poNumber}
              onChange={(e) => setForm({ ...form, poNumber: e.target.value })}
              placeholder="PO-2026-0451"
            />
          </label>
          <label>
            Order date
            <input
              type="date"
              value={form.orderDate}
              onChange={(e) => setForm({ ...form, orderDate: e.target.value })}
            />
          </label>
          <label>
            Quantity
            <input
              type="number"
              min={0}
              value={form.qty}
              onChange={(e) => setForm({ ...form, qty: Number(e.target.value) })}
            />
          </label>
          <label>
            Expected arrival
            <input
              type="date"
              value={effectiveArrival}
              onChange={(e) =>
                setForm({
                  ...form,
                  arrivalOverridden: true,
                  expectedArrivalDate: e.target.value,
                })
              }
            />
          </label>
          <div className="hint-inline">
            {form.arrivalOverridden
              ? "Manually overridden — "
              : "Auto-calculated from order date + material lead time — "}
            {!form.arrivalOverridden ? null : (
              <button
                type="button"
                className="link"
                onClick={() =>
                  setForm({ ...form, arrivalOverridden: false, expectedArrivalDate: "" })
                }
              >
                reset to auto
              </button>
            )}
          </div>
          <label>
            Status
            <select
              value={form.status}
              onChange={(e) =>
                setForm({ ...form, status: e.target.value as PurchaseOrderStatus })
              }
            >
              <option value="outstanding">Outstanding</option>
              <option value="received">Received</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </label>
          <label className="span-2">
            Notes
            <input
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </label>
          {error && <div className="error span-2">{error}</div>}
          <div className="form-actions span-2">
            <button type="submit" disabled={saving || !form.materialId}>
              {editingId ? "Save changes" : "Add order"}
            </button>
            {editingId && (
              <button type="button" className="secondary" onClick={resetForm}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="card">
        <div className="card-header-row">
          <h2>
            Purchase orders ({visible.length})
            {delayedCount > 0 && (
              <span className="status-badge delayed title-badge">
                {delayedCount} delayed
              </span>
            )}
          </h2>
          <SearchBox
            value={query}
            onChange={setQuery}
            placeholder="Search PO #, material…"
          />
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(
                e.target.value as PurchaseOrderStatus | "all" | "delayed",
              )
            }
          >
            <option value="outstanding">Outstanding only</option>
            <option value="delayed">Delayed only</option>
            <option value="received">Received only</option>
            <option value="cancelled">Cancelled only</option>
            <option value="all">All</option>
          </select>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>PO #</th>
                <th>Material</th>
                <th>Order date</th>
                <th>Qty</th>
                <th>Expected arrival</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((po) => (
                <tr key={po.id}>
                  <td>{po.poNumber}</td>
                  <td>{materialById.get(po.materialId)?.code ?? "—"}</td>
                  <td>{po.orderDate}</td>
                  <td>{po.qty}</td>
                  <td>{po.expectedArrivalDate}</td>
                  <td>
                    {isOrderDelayed(po) ? (
                      <span className="status-badge delayed">delayed</span>
                    ) : (
                      <span className={`status-badge ${po.status}`}>{po.status}</span>
                    )}
                  </td>
                  <td className="row-actions">
                    {po.status === "outstanding" && (
                      <button className="link" onClick={() => markReceived(po)}>
                        Mark received
                      </button>
                    )}
                    <button className="link" onClick={() => startEdit(po)}>
                      Edit
                    </button>
                    <button className="link danger" onClick={() => onDelete(po.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={7} className="empty">
                    No purchase orders in this view.
                  </td>
                </tr>
              )}
              {visible.length > 0 && total === 0 && (
                <tr>
                  <td colSpan={7} className="empty">
                    No purchase orders match "{query}".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={page} pageCount={pageCount} total={total} onChange={setPage} />
      </section>
    </div>
  );
}
