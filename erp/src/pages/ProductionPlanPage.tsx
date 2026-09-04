import { endOfMonth, format, startOfMonth } from "date-fns";
import { useMemo, useState } from "react";
import type { Material, ProductionPlanEntry } from "../types";
import {
  createProductionPlanEntry,
  deleteProductionPlanEntry,
  updateProductionPlanEntry,
} from "../lib/repo";
import { getProductionPlanItems, isoToday } from "../lib/mrp";
import { formatQty } from "../lib/format";
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
  const [selectedItems, setSelectedItems] = useState<Map<string, number>>(new Map());
  const [pickerQuery, setPickerQuery] = useState("");
  const [showMaterials, setShowMaterials] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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

  const filteredMaterials = useMemo(() => {
    const q = pickerQuery.trim().toLowerCase();
    if (!q) return materials;
    return materials.filter(
      (m) =>
        m.code.toLowerCase().includes(q) || m.name.toLowerCase().includes(q),
    );
  }, [materials, pickerQuery]);

  function toggleItem(materialId: string) {
    setSelectedItems((prev) => {
      const next = new Map(prev);
      if (next.has(materialId)) next.delete(materialId);
      else next.set(materialId, 1);
      return next;
    });
  }

  function setItemQty(materialId: string, qty: number) {
    setSelectedItems((prev) => new Map(prev).set(materialId, qty));
  }

  function removeItem(materialId: string) {
    setSelectedItems((prev) => {
      const next = new Map(prev);
      next.delete(materialId);
      return next;
    });
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
    const items = getProductionPlanItems(entry);
    setSelectedItems(new Map(items.map((it) => [it.materialId, it.qty])));
    setShowMaterials(items.length > 0);
    setPickerQuery("");
  }

  function resetForm() {
    setEditingId(null);
    setDetails(emptyDetails);
    setSelectedItems(new Map());
    setShowMaterials(false);
    setPickerQuery("");
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
      const items = Array.from(selectedItems, ([materialId, qty]) => ({
        materialId,
        qty,
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

  const monthRange = useMemo(() => {
    const now = new Date();
    return {
      start: format(startOfMonth(now), "yyyy-MM-dd"),
      end: format(endOfMonth(now), "yyyy-MM-dd"),
      label: format(now, "MMMM yyyy"),
    };
  }, []);

  const currentMonthEntries = useMemo(
    () =>
      productionPlan.filter(
        (e) => e.neededByDate >= monthRange.start && e.neededByDate <= monthRange.end,
      ),
    [productionPlan, monthRange],
  );

  // Explodes each of this month's orders through its product's Bill of
  // Materials recipe (qty per unit × order qty) and rolls the result up per
  // raw material, so buyers can see this month's total demand at a glance
  // instead of adding it up order by order.
  const materialForecast = useMemo(() => {
    const totals = new Map<string, number>();
    let entriesWithoutBom = 0;
    for (const entry of currentMonthEntries) {
      const product = entry.productId ? productById.get(entry.productId) : undefined;
      const bom = product?.bom ?? [];
      if (bom.length === 0) {
        entriesWithoutBom += 1;
        continue;
      }
      const qty = entry.productQty ?? 0;
      for (const line of bom) {
        totals.set(line.materialId, (totals.get(line.materialId) ?? 0) + line.qty * qty);
      }
    }
    const rows = Array.from(totals, ([materialId, forecastQty]) => {
      const material = materialById.get(materialId);
      const onHand = material?.onHandQty ?? 0;
      return {
        materialId,
        material,
        forecastQty,
        onHand,
        shortfall: Math.max(0, forecastQty - onHand),
      };
    }).sort((a, b) => b.shortfall - a.shortfall || b.forecastQty - a.forecastQty);
    return { rows, entriesWithoutBom };
  }, [currentMonthEntries, productById, materialById]);

  // A month's plan explodes into hundreds of materials, so the forecast gets
  // the same search + paging treatment as every other long table here.
  const forecastPaged = usePagedSearch(
    materialForecast.rows,
    (row, q) =>
      (row.material?.code.toLowerCase().includes(q) ?? false) ||
      (row.material?.name.toLowerCase().includes(q) ?? false) ||
      row.materialId.toLowerCase().includes(q),
  );

  function itemsSummary(entry: ProductionPlanEntry) {
    const items = getProductionPlanItems(entry);
    if (items.length === 0) return "—";
    return items
      .map((it) => `${materialById.get(it.materialId)?.code ?? "?"} ×${formatQty(it.qty)}`)
      .join(", ");
  }

  return (
    <div className="page">
      <section className="card">
        <h2>Current month planning — {monthRange.label}</h2>
        <p className="hint">
          Orders needed this month, exploded through each product's Bill of
          Materials recipe to forecast raw material demand.
        </p>
        {currentMonthEntries.length === 0 ? (
          <p className="empty">No orders needed this month yet.</p>
        ) : (
          <>
            <p className="hint hint-inline">
              {currentMonthEntries.length} order(s) needed this month,
              totaling{" "}
              {currentMonthEntries.reduce((sum, e) => sum + (e.productQty ?? 0), 0)}{" "}
              unit(s).
            </p>

            <div className="card-header-row">
              <h3>Material forecast ({materialForecast.rows.length})</h3>
              {materialForecast.rows.length > 0 && (
                <SearchBox
                  value={forecastPaged.query}
                  onChange={forecastPaged.setQuery}
                  placeholder="Search inventory item…"
                />
              )}
            </div>
            {materialForecast.rows.length === 0 ? (
              <p className="empty">
                None of this month's products have a Bill of Materials
                recipe defined yet — set one up on the Bill of Materials
                page to see a forecast here.
              </p>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Inventory item</th>
                      <th>Forecasted demand</th>
                      <th>On-hand</th>
                      <th>Projected shortfall</th>
                    </tr>
                  </thead>
                  <tbody>
                    {forecastPaged.pageItems.map((row) => (
                      <tr key={row.materialId} className={row.shortfall > 0 ? "urgent-row" : ""}>
                        <td className="cell-wrap">
                          {row.material?.code ?? row.materialId} —{" "}
                          {row.material?.name ?? "Unknown item"}
                        </td>
                        <td>{formatQty(row.forecastQty)}</td>
                        <td>{formatQty(row.onHand)}</td>
                        <td>
                          {row.shortfall > 0 ? (
                            <span className="status-badge cancelled">
                              {formatQty(row.shortfall)} short
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    ))}
                    {forecastPaged.total === 0 && (
                      <tr>
                        <td colSpan={4} className="empty">
                          No inventory items match "{forecastPaged.query}".
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
            {materialForecast.rows.length > 0 && (
              <Pagination
                page={forecastPaged.page}
                pageCount={forecastPaged.pageCount}
                total={forecastPaged.total}
                onChange={forecastPaged.setPage}
              />
            )}
            {materialForecast.entriesWithoutBom > 0 && (
              <p className="hint hint-inline">
                {materialForecast.entriesWithoutBom} of this month's order(s)
                are for products without a Bill of Materials recipe yet, so
                they're excluded from the forecast above.
              </p>
            )}
          </>
        )}
      </section>

      <section className="card">
        <h2>{editingId ? "Edit order" : "Add customer order"}</h2>
        <p className="hint">
          Pick the product a customer ordered and how many, and when it's
          needed by. This lands on the production plan so it can be worked
          against stock and outstanding orders.
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

          {error && <div className="error span-2">{error}</div>}

          <div className="span-full">
            <button
              type="button"
              className="link"
              onClick={() => setShowMaterials((v) => !v)}
            >
              {showMaterials ? "Hide" : "Add"} raw materials used (optional)
            </button>
          </div>

          {showMaterials && (
            <>
              <label className="span-full">
                Raw materials
                <input
                  value={pickerQuery}
                  onChange={(e) => setPickerQuery(e.target.value)}
                  placeholder="Search inventory items to add…"
                />
              </label>

              {selectedItems.size > 0 && (
                <div className="span-full bom-chip-list">
                  {Array.from(selectedItems, ([materialId, qty]) => (
                    <span key={materialId} className="bom-chip">
                      {materialById.get(materialId)?.code ?? "?"} ×{qty}
                      <button
                        type="button"
                        className="bom-chip-remove"
                        onClick={() => removeItem(materialId)}
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
                {materials.length > 0 && filteredMaterials.length === 0 && (
                  <p className="empty">No inventory items match "{pickerQuery}".</p>
                )}
                {filteredMaterials.map((m) => {
                  const checked = selectedItems.has(m.id);
                  return (
                    <div key={m.id} className="bom-picker-row">
                      <label className="bom-picker-check">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleItem(m.id)}
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
                          value={selectedItems.get(m.id)}
                          onChange={(e) => setItemQty(m.id, Number(e.target.value))}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}

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
            placeholder="Search product, inventory item, source…"
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
