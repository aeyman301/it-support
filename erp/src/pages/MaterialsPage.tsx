import { useState } from "react";
import type { Material } from "../types";
import {
  createMaterial,
  deleteMaterial,
  updateMaterial,
} from "../lib/repo";
import { usePagedSearch } from "../lib/pagination";
import { Pagination } from "../components/Pagination";
import { SearchBox } from "../components/SearchBox";
import { MaterialCsvImport } from "../components/MaterialCsvImport";

const matchesMaterial = (m: Material, q: string) =>
  m.code.toLowerCase().includes(q) ||
  m.name.toLowerCase().includes(q) ||
  m.uom.toLowerCase().includes(q);

const emptyForm = {
  code: "",
  name: "",
  uom: "pcs",
  leadTimeDays: 14,
  safetyStock: 0,
  minOrderQty: 1,
  onHandQty: 0,
  notes: "",
};

export function MaterialsPage({ materials }: { materials: Material[] }) {
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { query, setQuery, page, setPage, pageCount, pageItems, total } =
    usePagedSearch(materials, matchesMaterial);

  function startEdit(m: Material) {
    setEditingId(m.id);
    setForm({
      code: m.code,
      name: m.name,
      uom: m.uom,
      leadTimeDays: m.leadTimeDays,
      safetyStock: m.safetyStock,
      minOrderQty: m.minOrderQty,
      onHandQty: m.onHandQty,
      notes: m.notes ?? "",
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.code.trim() || !form.name.trim()) {
      setError("Code and name are required.");
      return;
    }
    if (form.leadTimeDays < 0) {
      setError("Lead time can't be negative.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      if (editingId) {
        await updateMaterial(editingId, form);
      } else {
        await createMaterial(form);
      }
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: string) {
    if (!confirm("Delete this material? This does not delete its orders or plan entries."))
      return;
    await deleteMaterial(id);
    if (editingId === id) resetForm();
  }

  return (
    <div className="page">
      <section className="card">
        <h2>{editingId ? "Edit material" : "Add material"}</h2>
        <p className="hint">
          Lead time is set per material here — this is what the planning
          dashboard uses to work out when a purchase order must be placed.
        </p>
        <form className="form-grid" onSubmit={onSubmit}>
          <label>
            Code
            <input
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              placeholder="RM-0001"
            />
          </label>
          <label>
            Name
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Steel plate 3mm"
            />
          </label>
          <label>
            UoM
            <input
              value={form.uom}
              onChange={(e) => setForm({ ...form, uom: e.target.value })}
            />
          </label>
          <label>
            Lead time (days)
            <input
              type="number"
              min={0}
              value={form.leadTimeDays}
              onChange={(e) =>
                setForm({ ...form, leadTimeDays: Number(e.target.value) })
              }
            />
          </label>
          <label>
            Safety stock
            <input
              type="number"
              min={0}
              value={form.safetyStock}
              onChange={(e) =>
                setForm({ ...form, safetyStock: Number(e.target.value) })
              }
            />
          </label>
          <label>
            Min order qty
            <input
              type="number"
              min={0}
              value={form.minOrderQty}
              onChange={(e) =>
                setForm({ ...form, minOrderQty: Number(e.target.value) })
              }
            />
          </label>
          <label>
            On-hand qty (warehouse)
            <input
              type="number"
              min={0}
              value={form.onHandQty}
              onChange={(e) =>
                setForm({ ...form, onHandQty: Number(e.target.value) })
              }
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
            <button type="submit" disabled={saving}>
              {editingId ? "Save changes" : "Add material"}
            </button>
            {editingId && (
              <button type="button" className="secondary" onClick={resetForm}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <MaterialCsvImport materials={materials} />

      <section className="card">
        <div className="card-header-row">
          <h2>Materials ({materials.length})</h2>
          <SearchBox
            value={query}
            onChange={setQuery}
            placeholder="Search code, name, UoM…"
          />
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>UoM</th>
                <th>Lead time</th>
                <th>Safety stock</th>
                <th>Min order</th>
                <th>On-hand</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((m) => (
                <tr key={m.id}>
                  <td>{m.code}</td>
                  <td className="cell-wrap">{m.name}</td>
                  <td>{m.uom}</td>
                  <td>{m.leadTimeDays} d</td>
                  <td>{m.safetyStock}</td>
                  <td>{m.minOrderQty}</td>
                  <td>{m.onHandQty}</td>
                  <td className="row-actions">
                    <button className="link" onClick={() => startEdit(m)}>
                      Edit
                    </button>
                    <button className="link danger" onClick={() => onDelete(m.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {materials.length === 0 && (
                <tr>
                  <td colSpan={8} className="empty">
                    No materials yet. Add your first one above.
                  </td>
                </tr>
              )}
              {materials.length > 0 && total === 0 && (
                <tr>
                  <td colSpan={8} className="empty">
                    No materials match "{query}".
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
