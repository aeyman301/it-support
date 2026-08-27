import { useMemo, useState } from "react";
import type { Material, MaterialPlan, ProductionPlanEntry, PurchaseOrder } from "../types";
import { computeAllPlans } from "../lib/mrp";
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

export function PlanningDashboard({
  materials,
  purchaseOrders,
  productionPlan,
}: {
  materials: Material[];
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

  const suggestionsPaged = usePagedSearch(
    allSuggestions,
    (s, q) =>
      s.material.code.toLowerCase().includes(q) ||
      s.material.name.toLowerCase().includes(q),
  );
  const overviewPaged = usePagedSearch(plans, matchesPlan);

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const outstandingByMaterial = useMemo(() => {
    const map = new Map<string, number>();
    for (const po of purchaseOrders) {
      if (po.status !== "outstanding") continue;
      map.set(po.materialId, (map.get(po.materialId) ?? 0) + po.qty);
    }
    return map;
  }, [purchaseOrders]);

  return (
    <div className="page">
      {materials.length > 0 && (
        <div className="stat-grid">
          <div className="stat-card">
            <span className="stat-icon">
              <IconBox />
            </span>
            <span className="stat-card-label">Materials tracked</span>
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
              placeholder="Search material…"
            />
          )}
        </div>
        <p className="hint">
          For each material this combines warehouse stock, outstanding
          orders not yet arrived, the production plan, and the material's own
          lead time to work out the last date you can place a new order
          before running short.
        </p>
        {materials.length === 0 ? (
          <p className="empty">
            Add materials (with their lead time) to see planning results here.
          </p>
        ) : allSuggestions.length === 0 ? (
          <p className="empty">
            {leadTimeMissingCount > 0
              ? `No shortfalls projected for materials with a lead time set. ${leadTimeMissingCount} material(s) still need a lead time before they can show up here — see Material overview below.`
              : "No shortfalls projected — stock and outstanding orders cover the current production plan."}
          </p>
        ) : (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Material</th>
                    <th>Order by</th>
                    <th>Needed by</th>
                    <th>Suggested qty</th>
                    <th>Reason</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {suggestionsPaged.pageItems.map((s, i) => (
                    <tr key={`${s.materialId}-${i}`} className={s.urgent ? "urgent-row" : ""}>
                      <td>
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
                  ))}
                  {suggestionsPaged.total === 0 && (
                    <tr>
                      <td colSpan={6} className="empty">
                        No materials match "{suggestionsPaged.query}".
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
                {leadTimeMissingCount} more material(s) are missing a lead
                time and are excluded from this list until it's set — see
                Material overview below.
              </p>
            )}
          </>
        )}
      </section>

      <section className="card">
        <div className="card-header-row">
          <h2>Material overview</h2>
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
                <th>Material</th>
                <th>Lead time</th>
                <th>On-hand</th>
                <th>Outstanding orders</th>
                <th>Safety stock</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {overviewPaged.pageItems.map((plan) => (
                <tr key={plan.material.id}>
                  <td>
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
              ))}
              {plans.length === 0 && (
                <tr>
                  <td colSpan={6} className="empty">
                    No materials yet.
                  </td>
                </tr>
              )}
              {plans.length > 0 && overviewPaged.total === 0 && (
                <tr>
                  <td colSpan={6} className="empty">
                    No materials match "{overviewPaged.query}".
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

      {plans
        .filter((p) => expanded.has(p.material.id))
        .map((plan) => (
          <section className="card" key={plan.material.id}>
            <h3>
              {plan.material.code} — {plan.material.name}: projected balance
            </h3>
            {plan.buckets.length === 0 ? (
              <p className="empty">
                No incoming orders or demand scheduled for this material.
              </p>
            ) : (
              <div className="table-wrap">
                <table>
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
              </div>
            )}
          </section>
        ))}
    </div>
  );
}
