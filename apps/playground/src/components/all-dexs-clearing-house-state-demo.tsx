import {
  type AllDexsClearingHouseStateData,
  useAllDexsClearingHouseState,
} from "@hyperix/hooks";
import { useMemo, useState } from "react";
import {
  DEMO_CARD_CLASS_NAME,
  DEMO_CARD_HEADER_CLASS_NAME,
  DEMO_CARD_INPUT_CLASS_NAME,
  DEMO_CARD_STATUS_CLASS_NAME,
  DEMO_CARD_TITLE_CLASS_NAME,
} from "./demo-card-styles";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Skeleton } from "./ui/skeleton";

const VALUE_FORMATTER = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const LEVERAGE_FORMATTER = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const DEFAULT_ADDRESS = "0x0000000000000000000000000000000000000000";

type DexState = AllDexsClearingHouseStateData["clearinghouseStates"][number];

function isAddress(value: string): value is `0x${string}` {
  return /^0x[a-fA-F0-9]{40}$/.test(value);
}

function formatValue(value: string | number) {
  return VALUE_FORMATTER.format(Number(value));
}

function getDexName(dex: string) {
  return dex === "" ? "core" : dex;
}

function getDexCards(data: AllDexsClearingHouseStateData | undefined) {
  if (!data) {
    return [];
  }

  return data.clearinghouseStates
    .map(([dex, state]: DexState) => {
      const accountValue = Number(state.marginSummary.accountValue);
      const totalPositionValue = Number(state.marginSummary.totalNtlPos);
      const withdrawable = Number(state.withdrawable);
      const maintenanceMargin = Number(state.crossMaintenanceMarginUsed);
      const crossAccountValue = Number(state.crossMarginSummary.accountValue);
      const crossLeverage =
        crossAccountValue > 0
          ? Number(state.crossMarginSummary.totalNtlPos) / crossAccountValue
          : 0;

      return {
        dex: getDexName(dex),
        accountValue,
        totalPositionValue,
        withdrawable,
        maintenanceMargin,
        crossAccountValue,
        crossLeverage,
        positions: state.assetPositions,
      };
    })
    .sort((left, right) => right.accountValue - left.accountValue);
}

function StateSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {Array.from({ length: 4 }, (_, index) => (
        <div
          key={index}
          className="space-y-4 rounded-[28px] border border-stone-200 bg-white/80 p-5"
        >
          <div className="flex items-center justify-between gap-4">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-5 w-20" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Skeleton className="h-20 rounded-2xl" />
            <Skeleton className="h-20 rounded-2xl" />
            <Skeleton className="h-20 rounded-2xl" />
            <Skeleton className="h-20 rounded-2xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function AllDexsClearingHouseStateDemo() {
  const [input, setInput] = useState(DEFAULT_ADDRESS);
  const address = isAddress(input) ? input : undefined;
  const { data, loading, error, ready } = useAllDexsClearingHouseState(
    address ?? DEFAULT_ADDRESS,
    {
      enabled: Boolean(address),
    },
  );

  const dexCards = useMemo(() => getDexCards(data), [data]);
  const totalOpenPositions = dexCards.reduce(
    (sum, card) => sum + card.positions.length,
    0,
  );

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">All DEXs Clearing House State</h2>
        <p className="text-sm text-gray-500">
          Snapshot demo for <code>useAllDexsClearingHouseState</code>, grouped
          by DEX with margin and position rollups.
        </p>
      </div>

      <Card className={DEMO_CARD_CLASS_NAME}>
        <CardHeader className={DEMO_CARD_HEADER_CLASS_NAME}>
          <div className="space-y-2">
            <CardTitle className={DEMO_CARD_TITLE_CLASS_NAME}>
              Tracked Wallet
            </CardTitle>
            <Input
              className={DEMO_CARD_INPUT_CLASS_NAME}
              onChange={(event) => {
                setInput(event.target.value);
              }}
              placeholder="0x..."
              value={input}
            />
          </div>
          <div
            className={`${DEMO_CARD_STATUS_CLASS_NAME} flex items-center justify-between gap-4`}
          >
            <span>
              {address
                ? `Subscribed to ${address} across ALL_DEXS`
                : "Enter a valid 42-character hex wallet address to start the subscription."}
            </span>
            <span>
              {ready
                ? `${dexCards.length} DEXs, ${totalOpenPositions} open positions`
                : loading
                  ? "Loading..."
                  : "Idle"}
            </span>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 p-6">
          {error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </div>
          ) : !address || (!ready && !data) ? (
            <StateSkeleton />
          ) : dexCards.length === 0 ? (
            <div className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-500">
              No clearing house state available yet.
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {dexCards.map((card) => (
                <div
                  key={card.dex}
                  className="rounded-[28px] border border-stone-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8f5ef_100%)] p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-xs uppercase tracking-[0.18em] text-stone-400">
                        DEX
                      </div>
                      <div className="mt-2 text-lg font-semibold text-stone-900">
                        {card.dex}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-stone-200 bg-white px-3 py-2 text-right text-xs text-stone-500">
                      <div>Open positions</div>
                      <div className="mt-1 font-mono text-sm text-stone-900">
                        {card.positions.length}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-stone-200 bg-white/80 p-3">
                      <div className="text-xs uppercase tracking-[0.12em] text-stone-400">
                        Account Value
                      </div>
                      <div className="mt-2 font-mono text-lg text-stone-900">
                        ${formatValue(card.accountValue)}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-stone-200 bg-white/80 p-3">
                      <div className="text-xs uppercase tracking-[0.12em] text-stone-400">
                        Withdrawable
                      </div>
                      <div className="mt-2 font-mono text-lg text-stone-900">
                        ${formatValue(card.withdrawable)}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-stone-200 bg-white/80 p-3">
                      <div className="text-xs uppercase tracking-[0.12em] text-stone-400">
                        Position Value
                      </div>
                      <div className="mt-2 font-mono text-lg text-stone-900">
                        ${formatValue(card.totalPositionValue)}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-stone-200 bg-white/80 p-3">
                      <div className="text-xs uppercase tracking-[0.12em] text-stone-400">
                        Cross Leverage
                      </div>
                      <div className="mt-2 font-mono text-lg text-stone-900">
                        {LEVERAGE_FORMATTER.format(card.crossLeverage)}x
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
                      <div className="text-xs uppercase tracking-[0.12em] text-stone-400">
                        Cross Account Value
                      </div>
                      <div className="mt-1 font-mono text-sm text-stone-900">
                        ${formatValue(card.crossAccountValue)}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
                      <div className="text-xs uppercase tracking-[0.12em] text-stone-400">
                        Maintenance Margin
                      </div>
                      <div className="mt-1 font-mono text-sm text-stone-900">
                        ${formatValue(card.maintenanceMargin)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
