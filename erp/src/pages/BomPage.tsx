import { useMemo, useState } from "react";
import type { Material } from "../types";
import { updateMaterial } from "../lib/repo";
import { usePagedSearch } from "../lib/pagination";
import { Pagination } from "../components/Pagination";
import { SearchBox } from "../components/SearchBox";

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

  return (
    <div className="page">
      <section className="card">
        <h2>Define a product's recipe</h2>
        <p className="hint">
          Pick a product and set how much of each raw material one unit of
          it uses. This is what the production plan's material forecast
          multiplies by order quantity to project future purchasing needs —
          set it up once per product.
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
                  placeholder="Search inventory items to add…"
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
                  <p className="empty">
                    No inventory items yet — add some on the Inventory Stock
                    page first.
                  </p>
                )}
                {materials.length > 0 && filteredBomMaterials.length === 0 && (
                  <p className="empty">No inventory items match "{bomPickerQuery}".</p>
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
                  {bomSaving ? "Saving…" : "Save recipe"}
                </button>
                {bomSaved && <span className="hint hint-inline">Saved.</span>}
              </div>
            </>
          )}

          {products.length === 0 && (
            <p className="empty span-2">
              No products yet — products are created from the Production
              Plan page's order picker, or imported directly.
            </p>
          )}
        </div>
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
                <th>Raw materials per unit</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((p) => (
                <tr key={p.id}>
                  <td className="cell-wrap">
                    {p.code} — {p.name}
                  </td>
                  <td>{p.model ?? "—"}</td>
                  <td className="cell-wrap">
                    {!p.bom || p.bom.length === 0 ? (
                      <span className="status-badge outstanding">Not set</span>
                    ) : (
                      <ul className="consumed-list">
                        {p.bom.map((line) => (
                          <li key={line.materialId}>
                            {materialById.get(line.materialId)?.code ?? "?"} ×{line.qty}
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                  <td className="row-actions">
                    <button className="link" onClick={() => selectBomProduct(p.id)}>
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
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
