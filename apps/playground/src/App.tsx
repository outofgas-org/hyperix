import { useState } from "react";
import { ActiveAssetDataDemo } from "./components/active-asset-data-demo";
import { AllDexsClearingHouseStateDemo } from "./components/all-dexs-clearing-house-state-demo";
import { AllDexsAssetCtxsDemo } from "./components/all-dexs-asset-ctxs-demo";
import { AllMidsDemo } from "./components/all-mids-demo";
import { HistoricalOrdersDemo } from "./components/historical-orders-demo";
import { MaxBuilderFeeDemo } from "./components/max-builder-fee-demo";
import { MetaDemo } from "./components/meta-demo";
import { PortfolioDemo } from "./components/portfolio-demo";
import { PerpMarketsDemo } from "./components/perp-markets-demo";
import { Footer } from "./components/footer";
import { MidDemo } from "./components/mid-demo";
import { OpenOrdersDemo } from "./components/open-orders-demo";
import { OrderbookDemo } from "./components/orderbook-demo";
import { PositionsDemo } from "./components/positions-demo";
import { SpotAssetCtxsDemo } from "./components/spot-asset-ctxs-demo";
import { UserFundingsDemo } from "./components/user-fundings-demo";
import { UserFillsDemo } from "./components/user-fills-demo";
import { UserNonFundingLedgerUpdatesDemo } from "./components/user-non-funding-ledger-updates-demo";

const DEMOS = [
  {
    id: "orderbook",
    label: "Orderbook",
    description: "Live L2 depth and spread movement.",
    component: OrderbookDemo,
  },
  {
    id: "all-mids",
    label: "All Mids",
    description: "Realtime mids across the full market set.",
    component: AllMidsDemo,
  },
  {
    id: "asset-ctxs",
    label: "All DEX Asset Ctxs",
    description: "Per-DEX market context snapshots.",
    component: AllDexsAssetCtxsDemo,
  },
  {
    id: "clearing-house",
    label: "Clearing House State",
    description: "Account state rollups across all DEXs.",
    component: AllDexsClearingHouseStateDemo,
  },
  {
    id: "market-meta",
    label: "Market Metadata",
    description: "Perp and spot metadata snapshots from info endpoints.",
    component: MetaDemo,
  },
  {
    id: "perp-markets",
    label: "Perp Markets",
    description: "Frontend-friendly perp list with live context merged in.",
    component: PerpMarketsDemo,
  },
  {
    id: "portfolio",
    label: "Portfolio",
    description: "Portfolio snapshots grouped by total and perp time windows.",
    component: PortfolioDemo,
  },
  {
    id: "max-builder-fee",
    label: "Max Builder Fee",
    description: "Check the approved max builder fee for a user and builder pair.",
    component: MaxBuilderFeeDemo,
  },
  {
    id: "active-asset",
    label: "Active Asset Data",
    description: "Focused stream for a single active asset.",
    component: ActiveAssetDataDemo,
  },
  {
    id: "mid",
    label: "Mid",
    description: "Single-market midpoint subscription.",
    component: MidDemo,
  },
  {
    id: "user-fundings",
    label: "User Fundings",
    description: "Funding ledger updates for a wallet.",
    component: UserFundingsDemo,
  },
  {
    id: "positions",
    label: "Positions",
    description: "Open positions aggregated across DEXs.",
    component: PositionsDemo,
  },
  {
    id: "spot-asset-ctxs",
    label: "Spot Asset Ctxs",
    description: "Realtime spot market context snapshots across all spot assets.",
    component: SpotAssetCtxsDemo,
  },
  {
    id: "ledger-updates",
    label: "Ledger Updates",
    description: "Non-funding balance and ledger changes.",
    component: UserNonFundingLedgerUpdatesDemo,
  },
  {
    id: "user-fills",
    label: "User Fills",
    description: "Latest execution stream for a wallet.",
    component: UserFillsDemo,
  },
  {
    id: "open-orders",
    label: "Open Orders",
    description: "Working orders and derived direction labels.",
    component: OpenOrdersDemo,
  },
  {
    id: "historical-orders",
    label: "Historical Orders",
    description: "Backfilled order history snapshots.",
    component: HistoricalOrdersDemo,
  },
] as const;

export function App() {
  const [selectedDemoId, setSelectedDemoId] = useState<(typeof DEMOS)[number]["id"]>("orderbook");
  const activeDemo = DEMOS.find((demo) => demo.id === selectedDemoId) ?? DEMOS[0];
  const ActiveDemoComponent = activeDemo.component;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,#fff9ef_0%,#f8f5ef_34%,#eef4f8_100%)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="container relative z-10 mx-auto space-y-8">
        <header className="space-y-3">
          <div className="inline-flex items-center rounded-full border border-stone-200 bg-white/80 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-stone-500">
            Playground
          </div>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold tracking-tight text-stone-900">Hyperix</h1>
              <p className="max-w-2xl text-sm text-stone-600">
                Browse hook demos from a single workspace. Pick a feature from the sidebar to
                focus on one stream at a time.
              </p>
            </div>
            <div className="rounded-3xl border border-stone-200 bg-white/75 px-4 py-3 text-sm text-stone-600 shadow-[0_18px_70px_-40px_rgba(20,24,12,0.35)]">
              <span className="font-medium text-stone-900">{DEMOS.length}</span> interactive demos
            </div>
          </div>
        </header>

        <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="xl:sticky xl:top-6 xl:self-start">
            <div className="overflow-hidden rounded-[32px] border border-stone-200 bg-white/80 shadow-[0_18px_70px_-40px_rgba(20,24,12,0.35)] backdrop-blur">
              <div className="border-b border-stone-200 px-5 py-4">
                <div className="text-xs font-medium uppercase tracking-[0.18em] text-stone-400">
                  Features
                </div>
                <div className="mt-2 text-lg font-semibold text-stone-900">
                  Select a demo
                </div>
              </div>
              <nav className="flex gap-3 overflow-x-auto px-3 py-3 xl:max-h-[calc(100vh-8rem)] xl:flex-col xl:overflow-y-auto xl:overflow-x-hidden">
                {DEMOS.map((demo) => {
                  const isActive = demo.id === activeDemo.id;

                  return (
                    <button
                      key={demo.id}
                      className={`min-w-[220px] rounded-[24px] border px-4 py-3 text-left transition xl:min-w-0 ${
                        isActive
                          ? "border-stone-900 bg-stone-900 text-white shadow-[0_18px_45px_-30px_rgba(20,24,12,0.75)]"
                          : "border-stone-200 bg-stone-50/80 text-stone-700 hover:border-stone-300 hover:bg-white"
                      }`}
                      onClick={() => {
                        setSelectedDemoId(demo.id);
                      }}
                      type="button"
                    >
                      <div className="text-sm font-semibold">{demo.label}</div>
                      <div
                        className={`mt-1 text-xs leading-5 ${
                          isActive ? "text-stone-200" : "text-stone-500"
                        }`}
                      >
                        {demo.description}
                      </div>
                    </button>
                  );
                })}
              </nav>
            </div>
          </aside>

          <section className="space-y-6">
            <div className="rounded-[32px] border border-stone-200 bg-white/65 p-5 shadow-[0_18px_70px_-40px_rgba(20,24,12,0.35)] backdrop-blur">
              <div className="text-xs font-medium uppercase tracking-[0.18em] text-stone-400">
                Active Demo
              </div>
              <div className="mt-2 text-2xl font-semibold text-stone-900">{activeDemo.label}</div>
              <p className="mt-2 max-w-2xl text-sm text-stone-600">{activeDemo.description}</p>
            </div>

            <ActiveDemoComponent />
          </section>
        </div>

        <Footer technologies={["Bun", "React", "TypeScript", "Tailwind"]} />
      </div>
    </main>
  );
}
