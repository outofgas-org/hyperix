import { useActiveAssetData } from "@hyperix/hooks";
import { useState } from "react";
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
const DEFAULT_COIN = "ETH";

const NUMBER_FORMATTER = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 6,
});

function isAddress(value: string): value is `0x${string}` {
  return /^0x[a-fA-F0-9]{40}$/.test(value);
}

function formatNumber(value: string | number) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return "--";
  }

  return NUMBER_FORMATTER.format(numericValue);
}

function formatRange([min, max]: [string, string]) {
  return `${formatNumber(min)} to ${formatNumber(max)}`;
}

function formatLeverage(
  leverage:
    | { type: "isolated"; value: number; rawUsd: string }
    | { type: "cross"; value: number },
) {
  if (leverage.type === "isolated") {
    return `${leverage.value}x isolated ($${formatNumber(leverage.rawUsd)} margin)`;
  }

  return `${leverage.value}x cross`;
}

function MetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-[24px] border border-stone-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8f5ef_100%)] p-4">
      <div className="text-[11px] uppercase tracking-[0.16em] text-stone-400">{label}</div>
      <div className="mt-2 font-mono text-lg text-stone-900">{value}</div>
      {hint ? <div className="mt-1 text-xs text-stone-500">{hint}</div> : null}
    </div>
  );
}

function MetricsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }, (_, index) => (
        <div
          key={index}
          className="space-y-3 rounded-[24px] border border-stone-200 bg-white/80 p-4"
        >
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      ))}
    </div>
  );
}

export function ActiveAssetDataDemo() {
  const [coinInput, setCoinInput] = useState(DEFAULT_COIN);
  const [addressInput, setAddressInput] = useState(DEFAULT_ADDRESS);

  const coin = coinInput.trim().toUpperCase();
  const address = isAddress(addressInput) ? addressInput : undefined;
  const { data, loading, ready, error } = useActiveAssetData(coin, address ?? DEFAULT_ADDRESS, {
    enabled: Boolean(coin) && Boolean(address),
  });

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">Active Asset Data</h2>
        <p className="text-sm text-gray-500">
          Live account-level trading constraints from <code>useActiveAssetData</code> for a single
          perpetual market.
        </p>
      </div>

      <Card className={DEMO_CARD_CLASS_NAME}>
        <CardHeader className={DEMO_CARD_HEADER_CLASS_NAME}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <CardTitle className={DEMO_CARD_TITLE_CLASS_NAME}>Market</CardTitle>
              <Input
                className={DEMO_CARD_INPUT_CLASS_NAME}
                onChange={(event) => {
                  setCoinInput(event.target.value);
                }}
                placeholder="ETH"
                value={coinInput}
              />
            </div>
            <div className="space-y-2">
              <CardTitle className={DEMO_CARD_TITLE_CLASS_NAME}>Wallet</CardTitle>
              <Input
                className={DEMO_CARD_INPUT_CLASS_NAME}
                onChange={(event) => {
                  setAddressInput(event.target.value);
                }}
                placeholder="0x..."
                value={addressInput}
              />
            </div>
          </div>

          <div
            className={`${DEMO_CARD_STATUS_CLASS_NAME} flex items-center justify-between gap-4`}
          >
            <span>
              {address && coin
                ? `Subscribed to ${coin} for ${address}`
                : "Enter a coin and a valid 42-character hex wallet address to start the subscription."}
            </span>
            <span>{ready ? "Live" : loading ? "Loading..." : "Idle"}</span>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 p-6">
          {error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 font-mono text-xs text-rose-700">
              {error}
            </div>
          ) : !address || !coin || (!data && loading) ? (
            <MetricsSkeleton />
          ) : !data ? (
            <div className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-500">
              Waiting for active asset data snapshot.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <MetricCard label="Coin" value={data.coin} hint={data.user} />
                <MetricCard
                  label="Mark Price"
                  value={`$${formatNumber(data.markPx)}`}
                  hint="Current subscription mark"
                />
                <MetricCard
                  label="Leverage"
                  value={formatLeverage(data.leverage)}
                  hint="Account configuration"
                />
                <MetricCard
                  label="Trade Size Window"
                  value={formatRange(data.maxTradeSzs)}
                  hint="Minimum to maximum size"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[24px] border border-stone-200 bg-white/80 p-5">
                  <div className="text-[11px] uppercase tracking-[0.16em] text-stone-400">
                    Available To Trade
                  </div>
                  <div className="mt-3 font-mono text-xl text-stone-900">
                    {formatRange(data.availableToTrade)}
                  </div>
                  <div className="mt-2 text-sm text-stone-500">
                    Size range currently available for new orders.
                  </div>
                </div>

                <div className="rounded-[24px] border border-stone-200 bg-white/80 p-5">
                  <div className="text-[11px] uppercase tracking-[0.16em] text-stone-400">
                    Subscription Payload
                  </div>
                  <pre className="mt-3 overflow-x-auto rounded-2xl bg-stone-950/95 p-4 font-mono text-xs leading-6 text-stone-100">
                    {JSON.stringify(data, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
