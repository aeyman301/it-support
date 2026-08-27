import { useMemo, useState } from "react";
import type { Material, ProductionPlanEntry, PurchaseOrder } from "../types";
import { computeAllPlans } from "../lib/mrp";

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
      <section className="card">
        <h2>What to order, and by when</h2>
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
            No shortfalls projected — stock and outstanding orders cover the
            current production plan.
          </p>
        ) : (
          <>
            <div className="summary-row">
              <div className="stat">
                <span className="stat-value">{allSuggestions.length}</span>
                <span className="stat-label">materials to order</span>
              </div>
              <div className={`stat ${urgentCount > 0 ? "stat-urgent" : ""}`}>
                <span className="stat-value">{urgentCount}</span>
                <span className="stat-label">urgent (order today)</span>
              </div>
            </div>
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
                  {allSuggestions.map((s, i) => (
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
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      <section className="card">
        <h2>Material overview</h2>
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
              {plans.map((plan) => (
                <tr key={plan.material.id}>
                  <td>
                    {plan.material.code} — {plan.material.name}
                  </td>
                  <td>{plan.material.leadTimeDays} d</td>
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
            </tbody>
          </table>
        </div>
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
