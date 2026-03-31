import { useSymbolConverter, useTwapStates } from "@hyperix/hooks";
import { useMemo, useState } from "react";
import { formatDate } from "../lib/format-date";
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

const NUMBER_FORMATTER = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 6,
});

const PERCENT_FORMATTER = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const HEADERS = [
  "TWAP ID",
  "Coin",
  "Side",
  "Progress",
  "Executed Ntl",
  "Duration",
  "Flags",
  "Started",
  "DEX",
] as const;

function isAddress(value: string): value is `0x${string}` {
  return /^0x[a-fA-F0-9]{40}$/.test(value);
}

function formatAmount(value: string | number) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return "--";
  }

  return NUMBER_FORMATTER.format(numericValue);
}

function formatPercent(value: number) {
  if (!Number.isFinite(value)) {
    return "--";
  }

  return `${PERCENT_FORMATTER.format(value * 100)}%`;
}

function getSideLabel(side: "A" | "B") {
  return side === "B" ? "Buy" : "Sell";
}

function getSideClass(side: "A" | "B") {
  return side === "B" ? "text-emerald-600" : "text-rose-500";
}

function TableSkeleton() {
  return (
    <div className="space-y-2 px-4 pb-4">
      <Skeleton className="h-8 rounded-md bg-[#eef4f8]" />
      <Skeleton className="h-8 rounded-md bg-[#eef4f8]" />
      <Skeleton className="h-8 rounded-md bg-[#eef4f8]" />
    </div>
  );
}

export function TwapStatesDemo() {
  const [input, setInput] = useState(DEFAULT_ADDRESS);
  const address = isAddress(input) ? input : undefined;
  const symbolConverter = useSymbolConverter();
  const { data, loading, error, ready } = useTwapStates(address ?? DEFAULT_ADDRESS, {
    enabled: Boolean(address),
  });

  const states = useMemo(() => {
    return (data?.states ?? [])
      .map(([twapId, state]) => {
        const displayCoin = symbolConverter?.getSpotByPairId(state.coin) ?? state.coin;
        const progress = Number(state.sz) > 0 ? Number(state.executedSz) / Number(state.sz) : 0;

        return {
          twapId,
          dex: data?.dex || "Main",
          coin: displayCoin,
          rawCoin: state.coin,
          side: state.side,
          size: state.sz,
          executedSize: state.executedSz,
          executedNotional: state.executedNtl,
          progress,
          minutes: state.minutes,
          randomize: state.randomize,
          reduceOnly: state.reduceOnly,
          timestamp: state.timestamp,
        };
      })
      .sort((left, right) => right.timestamp - left.timestamp);
  }, [data?.states, data?.dex, symbolConverter]);

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">TWAP States</h2>
        <p className="text-sm text-gray-500">
          Table demo for <code>useTwapStates</code>, showing active TWAP execution state for a
          wallet.
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
          <div
            className={`${DEMO_CARD_STATUS_CLASS_NAME} flex items-center justify-between gap-4`}
          >
            <span>
              {address
                ? `Subscribed to TWAP states for ${address}`
                : "Enter a valid 42-character hex wallet address to start the subscription."}
            </span>
            <span>{ready ? `${states.length} TWAPs` : loading ? "Loading..." : "Idle"}</span>
          </div>
        </CardHeader>

        <CardContent className="p-0 font-mono text-xs">
          {error ? (
            <div className="m-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-rose-700">
              {error}
            </div>
          ) : !address || (!ready && !data) ? (
            <TableSkeleton />
          ) : states.length === 0 ? (
            <div className="m-4 rounded-xl border border-[#e8eef3] bg-[#f8fbfd] px-3 py-2 text-[#6f8797]">
              No TWAP states returned for this wallet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[1260px] table-auto border-separate border-spacing-0">
                <thead className="sticky top-0 z-10 bg-[#f8fbfd]">
                  <tr className="border-b border-[#edf3f7] text-left text-[11px] uppercase tracking-[0.12em] text-[#6f8797]">
                    {HEADERS.map((header) => (
                      <th key={header} className="px-4 py-3 font-medium whitespace-nowrap">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {states.map((state) => (
                    <tr
                      key={`${state.dex}-${state.twapId}-${state.timestamp}`}
                      className="border-b border-[#edf3f7] last:border-b-0 odd:bg-white even:bg-[#fbfdff]"
                    >
                      <td className="px-4 py-3 text-[#183242]">{state.twapId}</td>
                      <td className="px-4 py-3 text-[#183242]">
                        <div className="font-semibold">{state.coin}</div>
                        {state.coin !== state.rawCoin ? (
                          <div className="text-[11px] text-[#6f8797]">{state.rawCoin}</div>
                        ) : null}
                      </td>
                      <td className={`px-4 py-3 ${getSideClass(state.side)}`}>
                        {getSideLabel(state.side)}
                      </td>
                      <td className="px-4 py-3 text-[#183242]">
                        <div>{formatPercent(state.progress)}</div>
                        <div className="text-[11px] text-[#6f8797]">
                          {formatAmount(state.executedSize)} / {formatAmount(state.size)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[#183242]">
                        ${formatAmount(state.executedNotional)}
                      </td>
                      <td className="px-4 py-3 text-[#183242]">{state.minutes} min</td>
                      <td className="px-4 py-3 text-[#183242]">
                        {state.reduceOnly ? "Reduce only" : "Standard"}
                        <div className="text-[11px] text-[#6f8797]">
                          {state.randomize ? "Randomized slices" : "Fixed slices"}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[#183242]">{formatDate(state.timestamp)}</td>
                      <td className="px-4 py-3 text-[#183242]">{state.dex}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
