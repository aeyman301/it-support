import { useEffect, useState, type ComponentType } from "react";
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
import { IconGrid, IconBox, IconTruck, IconClipboard } from "./components/icons";

type Tab = "planning" | "materials" | "orders" | "plan";

const TABS: {
  id: Tab;
  label: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
}[] = [
  {
    id: "planning",
    label: "Planning Dashboard",
    description: "What to order, and by when.",
    icon: IconGrid,
  },
  {
    id: "materials",
    label: "Materials & Lead Time",
    description: "Master data, stock and lead time per material.",
    icon: IconBox,
  },
  {
    id: "orders",
    label: "Outstanding Orders",
    description: "Purchase orders placed but not yet received.",
    icon: IconTruck,
  },
  {
    id: "plan",
    label: "Production Plan",
    description: "What production needs, and by when.",
    icon: IconClipboard,
  },
];

const dateMeta = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
}).format(new Date());

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
            <span className="brand-eyebrow">PNA Technologies</span>
            <span className="brand-name">Material Planning</span>
          </div>
        </div>

        <div className="side-section-label">Workspace</div>
        <nav className="side-nav">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                className={t.id === tab ? "side-link active" : "side-link"}
                onClick={() => setTab(t.id)}
              >
                <Icon />
                {t.label}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-spacer" />

        <div className="sidebar-footer">
          <span className="status-dot" />
          <span>Firestore connected</span>
        </div>
      </aside>

      <div className="app-body">
        <div className="top-bar">
          <div className="breadcrumb">
            Material Planning / <strong>{activeTab.label}</strong>
          </div>
        </div>

        <div className="page-header">
          <div className="page-meta">{dateMeta}</div>
          <h1>{activeTab.label}</h1>
          <p className="hint">{activeTab.description}</p>
        </div>

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
