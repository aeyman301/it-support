import { useEffect, useMemo, useState, type ComponentType } from "react";
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
import {
  IconGrid,
  IconBox,
  IconTruck,
  IconClipboard,
  IconMenu,
  IconX,
} from "./components/icons";
import pnaLogo from "./assets/pna-logo.png";

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
    label: "BOM & Lead Time",
    description: "Master data, stock and lead time per BOM item.",
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
  const [navOpen, setNavOpen] = useState(false);

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

  // Products (finished goods sold to customers) live in the same collection
  // as raw materials, tagged by kind — split them apart here so the BOM,
  // purchasing, and planning views never see the 70-odd product codes, and
  // the production plan's product picker never sees raw materials.
  const rawMaterials = useMemo(
    () => materials.filter((m) => m.kind !== "product"),
    [materials],
  );
  const products = useMemo(
    () => materials.filter((m) => m.kind === "product"),
    [materials],
  );

  if (!firebaseConfigured) {
    return (
      <div className="boot-screen">
        <img className="boot-mark" src={pnaLogo} alt="PNA Technologies" />
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
        <img className="boot-mark" src={pnaLogo} alt="PNA Technologies" />
        <p className="hint">Connecting to Firestore&hellip;</p>
      </div>
    );
  }

  const activeTab = TABS.find((t) => t.id === tab)!;

  function selectTab(id: Tab) {
    setTab(id);
    setNavOpen(false);
  }

  return (
    <div className="app-shell">
      {navOpen && (
        <div className="mobile-backdrop" onClick={() => setNavOpen(false)} />
      )}

      <aside className={navOpen ? "app-sidebar mobile-open" : "app-sidebar"}>
        <div className="brand">
          <img className="brand-mark" src={pnaLogo} alt="PNA Technologies" />
          <div className="brand-text">
            <span className="brand-eyebrow">PNA Technologies</span>
            <span className="brand-name">Material Planning</span>
          </div>
          <button
            className="mobile-nav-close"
            onClick={() => setNavOpen(false)}
            aria-label="Close menu"
          >
            <IconX />
          </button>
        </div>

        <div className="side-section-label">Workspace</div>
        <nav className="side-nav">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                className={t.id === tab ? "side-link active" : "side-link"}
                onClick={() => selectTab(t.id)}
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
          <button
            className="mobile-nav-toggle"
            onClick={() => setNavOpen(true)}
            aria-label="Open menu"
          >
            <IconMenu />
          </button>
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
              materials={rawMaterials}
              products={products}
              purchaseOrders={purchaseOrders}
              productionPlan={productionPlan}
            />
          )}
          {tab === "materials" && <MaterialsPage materials={rawMaterials} />}
          {tab === "orders" && (
            <PurchaseOrdersPage
              materials={rawMaterials}
              purchaseOrders={purchaseOrders}
            />
          )}
          {tab === "plan" && (
            <ProductionPlanPage
              materials={rawMaterials}
              products={products}
              productionPlan={productionPlan}
            />
          )}
        </main>
      </div>
    </div>
  );
}
