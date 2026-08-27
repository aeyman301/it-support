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

const TABS: { id: Tab; code: string; label: string; description: string }[] = [
  {
    id: "planning",
    code: "01",
    label: "Planning Dashboard",
    description: "Order signals",
  },
  {
    id: "materials",
    code: "02",
    label: "Materials & Lead Time",
    description: "Master data",
  },
  {
    id: "orders",
    code: "03",
    label: "Outstanding Orders",
    description: "Incoming stock",
  },
  {
    id: "plan",
    code: "04",
    label: "Production Plan",
    description: "Demand",
  },
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
      <div className="boot-screen">
        <div className="boot-mark">MP</div>
        <div className="card boot-card">
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
      <div className="boot-screen">
        <div className="boot-mark">MP</div>
        <p className="hint">Connecting to Firestore&hellip;</p>
      </div>
    );
  }

  const activeTab = TABS.find((t) => t.id === tab)!;

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="brand">
          <span className="brand-mark">MP</span>
          <div className="brand-text">
            <span className="brand-name">Material Planning</span>
            <span className="brand-tag">Supply &amp; Ops Console</span>
          </div>
        </div>

        <nav className="side-nav">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={t.id === tab ? "side-link active" : "side-link"}
              onClick={() => setTab(t.id)}
            >
              <span className="side-link-code">{t.code}</span>
              <span className="side-link-text">
                <span className="side-link-label">{t.label}</span>
                <span className="side-link-desc">{t.description}</span>
              </span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <span className="status-dot" />
          <span>Firestore connected</span>
        </div>
      </aside>

      <div className="app-body">
        <header className="app-header">
          <div className="header-eyebrow">
            {activeTab.code} / {String(TABS.length).padStart(2, "0")}
          </div>
          <h1>{activeTab.label}</h1>
        </header>

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
    </div>
  );
}
