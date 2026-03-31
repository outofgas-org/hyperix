import { useSymbolConverter, useUserTwapHistory } from "@hyperix/hooks";
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

const HEADERS = [
  "Time",
  "TWAP ID",
  "Coin",
  "Status",
  "Side",
  "Executed",
  "Executed Ntl",
  "Duration",
  "Flags",
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

function getSideLabel(side: "A" | "B") {
  return side === "B" ? "Buy" : "Sell";
}

function getSideClass(side: "A" | "B") {
  return side === "B" ? "text-emerald-600" : "text-rose-500";
}

function getStatusLabel(
  status:
    | { status: "finished" | "activated" | "terminated" }
    | { status: "error"; description: string },
) {
  if (status.status === "error") {
    return "Error";
  }

  if (status.status === "activated") {
    return "Active";
  }

  if (status.status === "finished") {
    return "Finished";
  }

  return "Terminated";
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

export function UserTwapHistoryDemo() {
  const [input, setInput] = useState(DEFAULT_ADDRESS);
  const address = isAddress(input) ? input : undefined;
  const symbolConverter = useSymbolConverter();
  const { data, loading, error, ready } = useUserTwapHistory(address ?? DEFAULT_ADDRESS, {
    enabled: Boolean(address),
  });

  const history = useMemo(() => {
    return [...(data?.history ?? [])]
      .map((entry) => {
        const displayCoin = symbolConverter?.getSpotByPairId(entry.state.coin) ?? entry.state.coin;

        return {
          time: entry.time,
          twapId: entry.twapId ?? null,
          coin: displayCoin,
          rawCoin: entry.state.coin,
          status: entry.status,
          side: entry.state.side,
          executedSz: entry.state.executedSz,
          sz: entry.state.sz,
          executedNtl: entry.state.executedNtl,
          minutes: entry.state.minutes,
          randomize: entry.state.randomize,
          reduceOnly: entry.state.reduceOnly,
        };
      })
      .sort((left, right) => right.time - left.time);
  }, [data?.history, symbolConverter]);

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">User TWAP History</h2>
        <p className="text-sm text-gray-500">
          Table demo for <code>useUserTwapHistory</code>, merging snapshot and incremental TWAP
          history events for a wallet.
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
                ? `Subscribed to TWAP history for ${address}`
                : "Enter a valid 42-character hex wallet address to start the subscription."}
            </span>
            <span>{ready ? `${history.length} entries` : loading ? "Loading..." : "Idle"}</span>
          </div>
        </CardHeader>

        <CardContent className="p-0 font-mono text-xs">
          {error ? (
            <div className="m-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-rose-700">
              {error}
            </div>
          ) : !address || (!ready && !data) ? (
            <TableSkeleton />
          ) : history.length === 0 ? (
            <div className="m-4 rounded-xl border border-[#e8eef3] bg-[#f8fbfd] px-3 py-2 text-[#6f8797]">
              No TWAP history returned for this wallet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[1320px] table-auto border-separate border-spacing-0">
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
                  {history.map((entry, index) => (
                    <tr
                      key={`${entry.time}-${entry.twapId ?? "na"}-${index}`}
                      className="border-b border-[#edf3f7] last:border-b-0 odd:bg-white even:bg-[#fbfdff]"
                    >
                      <td className="px-4 py-3 text-[#183242]">{formatDate(entry.time)}</td>
                      <td className="px-4 py-3 text-[#183242]">{entry.twapId ?? "--"}</td>
                      <td className="px-4 py-3 text-[#183242]">
                        <div className="font-semibold">{entry.coin}</div>
                        {entry.coin !== entry.rawCoin ? (
                          <div className="text-[11px] text-[#6f8797]">{entry.rawCoin}</div>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-[#183242]">
                        <div>{getStatusLabel(entry.status)}</div>
                        {"description" in entry.status ? (
                          <div className="text-[11px] text-rose-500">{entry.status.description}</div>
                        ) : null}
                      </td>
                      <td className={`px-4 py-3 ${getSideClass(entry.side)}`}>
                        {getSideLabel(entry.side)}
                      </td>
                      <td className="px-4 py-3 text-[#183242]">
                        {formatAmount(entry.executedSz)} / {formatAmount(entry.sz)}
                      </td>
                      <td className="px-4 py-3 text-[#183242]">${formatAmount(entry.executedNtl)}</td>
                      <td className="px-4 py-3 text-[#183242]">{entry.minutes} min</td>
                      <td className="px-4 py-3 text-[#183242]">
                        {entry.reduceOnly ? "Reduce only" : "Standard"}
                        <div className="text-[11px] text-[#6f8797]">
                          {entry.randomize ? "Randomized slices" : "Fixed slices"}
                        </div>
                      </td>
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
