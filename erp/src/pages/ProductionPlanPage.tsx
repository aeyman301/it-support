import { useMemo, useState } from "react";
import type { Material, ProductionPlanEntry } from "../types";
import {
  createProductionPlanEntry,
  deleteProductionPlanEntry,
  updateMaterial,
  updateProductionPlanEntry,
} from "../lib/repo";
import { getProductionPlanItems, isoToday } from "../lib/mrp";
import { usePagedSearch } from "../lib/pagination";
import { Pagination } from "../components/Pagination";
import { SearchBox } from "../components/SearchBox";

const emptyDetails = {
  productId: "",
  productQty: 1,
  neededByDate: isoToday(),
  source: "",
  notes: "",
};

export function ProductionPlanPage({
  materials,
  products,
  productionPlan,
}: {
  materials: Material[];
  products: Material[];
  productionPlan: ProductionPlanEntry[];
}) {
  const [details, setDetails] = useState(emptyDetails);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [bomProductId, setBomProductId] = useState("");
  const [bomLines, setBomLines] = useState<Map<string, number>>(new Map());
  const [bomPickerQuery, setBomPickerQuery] = useState("");
  const [bomSaving, setBomSaving] = useState(false);
  const [bomSaved, setBomSaved] = useState(false);

  const materialById = useMemo(
    () => new Map(materials.map((m) => [m.id, m])),
    [materials],
  );
  const productById = useMemo(
    () => new Map(products.map((p) => [p.id, p])),
    [products],
  );

  const productsByModel = useMemo(() => {
    const groups = new Map<string, Material[]>();
    for (const p of products) {
      const model = p.model ?? "Other";
      const list = groups.get(model) ?? [];
      list.push(p);
      groups.set(model, list);
    }
    return Array.from(groups.entries());
  }, [products]);

  function selectBomProduct(id: string) {
    setBomProductId(id);
    const product = productById.get(id);
    setBomLines(new Map((product?.bom ?? []).map((l) => [l.materialId, l.qty])));
    setBomSaved(false);
  }

  const filteredBomMaterials = useMemo(() => {
    const q = bomPickerQuery.trim().toLowerCase();
    if (!q) return materials;
    return materials.filter(
      (m) =>
        m.code.toLowerCase().includes(q) || m.name.toLowerCase().includes(q),
    );
  }, [materials, bomPickerQuery]);

  function toggleBomLine(materialId: string) {
    setBomLines((prev) => {
      const next = new Map(prev);
      if (next.has(materialId)) next.delete(materialId);
      else next.set(materialId, 1);
      return next;
    });
    setBomSaved(false);
  }

  function setBomLineQty(materialId: string, qty: number) {
    setBomLines((prev) => new Map(prev).set(materialId, qty));
    setBomSaved(false);
  }

  function removeBomLine(materialId: string) {
    setBomLines((prev) => {
      const next = new Map(prev);
      next.delete(materialId);
      return next;
    });
    setBomSaved(false);
  }

  async function saveBom() {
    if (!bomProductId) return;
    setBomSaving(true);
    try {
      const bom = Array.from(bomLines, ([materialId, qty]) => ({ materialId, qty }));
      await updateMaterial(bomProductId, { bom });
      setBomSaved(true);
    } finally {
      setBomSaving(false);
    }
  }

  function startEdit(entry: ProductionPlanEntry) {
    setEditingId(entry.id);
    setDetails({
      productId: entry.productId ?? "",
      productQty: entry.productQty ?? 1,
      neededByDate: entry.neededByDate,
      source: entry.source ?? "",
      notes: entry.notes ?? "",
    });
  }

  function resetForm() {
    setEditingId(null);
    setDetails(emptyDetails);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const product = productById.get(details.productId);
    if (!product) {
      setError("Pick a product.");
      return;
    }
    if (!details.productQty || details.productQty <= 0) {
      setError("Order quantity must be greater than 0.");
      return;
    }
    if (!details.neededByDate) {
      setError("Needed-by date is required.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const bom = product.bom ?? [];
      const items = bom.map((line) => ({
        materialId: line.materialId,
        qty: line.qty * details.productQty,
      }));
      const payload = {
        productId: product.id,
        productQty: details.productQty,
        productName: `${product.code} — ${product.name}`,
        neededByDate: details.neededByDate,
        source: details.source,
        notes: details.notes,
        items,
      };
      if (editingId) {
        await updateProductionPlanEntry(editingId, payload);
      } else {
        await createProductionPlanEntry(payload);
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
    (entry.productName?.toLowerCase().includes(q) ?? false) ||
    (entry.source?.toLowerCase().includes(q) ?? false) ||
    getProductionPlanItems(entry).some((it) => {
      const m = materialById.get(it.materialId);
      return (
        (m?.code.toLowerCase().includes(q) ?? false) ||
        (m?.name.toLowerCase().includes(q) ?? false)
      );
    });

  const { query, setQuery, page, setPage, pageCount, pageItems, total } =
    usePagedSearch(sorted, matchesEntry);

  function itemsSummary(entry: ProductionPlanEntry) {
    const items = getProductionPlanItems(entry);
    if (items.length === 0) return "—";
    return items
      .map((it) => `${materialById.get(it.materialId)?.code ?? "?"} ×${it.qty}`)
      .join(", ");
  }

  const selectedOrderProduct = productById.get(details.productId);
  const orderProductHasNoBom =
    selectedOrderProduct && (selectedOrderProduct.bom?.length ?? 0) === 0;

  return (
    <div className="page">
      <section className="card">
        <h2>Materials consumed</h2>
        <p className="hint">
          Define how much of each raw material one unit of a product uses.
          The production plan multiplies this by the order quantity to
          project future purchasing needs — set this up once per product.
        </p>
        <div className="form-grid">
          <label className="span-2">
            Product
            <select value={bomProductId} onChange={(e) => selectBomProduct(e.target.value)}>
              <option value="">— select a product —</option>
              {productsByModel.map(([model, items]) => (
                <optgroup key={model} label={model}>
                  {items.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} — {p.name}
                      {p.bom?.length ? ` (${p.bom.length} materials set)` : ""}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>

          {bomProductId && (
            <>
              <label className="span-full">
                Raw materials per unit
                <input
                  value={bomPickerQuery}
                  onChange={(e) => setBomPickerQuery(e.target.value)}
                  placeholder="Search BOM items to add…"
                />
              </label>

              {bomLines.size > 0 && (
                <div className="span-full bom-chip-list">
                  {Array.from(bomLines, ([materialId, qty]) => (
                    <span key={materialId} className="bom-chip">
                      {materialById.get(materialId)?.code ?? "?"} ×{qty}
                      <button
                        type="button"
                        className="bom-chip-remove"
                        onClick={() => removeBomLine(materialId)}
                        aria-label="Remove"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div className="span-full bom-picker">
                {materials.length === 0 && (
                  <p className="empty">No BOM items yet — add some on the BOM page first.</p>
                )}
                {materials.length > 0 && filteredBomMaterials.length === 0 && (
                  <p className="empty">No BOM items match "{bomPickerQuery}".</p>
                )}
                {filteredBomMaterials.map((m) => {
                  const checked = bomLines.has(m.id);
                  return (
                    <div key={m.id} className="bom-picker-row">
                      <label className="bom-picker-check">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleBomLine(m.id)}
                        />
                        <span>
                          {m.code} — {m.name}
                        </span>
                      </label>
                      {checked && (
                        <input
                          type="number"
                          min={0}
                          className="bom-picker-qty"
                          value={bomLines.get(m.id)}
                          onChange={(e) => setBomLineQty(m.id, Number(e.target.value))}
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="form-actions span-2">
                <button type="button" onClick={saveBom} disabled={bomSaving}>
                  {bomSaving ? "Saving…" : "Save materials consumed"}
                </button>
                {bomSaved && <span className="hint hint-inline">Saved.</span>}
              </div>
            </>
          )}
        </div>
      </section>

      <section className="card">
        <h2>{editingId ? "Edit order" : "Add customer order"}</h2>
        <p className="hint">
          Pick the product a customer ordered and how many, and when it's
          needed by. Raw material demand is worked out automatically from
          the materials-consumed recipe above.
        </p>
        <form className="form-grid" onSubmit={onSubmit}>
          <label>
            Product
            <select
              value={details.productId}
              onChange={(e) => setDetails({ ...details, productId: e.target.value })}
            >
              <option value="">— select a product —</option>
              {productsByModel.map(([model, items]) => (
                <optgroup key={model} label={model}>
                  {items.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} — {p.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
          <label>
            Order qty
            <input
              type="number"
              min={1}
              value={details.productQty}
              onChange={(e) =>
                setDetails({ ...details, productQty: Number(e.target.value) })
              }
            />
          </label>
          <label>
            Needed by
            <input
              type="date"
              value={details.neededByDate}
              onChange={(e) =>
                setDetails({ ...details, neededByDate: e.target.value })
              }
            />
          </label>
          <label>
            Source / reference
            <input
              value={details.source}
              onChange={(e) => setDetails({ ...details, source: e.target.value })}
              placeholder="Customer PO #"
            />
          </label>
          <label className="span-2">
            Notes
            <input
              value={details.notes}
              onChange={(e) => setDetails({ ...details, notes: e.target.value })}
            />
          </label>

          {orderProductHasNoBom && (
            <p className="hint hint-inline span-2">
              This product has no materials consumed defined yet — this
              order won't show up in future purchasing suggestions until
              you set that up above.
            </p>
          )}

          {error && <div className="error span-2">{error}</div>}
          <div className="form-actions span-2">
            <button type="submit" disabled={saving}>
              {editingId ? "Save changes" : "Add to production plan"}
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
            placeholder="Search product, BOM item, source…"
          />
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Needed by</th>
                <th>Product</th>
                <th>Order qty</th>
                <th>Raw materials used</th>
                <th>Source</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((entry) => (
                <tr key={entry.id}>
                  <td>{entry.neededByDate}</td>
                  <td className="cell-wrap">{entry.productName || "—"}</td>
                  <td>{entry.productQty ?? "—"}</td>
                  <td className="cell-wrap">{itemsSummary(entry)}</td>
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
                  <td colSpan={6} className="empty">
                    No demand entries yet.
                  </td>
                </tr>
              )}
              {sorted.length > 0 && total === 0 && (
                <tr>
                  <td colSpan={6} className="empty">
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
