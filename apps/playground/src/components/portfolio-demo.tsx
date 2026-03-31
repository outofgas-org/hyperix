import { usePortfolio } from "@hyperix/hooks";
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

const VALUE_FORMATTER = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const PERIOD_LABELS = {
  day: "Day",
  week: "Week",
  month: "Month",
  allTime: "All Time",
  perpDay: "Perp Day",
  perpWeek: "Perp Week",
  perpMonth: "Perp Month",
  perpAllTime: "Perp All Time",
} as const;

function isAddress(value: string): value is `0x${string}` {
  return /^0x[a-fA-F0-9]{40}$/.test(value);
}

function formatUsd(value: string | number) {
  return `$${VALUE_FORMATTER.format(Number(value))}`;
}

function JsonPreview({ value }: { value: unknown }) {
  return (
    <pre className="max-h-80 overflow-auto rounded-2xl bg-stone-950 p-4 text-[11px] leading-5 text-stone-100">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

function SnapshotSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-36" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}

export function PortfolioDemo() {
  const [input, setInput] = useState(DEFAULT_ADDRESS);
  const address = isAddress(input) ? input : undefined;
  const { data, isPending, error, isFetched } = usePortfolio(address ?? DEFAULT_ADDRESS, {
    enabled: Boolean(address),
  });

  const periods = useMemo(() => {
    return (data ?? []).map(([period, snapshot]) => {
      const latestPnl = Number(snapshot.pnlHistory.at(-1)?.[1] ?? 0);
      const latestAccountValue = Number(snapshot.accountValueHistory.at(-1)?.[1] ?? 0);

      return {
        period,
        label: PERIOD_LABELS[period],
        latestPnl,
        latestAccountValue,
        volume: Number(snapshot.vlm),
        points: snapshot.pnlHistory.length,
      };
    });
  }, [data]);

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">Portfolio</h2>
        <p className="text-sm text-gray-500">
          Query demo for <code>usePortfolio</code>, loading grouped portfolio snapshots from the
          Hyperliquid info API.
        </p>
      </div>

      <Card className={`${DEMO_CARD_CLASS_NAME} text-[#183242]`}>
        <CardHeader className={DEMO_CARD_HEADER_CLASS_NAME}>
          <div className="space-y-2">
            <CardTitle className={DEMO_CARD_TITLE_CLASS_NAME}>Tracked Wallet</CardTitle>
            <Input
              className={DEMO_CARD_INPUT_CLASS_NAME}
              onChange={(event) => {
                setInput(event.target.value);
              }}
              placeholder="0x..."
              value={input}
            />
          </div>
          <div className={`${DEMO_CARD_STATUS_CLASS_NAME} flex items-center justify-between gap-4`}>
            <span>
              {address
                ? `Fetching portfolio snapshots for ${address}`
                : "Enter a valid 42-character hex wallet address to load the portfolio query."}
            </span>
            <span>
              {isPending ? "Loading..." : isFetched ? `${periods.length} periods` : "Idle"}
            </span>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 p-6">
          {error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error.message}
            </div>
          ) : !address ? (
            <SnapshotSkeleton />
          ) : isPending ? (
            <SnapshotSkeleton />
          ) : periods.length === 0 ? (
            <div className="rounded-xl border border-[#e8eef3] bg-[#f8fbfd] px-3 py-2 text-sm text-[#6f8797]">
              No portfolio data returned for this wallet.
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {periods.map((item) => (
                  <div
                    key={item.period}
                    className="rounded-[24px] border border-stone-200 bg-stone-50/80 p-4"
                  >
                    <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-stone-400">
                      {item.label}
                    </div>
                    <div className="mt-3 space-y-2 text-sm">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-stone-500">Latest PnL</span>
                        <span className={item.latestPnl >= 0 ? "text-emerald-600" : "text-rose-500"}>
                          {formatUsd(item.latestPnl)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-stone-500">Account Value</span>
                        <span>{formatUsd(item.latestAccountValue)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-stone-500">Volume</span>
                        <span>{formatUsd(item.volume)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-stone-500">PnL Points</span>
                        <span>{item.points}</span>
                      </div>
                    </div>
                  </div>
                ))}
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
