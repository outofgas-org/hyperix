import { useBalances } from "@hyperix/hooks";
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

const DEFAULT_ADDRESS = "0x0000000000000000000000000000000000000000";

const USD_FORMATTER = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const TOKEN_FORMATTER = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 6,
});

function isAddress(value: string): value is `0x${string}` {
  return /^0x[a-fA-F0-9]{40}$/.test(value);
}

function formatUsd(value: number | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "--";
  }

  return `$${USD_FORMATTER.format(value)}`;
}

function formatAmount(value: number | undefined, symbol?: string) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "--";
  }

  const formatted = TOKEN_FORMATTER.format(value);
  return symbol ? `${formatted} ${symbol}` : formatted;
}

function JsonPreview({ value }: { value: unknown }) {
  return (
    <pre className="max-h-80 overflow-auto rounded-2xl bg-stone-950 p-4 text-[11px] leading-5 text-stone-100">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

function BalancesSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="rounded-[24px] border border-stone-200 bg-stone-50/80 p-4"
          >
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-3 h-8 w-28" />
            <Skeleton className="mt-2 h-4 w-20" />
          </div>
        ))}
      </div>
      <Skeleton className="h-32 w-full rounded-[24px]" />
      <Skeleton className="h-56 w-full rounded-[24px]" />
    </div>
  );
}

export function BalancesDemo() {
  const [input, setInput] = useState(DEFAULT_ADDRESS);
  const address = isAddress(input) ? input : undefined;
  const { data, ready, loading, error } = useBalances(
    address ?? DEFAULT_ADDRESS,
    {
      enabled: Boolean(address),
    },
  );

  const summary = useMemo(() => {
    const balances = data?.balances ?? [];
    const totalAvailable = balances.reduce(
      (sum, balance) => sum + balance.available,
      0,
    );
    const positivePnl = balances.reduce(
      (sum, balance) => sum + Math.max(balance.pnl ?? 0, 0),
      0,
    );
    const negativePnl = balances.reduce(
      (sum, balance) => sum + Math.min(balance.pnl ?? 0, 0),
      0,
    );

    return {
      count: balances.length,
      totalAvailable,
      positivePnl,
      negativePnl,
    };
  }, [data]);

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">Balances</h2>
        <p className="text-sm text-gray-500">
          Query demo for <code>useBalances</code>, combining spot, perp, vault,
          and staking equity into one wallet-level balance view.
        </p>
      </div>

      <Card className={`${DEMO_CARD_CLASS_NAME} text-[#183242]`}>
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
                ? `Fetching balances for ${address}`
                : "Enter a valid 42-character hex wallet address to load the balances summary."}
            </span>
            <span>
              {loading ? "Loading..." : ready ? `${summary.count} balances` : "Idle"}
            </span>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 p-6">
          {error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </div>
          ) : !address || loading ? (
            <BalancesSkeleton />
          ) : !data ? (
            <div className="rounded-xl border border-[#e8eef3] bg-[#f8fbfd] px-3 py-2 text-sm text-[#6f8797]">
              No balance data returned for this wallet.
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-[24px] border border-stone-200 bg-stone-50/80 p-4">
                  <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-stone-400">
                    Total Equity
                  </div>
                  <div className="mt-3 text-2xl font-semibold text-stone-900">
                    {formatUsd(data.totalEquity)}
                  </div>
                  <div className="mt-2 text-xs text-stone-500">
                    Trading + vault + staking equity
                  </div>
                </div>
                <div className="rounded-[24px] border border-stone-200 bg-stone-50/80 p-4">
                  <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-stone-400">
                    Trading Equity
                  </div>
                  <div className="mt-3 text-2xl font-semibold text-stone-900">
                    {formatUsd(data.tradingEquity)}
                  </div>
                  <div className="mt-2 text-xs text-stone-500">
                    Spot and perp account equity
                  </div>
                </div>
                <div className="rounded-[24px] border border-stone-200 bg-stone-50/80 p-4">
                  <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-stone-400">
                    Cross Margin Available
                  </div>
                  <div className="mt-3 text-2xl font-semibold text-stone-900">
                    {formatUsd(data.crossMarginAvailable)}
                  </div>
                  <div className="mt-2 text-xs text-stone-500">
                    Withdrawable cross collateral
                  </div>
                </div>
                <div className="rounded-[24px] border border-stone-200 bg-stone-50/80 p-4">
                  <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-stone-400">
                    Balance Rows
                  </div>
                  <div className="mt-3 text-2xl font-semibold text-stone-900">
                    {summary.count}
                  </div>
                  <div className="mt-2 text-xs text-stone-500">
                    Unified: {data.isUnifiedAccount ? "Yes" : "No"}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-[24px] border border-stone-200 bg-white/70 p-4">
                  <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-stone-400">
                    Equity Breakdown
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-stone-50 p-3">
                      <div className="text-xs text-stone-500">Spot Equity</div>
                      <div className="mt-1 text-lg font-semibold text-stone-900">
                        {formatUsd(data.spotEquity)}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-stone-50 p-3">
                      <div className="text-xs text-stone-500">Perp Equity</div>
                      <div className="mt-1 text-lg font-semibold text-stone-900">
                        {formatUsd(data.perpEquity)}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-stone-50 p-3">
                      <div className="text-xs text-stone-500">Vault Equity</div>
                      <div className="mt-1 text-lg font-semibold text-stone-900">
                        {formatUsd(data.vaultEquity)}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-stone-50 p-3">
                      <div className="text-xs text-stone-500">Available Total</div>
                      <div className="mt-1 text-lg font-semibold text-stone-900">
                        {formatAmount(summary.totalAvailable)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-[24px] border border-stone-200 bg-white/70 p-4">
                  <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-stone-400">
                    Perps + Staking Overview
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-stone-50 p-3">
                      <div className="text-xs text-stone-500">
                        Unrealized PnL
                      </div>
                      <div
                        className={`mt-1 text-lg font-semibold ${
                          data.perpsOverview.unrealizedPNL >= 0
                            ? "text-emerald-600"
                            : "text-rose-500"
                        }`}
                      >
                        {formatUsd(data.perpsOverview.unrealizedPNL)}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-stone-50 p-3">
                      <div className="text-xs text-stone-500">
                        Cross Leverage
                      </div>
                      <div className="mt-1 text-lg font-semibold text-stone-900">
                        {TOKEN_FORMATTER.format(
                          data.perpsOverview.crossAccountLeverage,
                        )}
                        x
                      </div>
                    </div>
                    <div className="rounded-2xl bg-stone-50 p-3">
                      <div className="text-xs text-stone-500">
                        Staking Equity
                      </div>
                      <div className="mt-1 text-lg font-semibold text-stone-900">
                        {formatUsd(data.stakingInfo.stakingEquity)}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-stone-50 p-3">
                      <div className="text-xs text-stone-500">
                        Delegated HYPE
                      </div>
                      <div className="mt-1 text-lg font-semibold text-stone-900">
                        {formatAmount(
                          data.stakingInfo.delegatedAmount,
                          "HYPE",
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs">
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
                      Positive PnL {formatUsd(summary.positivePnl)}
                    </span>
                    <span className="rounded-full bg-rose-50 px-3 py-1 text-rose-700">
                      Negative PnL {formatUsd(summary.negativePnl)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="text-xs font-medium uppercase tracking-[0.18em] text-stone-400">
                    Asset Balances
                  </div>
                  <div className="text-xs text-stone-500">
                    Sorted in hook response order
                  </div>
                </div>
                <div className="space-y-2">
                  {data.balances.map((balance) => (
                    <div
                      key={`${balance.type}-${balance.dex}-${balance.coin}-${balance.contract}`}
                      className="grid gap-3 rounded-[24px] border border-stone-200 bg-white/70 px-4 py-3 text-sm md:grid-cols-[minmax(0,1.3fr)_repeat(4,minmax(0,0.8fr))]"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-stone-900">
                            {balance.coin}
                          </span>
                          <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] uppercase tracking-[0.14em] text-stone-500">
                            {balance.type}
                          </span>
                          {balance.dex ? (
                            <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[11px] uppercase tracking-[0.14em] text-sky-700">
                              {balance.dex}
                            </span>
                          ) : null}
                        </div>
                        <div className="truncate text-xs text-stone-500">
                          {balance.contract || "No contract metadata"}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-stone-500">Total</div>
                        <div className="mt-1 font-medium text-stone-900">
                          {formatAmount(balance.total, balance.coin)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-stone-500">Available</div>
                        <div className="mt-1 font-medium text-stone-900">
                          {formatAmount(balance.available, balance.coin)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-stone-500">Value</div>
                        <div className="mt-1 font-medium text-stone-900">
                          {formatUsd(balance.value)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-stone-500">PnL</div>
                        <div
                          className={`mt-1 font-medium ${
                            (balance.pnl ?? 0) >= 0
                              ? "text-emerald-600"
                              : "text-rose-500"
                          }`}
                        >
                          {balance.pnl === undefined ? "--" : formatUsd(balance.pnl)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-medium uppercase tracking-[0.18em] text-stone-400">
                  Raw Response
                </div>
                <JsonPreview value={data} />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
