import { useEffect, useState } from "react";
import { authReady, firebaseConfigured } from "./lib/firebase";
import {
  watchMaterials,
  watchProductionPlan,
  watchPurchaseOrders,
} from "./lib/repo";
import type { Material, ProductionPlanEntry, PurchaseOrder } from "./types";
import { PlanningDashboard } from "./pages/PlanningDashboard";
import { MaterialsPage } from "./pages/MaterialsPage";
import { PurchaseOrdersPage } from "./pages/PurchaseOrdersPage";
import { ProductionPlanPage } from "./pages/ProductionPlanPage";

type Tab = "planning" | "materials" | "orders" | "plan";

const TABS: { id: Tab; label: string }[] = [
  { id: "planning", label: "Planning Dashboard" },
  { id: "materials", label: "Materials & Lead Time" },
  { id: "orders", label: "Outstanding Orders" },
  { id: "plan", label: "Production Plan" },
];

export default function App() {
  const [tab, setTab] = useState<Tab>("planning");
  const [materials, setMaterials] = useState<Material[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [productionPlan, setProductionPlan] = useState<ProductionPlanEntry[]>(
    [],
  );
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!firebaseConfigured) return;
    let unsubs: (() => void)[] = [];
    authReady.then(() => {
      unsubs = [
        watchMaterials(setMaterials),
        watchPurchaseOrders(setPurchaseOrders),
        watchProductionPlan(setProductionPlan),
      ];
      setReady(true);
    });
    return () => unsubs.forEach((u) => u());
  }, []);

  if (!firebaseConfigured) {
    return (
      <div className="app-shell">
        <header className="app-header">
          <div>
            <h1>Material Planning</h1>
            <p className="subtitle">
              Stock, outstanding orders, production plan and
              material-specific lead time, in one place.
            </p>
          </div>
        </header>
        <div className="card">
          <h2>Connect your Firebase project</h2>
          <p className="hint">
            No Firebase configuration was found. Copy{" "}
            <code>erp/.env.example</code> to <code>erp/.env.local</code>,
            fill in the values from your Firebase project's web app config,
            then restart the dev server. See <code>erp/README.md</code> for
            the full setup steps (creating the project, enabling Firestore
            and anonymous auth, deploying the security rules).
          </p>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="app-shell">
        <p className="hint">Connecting…</p>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <h1>Material Planning</h1>
          <p className="subtitle">
            Stock, outstanding orders, production plan and material-specific
            lead time, in one place.
          </p>
        </div>
      </header>

      <nav className="tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={t.id === tab ? "tab active" : "tab"}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main className="app-main">
        {tab === "planning" && (
          <PlanningDashboard
            materials={materials}
            purchaseOrders={purchaseOrders}
            productionPlan={productionPlan}
          />
        )}
        {tab === "materials" && <MaterialsPage materials={materials} />}
        {tab === "orders" && (
          <PurchaseOrdersPage
            materials={materials}
            purchaseOrders={purchaseOrders}
          />
        )}
        {tab === "plan" && (
          <ProductionPlanPage
            materials={materials}
            productionPlan={productionPlan}
          />
        )}
      </main>
    </div>
  );
}
