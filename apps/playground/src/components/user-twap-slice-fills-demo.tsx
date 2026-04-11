import { useSymbolConverter, useUserTwapSliceFills } from "@hyperix/hooks";
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
  "Side",
  "Price",
  "Size",
  "Start Position",
  "Closed PnL",
  "Fee",
  "Taker",
  "Hash",
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

function truncateHash(hash: `0x${string}`) {
  return `${hash.slice(0, 8)}...${hash.slice(-6)}`;
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

export function UserTwapSliceFillsDemo() {
  const [input, setInput] = useState(DEFAULT_ADDRESS);
  const address = isAddress(input) ? input : undefined;
  const symbolConverter = useSymbolConverter();
  const { data, loading, error, ready } = useUserTwapSliceFills(
    address ?? DEFAULT_ADDRESS,
    {
      enabled: Boolean(address),
    },
  );

  const fills = useMemo(() => {
    return [...(data?.twapSliceFills ?? [])]
      .map((entry) => {
        const fill = entry.fill;
        const displayCoin =
          symbolConverter?.getSpotByPairId(fill.coin) ?? fill.coin;

        return {
          twapId: entry.twapId,
          coin: displayCoin,
          rawCoin: fill.coin,
          side: fill.side,
          px: fill.px,
          sz: fill.sz,
          time: fill.time,
          startPosition: fill.startPosition,
          closedPnl: fill.closedPnl,
          fee: fill.fee,
          feeToken: fill.feeToken,
          crossed: fill.crossed,
          hash: fill.hash,
        };
      })
      .sort((left, right) => right.time - left.time);
  }, [data?.twapSliceFills, symbolConverter]);

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">User TWAP Slice Fills</h2>
        <p className="text-sm text-gray-500">
          Table demo for <code>useUserTwapSliceFills</code>, merging snapshot
          and incremental TWAP slice fill events for a wallet.
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
                ? `Subscribed to TWAP slice fills for ${address}`
                : "Enter a valid 42-character hex wallet address to start the subscription."}
            </span>
            <span>
              {ready
                ? `${fills.length} fills`
                : loading
                  ? "Loading..."
                  : "Idle"}
            </span>
          </div>
        </CardHeader>

        <CardContent className="p-0 font-mono text-xs">
          {error ? (
            <div className="m-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-rose-700">
              {error}
            </div>
          ) : !address || (!ready && !data) ? (
            <TableSkeleton />
          ) : fills.length === 0 ? (
            <div className="m-4 rounded-xl border border-[#e8eef3] bg-[#f8fbfd] px-3 py-2 text-[#6f8797]">
              No TWAP slice fills returned for this wallet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[1580px] table-auto border-separate border-spacing-0">
                <thead className="sticky top-0 z-10 bg-[#f8fbfd]">
                  <tr className="border-b border-[#edf3f7] text-left text-[11px] uppercase tracking-[0.12em] text-[#6f8797]">
                    {HEADERS.map((header) => (
                      <th
                        key={header}
                        className="px-4 py-3 font-medium whitespace-nowrap"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {fills.map((fill, index) => (
                    <tr
                      key={`${fill.time}-${fill.twapId}-${fill.hash}-${index}`}
                      className="border-b border-[#edf3f7] last:border-b-0 odd:bg-white even:bg-[#fbfdff]"
                    >
                      <td className="px-4 py-3 text-[#183242]">
                        {formatDate(fill.time)}
                      </td>
                      <td className="px-4 py-3 text-[#183242]">
                        {fill.twapId}
                      </td>
                      <td className="px-4 py-3 text-[#183242]">
                        <div className="font-semibold">{fill.coin}</div>
                        {fill.coin !== fill.rawCoin ? (
                          <div className="text-[11px] text-[#6f8797]">
                            {fill.rawCoin}
                          </div>
                        ) : null}
                      </td>
                      <td className={`px-4 py-3 ${getSideClass(fill.side)}`}>
                        {getSideLabel(fill.side)}
                      </td>
                      <td className="px-4 py-3 text-[#183242]">
                        ${formatAmount(fill.px)}
                      </td>
                      <td className="px-4 py-3 text-[#183242]">
                        {formatAmount(fill.sz)}
                      </td>
                      <td className="px-4 py-3 text-[#183242]">
                        {formatAmount(fill.startPosition)}
                      </td>
                      <td className="px-4 py-3 text-[#183242]">
                        ${formatAmount(fill.closedPnl)}
                      </td>
                      <td className="px-4 py-3 text-[#183242]">
                        {formatAmount(fill.fee)} {fill.feeToken}
                      </td>
                      <td className="px-4 py-3 text-[#183242]">
                        {fill.crossed ? "Yes" : "No"}
                      </td>
                      <td className="px-4 py-3 text-[#183242]">
                        {truncateHash(fill.hash)}
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
