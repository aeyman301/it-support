import { Fragment, useMemo, useState } from "react";
import type { Material } from "../types";
import { updateMaterial } from "../lib/repo";
import { formatQty } from "../lib/format";
import { usePagedSearch } from "../lib/pagination";
import { Pagination } from "../components/Pagination";
import { SearchBox } from "../components/SearchBox";

/** Real recipes run to 80+ components, so the picker only renders a slice
 * of the inventory until the search narrows it down. */
const PICKER_LIMIT = 60;

export function BomPage({
  materials,
  products,
}: {
  materials: Material[];
  products: Material[];
}) {
  const [bomProductId, setBomProductId] = useState("");
  const [bomLines, setBomLines] = useState<Map<string, number>>(new Map());
  const [bomPickerQuery, setBomPickerQuery] = useState("");
  const [bomSaving, setBomSaving] = useState(false);
  const [bomSaved, setBomSaved] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

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

  const matchedMaterials = useMemo(() => {
    const q = bomPickerQuery.trim().toLowerCase();
    if (!q) return materials;
    return materials.filter(
      (m) =>
        m.code.toLowerCase().includes(q) || m.name.toLowerCase().includes(q),
    );
  }, [materials, bomPickerQuery]);

  const visibleMaterials = matchedMaterials.slice(0, PICKER_LIMIT);

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

  function toggleExpanded(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const overviewRows = useMemo(
    () => [...products].sort((a, b) => a.code.localeCompare(b.code)),
    [products],
  );

  const matchesProduct = (p: Material, q: string) =>
    p.code.toLowerCase().includes(q) ||
    p.name.toLowerCase().includes(q) ||
    (p.model?.toLowerCase().includes(q) ?? false);

  const { query, setQuery, page, setPage, pageCount, pageItems, total } =
    usePagedSearch(overviewRows, matchesProduct);

  const selectedProduct = productById.get(bomProductId);

  return (
    <div className="page">
      <section className="card">
        <div className="card-header-row">
          <h2>Define a product's recipe</h2>
          <select
            className="bom-product-select"
            value={bomProductId}
            onChange={(e) => selectBomProduct(e.target.value)}
          >
            <option value="">— select a product —</option>
            {productsByModel.map(([model, items]) => (
              <optgroup key={model} label={model}>
                {items.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} — {p.name}
                    {p.bom?.length ? ` (${p.bom.length})` : ""}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {!bomProductId ? (
          <p className="hint">
            How much of each raw material one unit of a product uses. The
            production plan's material forecast multiplies this by order
            quantity — set it up once per product.
          </p>
        ) : (
          <>
            <p className="hint hint-inline">
              {selectedProduct?.code} — {selectedProduct?.name} ·{" "}
              <strong>{bomLines.size}</strong> component(s) per unit
            </p>

            {bomLines.size > 0 && (
              <div className="bom-chip-list bom-chip-list-scroll">
                {Array.from(bomLines, ([materialId, qty]) => (
                  <span key={materialId} className="bom-chip">
                    {materialById.get(materialId)?.code ?? "?"} ×{formatQty(qty)}
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

            <input
              className="bom-picker-search"
              value={bomPickerQuery}
              onChange={(e) => setBomPickerQuery(e.target.value)}
              placeholder="Search inventory items to add…"
            />

            <div className="bom-picker">
              {materials.length === 0 && (
                <p className="empty">
                  No inventory items yet — add some on the Inventory Stock page first.
                </p>
              )}
              {materials.length > 0 && matchedMaterials.length === 0 && (
                <p className="empty">No inventory items match "{bomPickerQuery}".</p>
              )}
              {visibleMaterials.map((m) => {
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
                        step="any"
                        className="bom-picker-qty"
                        value={bomLines.get(m.id)}
                        onChange={(e) => setBomLineQty(m.id, Number(e.target.value))}
                      />
                    )}
                  </div>
                );
              })}
            </div>
            {matchedMaterials.length > PICKER_LIMIT && (
              <p className="hint hint-inline">
                Showing {PICKER_LIMIT} of {matchedMaterials.length} — search to narrow it down.
              </p>
            )}

            <div className="form-actions">
              <button type="button" onClick={saveBom} disabled={bomSaving}>
                {bomSaving ? "Saving…" : "Save recipe"}
              </button>
              <button type="button" className="secondary" onClick={() => selectBomProduct("")}>
                Close
              </button>
              {bomSaved && <span className="hint hint-inline">Saved.</span>}
            </div>
          </>
        )}
      </section>

      <section className="card">
        <div className="card-header-row">
          <h2>Bill of Materials ({products.length})</h2>
          <SearchBox
            value={query}
            onChange={setQuery}
            placeholder="Search product, model…"
          />
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Model</th>
                <th>Components</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((p) => {
                const count = p.bom?.length ?? 0;
                const isOpen = expanded.has(p.id);
                return (
                  <Fragment key={p.id}>
                    <tr>
                      <td className="cell-wrap">
                        {p.code} — {p.name}
                      </td>
                      <td>{p.model ?? "—"}</td>
                      <td>
                        {count === 0 ? (
                          <span className="status-badge outstanding">Not set</span>
                        ) : (
                          `${count} per unit`
                        )}
                      </td>
                      <td className="row-actions">
                        {count > 0 && (
                          <button className="link" onClick={() => toggleExpanded(p.id)}>
                            {isOpen ? "Hide" : "Show"}
                          </button>
                        )}
                        <button className="link" onClick={() => selectBomProduct(p.id)}>
                          Edit
                        </button>
                      </td>
                    </tr>
                    {isOpen && count > 0 && (
                      <tr className="detail-row">
                        <td colSpan={4}>
                          <div className="bom-detail-grid">
                            {p.bom!.map((line) => (
                              <span key={line.materialId}>
                                {materialById.get(line.materialId)?.code ?? line.materialId}
                                <strong> ×{formatQty(line.qty)}</strong>
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
              {products.length === 0 && (
                <tr>
                  <td colSpan={4} className="empty">
                    No products yet.
                  </td>
                </tr>
              )}
              {products.length > 0 && total === 0 && (
                <tr>
                  <td colSpan={4} className="empty">
                    No products match "{query}".
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
