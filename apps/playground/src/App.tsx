import { useEffect, useState } from "react";
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
import { SpotMarketsDemo } from "./components/spot-markets-demo";
import { SpotMetaAndAssetCtxsDemo } from "./components/spot-meta-and-asset-ctxs-demo";
import { SpotStateDemo } from "./components/spot-state-demo";
import { TwapStatesDemo } from "./components/twap-states-demo";
import { UserFundingsDemo } from "./components/user-fundings-demo";
import { UserFillsDemo } from "./components/user-fills-demo";
import { UserDelegatorSummaryDemo } from "./components/user-delegator-summary-demo";
import { UserTwapHistoryDemo } from "./components/user-twap-history-demo";
import { UserTwapSliceFillsDemo } from "./components/user-twap-slice-fills-demo";
import { UserNonFundingLedgerUpdatesDemo } from "./components/user-non-funding-ledger-updates-demo";
import { UserVaultEquitiesDemo } from "./components/user-vault-equities-demo";

const DEMOS = [
  {
    id: "orderbook",
    label: "Orderbook",
    description: "Live L2 depth and spread movement.",
    component: OrderbookDemo,
    category: "subscription",
    streamType: "perps",
  },
  {
    id: "all-mids",
    label: "All Mids",
    description: "Realtime mids across the full market set.",
    component: AllMidsDemo,
    category: "subscription",
    streamType: "perps",
  },
  {
    id: "asset-ctxs",
    label: "All DEX Asset Ctxs",
    description: "Per-DEX market context snapshots.",
    component: AllDexsAssetCtxsDemo,
    category: "subscription",
    streamType: "perps",
  },
  {
    id: "clearing-house",
    label: "Clearing House State",
    description: "Account state rollups across all DEXs.",
    component: AllDexsClearingHouseStateDemo,
    category: "subscription",
    streamType: "perps",
  },
  {
    id: "market-meta",
    label: "Market Metadata",
    description: "Perp and spot metadata snapshots from info endpoints.",
    component: MetaDemo,
    category: "info",
  },
  {
    id: "perp-markets",
    label: "Perp Markets",
    description: "Frontend-friendly perp list with live context merged in.",
    component: PerpMarketsDemo,
    category: "subscription",
    streamType: "perps",
  },
  {
    id: "portfolio",
    label: "Portfolio",
    description: "Portfolio snapshots grouped by total and perp time windows.",
    component: PortfolioDemo,
    category: "info",
  },
  {
    id: "max-builder-fee",
    label: "Max Builder Fee",
    description: "Check the approved max builder fee for a user and builder pair.",
    component: MaxBuilderFeeDemo,
    category: "info",
  },
  {
    id: "active-asset",
    label: "Active Asset Data",
    description: "Focused stream for a single active asset.",
    component: ActiveAssetDataDemo,
    category: "subscription",
    streamType: "perps",
  },
  {
    id: "mid",
    label: "Mid",
    description: "Single-market midpoint subscription.",
    component: MidDemo,
    category: "subscription",
    streamType: "perps",
  },
  {
    id: "user-fundings",
    label: "User Fundings",
    description: "Funding ledger updates for a wallet.",
    component: UserFundingsDemo,
    category: "subscription",
    streamType: "perps",
  },
  {
    id: "user-delegator-summary",
    label: "User Delegator Summary",
    description: "Staking balances and pending withdrawal totals for a wallet.",
    component: UserDelegatorSummaryDemo,
    category: "info",
  },
  {
    id: "user-vault-equities",
    label: "User Vault Equities",
    description: "Vault deposit balances and lock status for a wallet.",
    component: UserVaultEquitiesDemo,
    category: "info",
  },
  {
    id: "positions",
    label: "Positions",
    description: "Open positions aggregated across DEXs.",
    component: PositionsDemo,
    category: "subscription",
    streamType: "perps",
  },
  {
    id: "spot-markets",
    label: "Spot Markets",
    description: "Frontend-friendly spot list with live context merged in.",
    component: SpotMarketsDemo,
    category: "subscription",
    streamType: "spot",
  },
  {
    id: "spot-asset-ctxs",
    label: "Spot Asset Ctxs",
    description: "Realtime spot market context snapshots across all spot assets.",
    component: SpotAssetCtxsDemo,
    category: "subscription",
    streamType: "spot",
  },
  {
    id: "spot-meta-and-asset-ctxs",
    label: "Spot Meta + Asset Ctxs",
    description: "Combined spot metadata and spot asset context snapshot from one info query.",
    component: SpotMetaAndAssetCtxsDemo,
    category: "info",
  },
  {
    id: "spot-state",
    label: "Spot State",
    description: "Wallet spot balances and escrow state as a live websocket stream.",
    component: SpotStateDemo,
    category: "subscription",
    streamType: "spot",
  },
  {
    id: "twap-states",
    label: "TWAP States",
    description: "Live TWAP execution state for a tracked wallet.",
    component: TwapStatesDemo,
    category: "subscription",
    streamType: "perps",
  },
  {
    id: "ledger-updates",
    label: "Ledger Updates",
    description: "Non-funding balance and ledger changes.",
    component: UserNonFundingLedgerUpdatesDemo,
    category: "subscription",
    streamType: "perps",
  },
  {
    id: "user-fills",
    label: "User Fills",
    description: "Latest execution stream for a wallet.",
    component: UserFillsDemo,
    category: "subscription",
    streamType: "perps",
  },
  {
    id: "user-twap-history",
    label: "User TWAP History",
    description: "Merged TWAP history stream for a tracked wallet.",
    component: UserTwapHistoryDemo,
    category: "subscription",
    streamType: "perps",
  },
  {
    id: "user-twap-slice-fills",
    label: "User TWAP Slice Fills",
    description: "Merged TWAP slice fill stream for a tracked wallet.",
    component: UserTwapSliceFillsDemo,
    category: "subscription",
    streamType: "perps",
  },
  {
    id: "open-orders",
    label: "Open Orders",
    description: "Working orders and derived direction labels.",
    component: OpenOrdersDemo,
    category: "subscription",
    streamType: "perps",
  },
  {
    id: "historical-orders",
    label: "Historical Orders",
    description: "Backfilled order history snapshots.",
    component: HistoricalOrdersDemo,
    category: "info",
  },
] as const;

const DEMO_GROUPS = [
  {
    id: "info",
    label: "Info",
    description: "Snapshot queries powered by `infoClient`.",
  },
  {
    id: "subscription",
    label: "Subscriptions",
    description: "Live websocket streams and derived realtime views.",
  },
] as const;

const SUBSCRIPTION_TYPES = [
  {
    id: "perps",
    label: "Perps",
  },
  {
    id: "spot",
    label: "Spot",
  },
] as const;

export function App() {
  const [selectedCategory, setSelectedCategory] =
    useState<(typeof DEMO_GROUPS)[number]["id"]>("subscription");
  const [selectedSubscriptionType, setSelectedSubscriptionType] =
    useState<(typeof SUBSCRIPTION_TYPES)[number]["id"]>("perps");
  const [selectedDemoId, setSelectedDemoId] = useState<(typeof DEMOS)[number]["id"]>("orderbook");
  const visibleDemos = DEMOS.filter((demo) => {
    if (demo.category !== selectedCategory) {
      return false;
    }

    if (selectedCategory !== "subscription") {
      return true;
    }

    return demo.streamType === selectedSubscriptionType;
  });
  const activeDemo =
    DEMOS.find((demo) => demo.id === selectedDemoId) ?? visibleDemos[0] ?? DEMOS[0];
  const ActiveDemoComponent = activeDemo.component;

  useEffect(() => {
    if (!visibleDemos.some((demo) => demo.id === selectedDemoId) && visibleDemos[0]) {
      setSelectedDemoId(visibleDemos[0].id);
    }
  }, [selectedDemoId, visibleDemos]);

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
              <div className="border-b border-stone-200 px-3 py-3">
                <div className="grid grid-cols-2 gap-2 rounded-[24px] bg-stone-100 p-1">
                  {DEMO_GROUPS.map((group) => {
                    const isActive = group.id === selectedCategory;

                    return (
                      <button
                        key={group.id}
                        className={`rounded-[20px] px-3 py-2 text-left transition ${
                          isActive
                            ? "bg-white text-stone-900 shadow-[0_12px_24px_-18px_rgba(20,24,12,0.65)]"
                            : "text-stone-500 hover:bg-white/70 hover:text-stone-700"
                        }`}
                        onClick={() => {
                          setSelectedCategory(group.id);
                        }}
                        type="button"
                      >
                        <div className="text-xs font-medium uppercase tracking-[0.18em]">
                          {group.label}
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div className="mt-3 px-2 text-xs leading-5 text-stone-500">
                  {DEMO_GROUPS.find((group) => group.id === selectedCategory)?.description}
                </div>
                {selectedCategory === "subscription" ? (
                  <div className="mt-3 grid grid-cols-2 gap-2 px-2">
                    {SUBSCRIPTION_TYPES.map((type) => {
                      const isActive = type.id === selectedSubscriptionType;

                      return (
                        <button
                          key={type.id}
                          className={`rounded-[18px] border px-3 py-2 text-sm transition ${
                            isActive
                              ? "border-stone-900 bg-stone-900 text-white"
                              : "border-stone-200 bg-white/80 text-stone-600 hover:border-stone-300 hover:bg-white"
                          }`}
                          onClick={() => {
                            setSelectedSubscriptionType(type.id);
                          }}
                          type="button"
                        >
                          {type.label}
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>
              <nav className="flex gap-3 overflow-x-auto px-3 py-3 xl:max-h-[calc(100vh-14rem)] xl:flex-col xl:overflow-y-auto xl:overflow-x-hidden">
                {visibleDemos.map((demo) => {
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
              <div className="mt-4 inline-flex rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-medium text-stone-600">
                {activeDemo.category === "info"
                  ? "Info"
                  : activeDemo.streamType === "spot"
                    ? "Subscription · Spot"
                    : "Subscription · Perps"}
              </div>
            </div>

            <ActiveDemoComponent />
          </section>
        </div>

        <Footer technologies={["Bun", "React", "TypeScript", "Tailwind"]} />
      </div>
    </main>
  );
}
