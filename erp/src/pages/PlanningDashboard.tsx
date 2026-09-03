import { Fragment, useMemo, useState } from "react";
import type { Material, MaterialPlan, ProductionPlanEntry, PurchaseOrder } from "../types";
import { computeAllPlans, getProductionPlanItems, isOrderDelayed } from "../lib/mrp";
import {
  IconAlert,
  IconBox,
  IconCheck,
  IconLayers,
  IconTruck,
} from "../components/icons";
import { usePagedSearch } from "../lib/pagination";
import { Pagination } from "../components/Pagination";
import { SearchBox } from "../components/SearchBox";

const matchesPlan = (plan: MaterialPlan, q: string) =>
  plan.material.code.toLowerCase().includes(q) ||
  plan.material.name.toLowerCase().includes(q);

type ProductConsumption = {
  product: Material;
  orderCount: number;
  totalQty: number;
  items: { materialId: string; qty: number }[];
};

export function PlanningDashboard({
  materials,
  products,
  purchaseOrders,
  productionPlan,
}: {
  materials: Material[];
  products: Material[];
  purchaseOrders: PurchaseOrder[];
  productionPlan: ProductionPlanEntry[];
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const plans = useMemo(
    () => computeAllPlans(materials, purchaseOrders, productionPlan),
    [materials, purchaseOrders, productionPlan],
  );

  const allSuggestions = plans
    .flatMap((p) => p.suggestions.map((s) => ({ ...s, material: p.material })))
    .sort((a, b) => a.orderByDate.localeCompare(b.orderByDate));

  const urgentCount = allSuggestions.filter((s) => s.urgent).length;
  const materialsToOrder = new Set(allSuggestions.map((s) => s.materialId)).size;
  const leadTimeMissingCount = plans.filter((p) => p.leadTimeMissing).length;
  const materialsOk = materials.length - materialsToOrder - leadTimeMissingCount;
  const delayedOrderCount = purchaseOrders.filter((po) => isOrderDelayed(po)).length;

  const suggestionsPaged = usePagedSearch(
    allSuggestions,
    (s, q) =>
      s.material.code.toLowerCase().includes(q) ||
      s.material.name.toLowerCase().includes(q),
  );
  const overviewPaged = usePagedSearch(plans, matchesPlan);

  const planById = useMemo(
    () => new Map(plans.map((p) => [p.material.id, p])),
    [plans],
  );
  const materialById = useMemo(
    () => new Map(materials.map((m) => [m.id, m])),
    [materials],
  );

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function renderDetailRow(materialId: string, colSpan: number) {
    if (!expanded.has(materialId)) return null;
    const plan = planById.get(materialId);
    if (!plan) return null;
    return (
      <tr className="detail-row">
        <td colSpan={colSpan}>
          {plan.buckets.length === 0 ? (
            <p className="empty">
              No incoming orders or demand scheduled for this inventory item.
            </p>
          ) : (
            <table className="detail-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Incoming</th>
                  <th>Demand</th>
                  <th>Projected balance</th>
                </tr>
              </thead>
              <tbody>
                {plan.buckets.map((b) => (
                  <tr key={b.date} className={b.belowSafetyStock ? "urgent-row" : ""}>
                    <td>{b.date}</td>
                    <td>{b.incoming ? `+${b.incoming}` : "—"}</td>
                    <td>{b.demand ? `-${b.demand}` : "—"}</td>
                    <td>{b.projectedBalance}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </td>
      </tr>
    );
  }

  const outstandingByMaterial = useMemo(() => {
    const map = new Map<string, number>();
    for (const po of purchaseOrders) {
      if (po.status !== "outstanding") continue;
      map.set(po.materialId, (map.get(po.materialId) ?? 0) + po.qty);
    }
    return map;
  }, [purchaseOrders]);

  // Rolls up every production plan entry's raw materials by product, so
  // "what does this product actually consume" can be read off the logged
  // orders instead of re-deriving it from scratch each time.
  const consumptionByProduct = useMemo(() => {
    const productById = new Map(products.map((p) => [p.id, p]));
    const map = new Map<
      string,
      { orderCount: number; totalQty: number; items: Map<string, number> }
    >();
    for (const entry of productionPlan) {
      if (!entry.productId || !productById.has(entry.productId)) continue;
      const bucket = map.get(entry.productId) ?? {
        orderCount: 0,
        totalQty: 0,
        items: new Map<string, number>(),
      };
      bucket.orderCount += 1;
      bucket.totalQty += entry.productQty ?? 0;
      for (const item of getProductionPlanItems(entry)) {
        bucket.items.set(item.materialId, (bucket.items.get(item.materialId) ?? 0) + item.qty);
      }
      map.set(entry.productId, bucket);
    }
    const rows: ProductConsumption[] = [];
    for (const [productId, bucket] of map) {
      const product = productById.get(productId);
      if (!product) continue;
      rows.push({
        product,
        orderCount: bucket.orderCount,
        totalQty: bucket.totalQty,
        items: Array.from(bucket.items, ([materialId, qty]) => ({ materialId, qty })),
      });
    }
    return rows.sort((a, b) => a.product.code.localeCompare(b.product.code));
  }, [products, productionPlan]);

  const matchesConsumption = (row: ProductConsumption, q: string) =>
    row.product.code.toLowerCase().includes(q) ||
    row.product.name.toLowerCase().includes(q);

  const consumptionPaged = usePagedSearch(consumptionByProduct, matchesConsumption);

  return (
    <div className="page">
      {materials.length > 0 && (
        <div className="stat-grid">
          <div className="stat-card">
            <span className="stat-icon">
              <IconBox />
            </span>
            <span className="stat-card-label">Inventory items tracked</span>
            <span className="stat-card-value">{materials.length}</span>
            <span className="stat-card-caption">In master data</span>
          </div>
          <div className="stat-card">
            <span className="stat-icon tone-running">
              <IconTruck />
            </span>
            <span className="stat-card-label">Need a new order</span>
            <span className="stat-card-value">{materialsToOrder}</span>
            <span className="stat-card-caption">Projected to fall short</span>
          </div>
          <div className="stat-card">
            <span className={`stat-icon ${urgentCount > 0 ? "tone-delayed" : "tone-done"}`}>
              <IconAlert />
            </span>
            <span className="stat-card-label">Urgent — order today</span>
            <span className="stat-card-value">{urgentCount}</span>
            <span className={`stat-card-caption ${urgentCount > 0 ? "tone-delayed" : ""}`}>
              {urgentCount > 0 ? "Order-by date already passed" : "Nothing overdue"}
            </span>
          </div>
          <div className="stat-card">
            <span className="stat-icon tone-done">
              <IconCheck />
            </span>
            <span className="stat-card-label">Fully covered</span>
            <span className="stat-card-value">{materialsOk}</span>
            <span className="stat-card-caption">Stock + incoming meet demand</span>
          </div>
          {delayedOrderCount > 0 && (
            <div className="stat-card">
              <span className="stat-icon tone-delayed">
                <IconTruck />
              </span>
              <span className="stat-card-label">Delayed orders</span>
              <span className="stat-card-value">{delayedOrderCount}</span>
              <span className="stat-card-caption tone-delayed">
                Past expected arrival, not received
              </span>
            </div>
          )}
          {leadTimeMissingCount > 0 && (
            <div className="stat-card">
              <span className="stat-icon tone-running">
                <IconLayers />
              </span>
              <span className="stat-card-label">Lead time not set</span>
              <span className="stat-card-value">{leadTimeMissingCount}</span>
              <span className="stat-card-caption">Can't suggest order dates yet</span>
            </div>
          )}
        </div>
      )}

      <section className="card">
        <div className="card-header-row">
          <h2>What to order, and by when</h2>
          {allSuggestions.length > 0 && (
            <SearchBox
              value={suggestionsPaged.query}
              onChange={suggestionsPaged.setQuery}
              placeholder="Search inventory item…"
            />
          )}
        </div>
        <p className="hint">
          For each inventory item this combines warehouse stock, outstanding
          orders not yet arrived, the production plan, and the item's own
          lead time to work out the last date you can place a new order
          before running short.
        </p>
        {materials.length === 0 ? (
          <p className="empty">
            Add inventory items (with their lead time) to see planning
            results here.
          </p>
        ) : allSuggestions.length === 0 ? (
          <p className="empty">
            {leadTimeMissingCount > 0
              ? `No shortfalls projected for inventory items with a lead time set. ${leadTimeMissingCount} item(s) still need a lead time before they can show up here — see Inventory overview below.`
              : "No shortfalls projected — stock and outstanding orders cover the current production plan."}
          </p>
        ) : (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Inventory item</th>
                    <th>Order by</th>
                    <th>Needed by</th>
                    <th>Suggested qty</th>
                    <th>Reason</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {suggestionsPaged.pageItems.map((s, i) => (
                    <Fragment key={`${s.materialId}-${i}`}>
                      <tr className={s.urgent ? "urgent-row" : ""}>
                        <td className="cell-wrap">
                          {s.material.code} — {s.material.name}
                        </td>
                        <td>
                          {s.urgent ? (
                            <span className="status-badge cancelled">
                              {s.orderByDate} (overdue)
                            </span>
                          ) : (
                            s.orderByDate
                          )}
                        </td>
                        <td>{s.neededByDate}</td>
                        <td>
                          {s.suggestedQty} {s.material.uom}
                        </td>
                        <td className="reason-cell">{s.reason}</td>
                        <td>
                          <button className="link" onClick={() => toggle(s.material.id)}>
                            {expanded.has(s.material.id) ? "Hide detail" : "Show detail"}
                          </button>
                        </td>
                      </tr>
                      {renderDetailRow(s.material.id, 6)}
                    </Fragment>
                  ))}
                  {suggestionsPaged.total === 0 && (
                    <tr>
                      <td colSpan={6} className="empty">
                        No inventory items match "{suggestionsPaged.query}".
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <Pagination
              page={suggestionsPaged.page}
              pageCount={suggestionsPaged.pageCount}
              total={suggestionsPaged.total}
              onChange={suggestionsPaged.setPage}
            />
            {leadTimeMissingCount > 0 && (
              <p className="hint hint-inline">
                {leadTimeMissingCount} more inventory item(s) are missing a
                lead time and are excluded from this list until it's set —
                see Inventory overview below.
              </p>
            )}
          </>
        )}
      </section>

      <section className="card">
        <div className="card-header-row">
          <h2>Materials consumed</h2>
          {consumptionByProduct.length > 0 && (
            <SearchBox
              value={consumptionPaged.query}
              onChange={consumptionPaged.setQuery}
              placeholder="Search product…"
            />
          )}
        </div>
        <p className="hint">
          Raw materials logged against each product's orders on the
          production plan, rolled up per product — this is what feeds the
          demand behind the purchasing suggestions above.
        </p>
        {consumptionByProduct.length === 0 ? (
          <p className="empty">
            No product orders with raw materials logged yet. Add "raw
            materials used" when logging a customer order on the Production
            Plan page to see consumption here.
          </p>
        ) : (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Orders</th>
                    <th>Total ordered</th>
                    <th>Raw materials consumed</th>
                  </tr>
                </thead>
                <tbody>
                  {consumptionPaged.pageItems.map((row) => (
                    <tr key={row.product.id}>
                      <td className="cell-wrap">
                        {row.product.code} — {row.product.name}
                      </td>
                      <td>{row.orderCount}</td>
                      <td>{row.totalQty}</td>
                      <td className="cell-wrap">
                        {row.items.length === 0 ? (
                          "—"
                        ) : (
                          <ul className="consumed-list">
                            {row.items.map((it) => (
                              <li key={it.materialId}>
                                {materialById.get(it.materialId)?.code ?? "?"} ×{it.qty}
                              </li>
                            ))}
                          </ul>
                        )}
                      </td>
                    </tr>
                  ))}
                  {consumptionPaged.total === 0 && (
                    <tr>
                      <td colSpan={4} className="empty">
                        No products match "{consumptionPaged.query}".
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <Pagination
              page={consumptionPaged.page}
              pageCount={consumptionPaged.pageCount}
              total={consumptionPaged.total}
              onChange={consumptionPaged.setPage}
            />
          </>
        )}
      </section>

      <section className="card">
        <div className="card-header-row">
          <h2>Inventory overview</h2>
          <SearchBox
            value={overviewPaged.query}
            onChange={overviewPaged.setQuery}
            placeholder="Search code, name…"
          />
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Inventory item</th>
                <th>Lead time</th>
                <th>On-hand</th>
                <th>Outstanding orders</th>
                <th>Safety stock</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {overviewPaged.pageItems.map((plan) => (
                <Fragment key={plan.material.id}>
                  <tr>
                    <td className="cell-wrap">
                      {plan.material.code} — {plan.material.name}
                    </td>
                    <td>
                      {plan.leadTimeMissing ? (
                        <span className="status-badge outstanding">Not set</span>
                      ) : (
                        `${plan.material.leadTimeDays} d`
                      )}
                    </td>
                    <td>{plan.material.onHandQty}</td>
                    <td>{outstandingByMaterial.get(plan.material.id) ?? 0}</td>
                    <td>{plan.material.safetyStock}</td>
                    <td>
                      <button className="link" onClick={() => toggle(plan.material.id)}>
                        {expanded.has(plan.material.id) ? "Hide detail" : "Show detail"}
                      </button>
                    </td>
                  </tr>
                  {renderDetailRow(plan.material.id, 6)}
                </Fragment>
              ))}
              {plans.length === 0 && (
                <tr>
                  <td colSpan={6} className="empty">
                    No inventory items yet.
                  </td>
                </tr>
              )}
              {plans.length > 0 && overviewPaged.total === 0 && (
                <tr>
                  <td colSpan={6} className="empty">
                    No inventory items match "{overviewPaged.query}".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          page={overviewPaged.page}
          pageCount={overviewPaged.pageCount}
          total={overviewPaged.total}
          onChange={overviewPaged.setPage}
        />
      </section>
    </div>
  );
}
