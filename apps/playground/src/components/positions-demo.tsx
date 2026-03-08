import { type Position, usePositions } from "@hyperix/hooks";
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

const NUMBER_FORMATTER = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 6,
});

const VALUE_FORMATTER = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const PERCENT_FORMATTER = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const DEFAULT_ADDRESS = "0x0000000000000000000000000000000000000000";

const HEADERS = [
  "Coin",
  "Side",
  "Size",
  "Leverage",
  "Entry",
  "Position Value",
  "Unrealized PnL",
  "ROE",
  "Liquidation",
  "Margin Used",
  "Funding Since Open",
] as const;

function isAddress(value: string): value is `0x${string}` {
  return /^0x[a-fA-F0-9]{40}$/.test(value);
}

function formatAmount(value: string | number) {
  return NUMBER_FORMATTER.format(Number(value));
}

function formatValue(value: string | number) {
  return VALUE_FORMATTER.format(Number(value));
}

function formatPercent(value: string | number) {
  return `${PERCENT_FORMATTER.format(Number(value) * 100)}%`;
}

function formatLiquidationPrice(value: string | null) {
  return value === null ? "--" : formatValue(value);
}

function getSide(position: Position["position"]) {
  const size = Number(position.szi);
  if (size > 0) {
    return "Long";
  }

  if (size < 0) {
    return "Short";
  }

  return "Flat";
}

function getSideClass(position: Position["position"]) {
  const size = Number(position.szi);
  if (size > 0) {
    return "text-[#27d3b2]";
  }

  if (size < 0) {
    return "text-[#ff6b8f]";
  }

  return "text-[#6f8797]";
}

function formatLeverage(position: Position["position"]) {
  const leverage = position.leverage;
  return `${leverage.value}x ${leverage.type}`;
}

function PositionRow({ positionRecord }: { positionRecord: Position }) {
  const position = positionRecord.position;

  return (
    <tr className="border-b border-[#edf3f7] last:border-b-0 odd:bg-white even:bg-[#fbfdff]">
      <td className="px-4 py-3 font-semibold text-[#183242]">{position.coin}</td>
      <td className={`px-4 py-3 ${getSideClass(position)}`}>{getSide(position)}</td>
      <td className="px-4 py-3 text-[#183242]">{formatAmount(position.szi)}</td>
      <td className="px-4 py-3 text-[#183242]">{formatLeverage(position)}</td>
      <td className="px-4 py-3 text-[#183242]">{formatValue(position.entryPx)}</td>
      <td className="px-4 py-3 text-[#183242]">${formatValue(position.positionValue)}</td>
      <td className={`px-4 py-3 ${getSideClass({ ...position, szi: position.unrealizedPnl })}`}>
        ${formatValue(position.unrealizedPnl)}
      </td>
      <td className="px-4 py-3 text-[#183242]">{formatPercent(position.returnOnEquity)}</td>
      <td className="px-4 py-3 text-[#183242]">
        {formatLiquidationPrice(position.liquidationPx)}
      </td>
      <td className="px-4 py-3 text-[#183242]">${formatValue(position.marginUsed)}</td>
      <td className="px-4 py-3 text-[#183242]">${formatValue(position.cumFunding.sinceOpen)}</td>
    </tr>
  );
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

export function PositionsDemo() {
  const [input, setInput] = useState(DEFAULT_ADDRESS);
  const address = isAddress(input) ? input : undefined;
  const { data, loading, error, ready } = usePositions(address ?? DEFAULT_ADDRESS, {
    enabled: Boolean(address),
  });
  const positions = data ?? [];

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">Positions</h2>
        <p className="text-sm text-gray-500">
          Table demo for <code>usePositions</code>, aggregating open positions across all DEXs and
          sorting by descending position value.
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
                ? `Subscribed to ${address} across ALL_DEXS`
                : "Enter a valid 42-character hex wallet address to start the subscription."}
            </span>
            <span>
              {ready ? `${positions.length} positions` : loading ? "Loading..." : "Idle"}
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
          ) : positions.length === 0 ? (
            <div className="m-4 rounded-xl border border-[#e8eef3] bg-[#f8fbfd] px-3 py-2 text-[#6f8797]">
              No open positions.
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
                  {positions.map((positionRecord) => {
                    const position = positionRecord.position;

                    return (
                      <PositionRow
                        key={`${position.coin}-${position.entryPx}-${position.szi}`}
                        positionRecord={positionRecord}
                      />
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
