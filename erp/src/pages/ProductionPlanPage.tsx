import { useMemo, useState } from "react";
import type { Material, ProductionPlanEntry } from "../types";
import {
  createProductionPlanEntry,
  deleteProductionPlanEntry,
  updateProductionPlanEntry,
} from "../lib/repo";
import { isoToday } from "../lib/mrp";
import { usePagedSearch } from "../lib/pagination";
import { Pagination } from "../components/Pagination";
import { SearchBox } from "../components/SearchBox";

function emptyForm(materials: Material[]) {
  return {
    materialId: materials[0]?.id ?? "",
    neededByDate: isoToday(),
    qty: 1,
    source: "",
    notes: "",
  };
}

export function ProductionPlanPage({
  materials,
  productionPlan,
}: {
  materials: Material[];
  productionPlan: ProductionPlanEntry[];
}) {
  const [form, setForm] = useState(() => emptyForm(materials));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const materialById = useMemo(
    () => new Map(materials.map((m) => [m.id, m])),
    [materials],
  );

  function startEdit(entry: ProductionPlanEntry) {
    setEditingId(entry.id);
    setForm({
      materialId: entry.materialId,
      neededByDate: entry.neededByDate,
      qty: entry.qty,
      source: entry.source ?? "",
      notes: entry.notes ?? "",
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
    if (!form.neededByDate) {
      setError("Needed-by date is required.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      if (editingId) {
        await updateProductionPlanEntry(editingId, form);
      } else {
        await createProductionPlanEntry(form);
      }
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: string) {
    if (!confirm("Delete this production plan entry?")) return;
    await deleteProductionPlanEntry(id);
    if (editingId === id) resetForm();
  }

  const sorted = [...productionPlan].sort((a, b) =>
    a.neededByDate.localeCompare(b.neededByDate),
  );

  const matchesEntry = (entry: ProductionPlanEntry, q: string) =>
    (materialById.get(entry.materialId)?.code.toLowerCase().includes(q) ?? false) ||
    (materialById.get(entry.materialId)?.name.toLowerCase().includes(q) ?? false) ||
    (entry.source?.toLowerCase().includes(q) ?? false);

  const { query, setQuery, page, setPage, pageCount, pageItems, total } =
    usePagedSearch(sorted, matchesEntry);

  return (
    <div className="page">
      <section className="card">
        <h2>{editingId ? "Edit demand" : "Add production demand"}</h2>
        <p className="hint">
          How much of each material production will consume, and by when.
          This is compared against stock + outstanding orders to work out
          what still needs to be purchased.
        </p>
        <form className="form-grid" onSubmit={onSubmit}>
          <label>
            Material
            <select
              value={form.materialId}
              onChange={(e) => setForm({ ...form, materialId: e.target.value })}
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
            Needed by
            <input
              type="date"
              value={form.neededByDate}
              onChange={(e) =>
                setForm({ ...form, neededByDate: e.target.value })
              }
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
            Source / reference
            <input
              value={form.source}
              onChange={(e) => setForm({ ...form, source: e.target.value })}
              placeholder="Work order / sales order #"
            />
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
              {editingId ? "Save changes" : "Add demand"}
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
          <h2>Production plan ({sorted.length})</h2>
          <SearchBox
            value={query}
            onChange={setQuery}
            placeholder="Search material, source…"
          />
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Needed by</th>
                <th>Material</th>
                <th>Qty</th>
                <th>Source</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((entry) => (
                <tr key={entry.id}>
                  <td>{entry.neededByDate}</td>
                  <td>{materialById.get(entry.materialId)?.code ?? "—"}</td>
                  <td>{entry.qty}</td>
                  <td>{entry.source || "—"}</td>
                  <td className="row-actions">
                    <button className="link" onClick={() => startEdit(entry)}>
                      Edit
                    </button>
                    <button
                      className="link danger"
                      onClick={() => onDelete(entry.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={5} className="empty">
                    No demand entries yet.
                  </td>
                </tr>
              )}
              {sorted.length > 0 && total === 0 && (
                <tr>
                  <td colSpan={5} className="empty">
                    No demand entries match "{query}".
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
