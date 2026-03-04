import { useL2Book } from "@hyperix/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import { useState } from "react";

const NUMBER_FORMATTER = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 8,
});

const PERCENT_FORMATTER = new Intl.NumberFormat("en-US", {
  style: "percent",
  minimumFractionDigits: 4,
  maximumFractionDigits: 4,
});

type OrderbookSideProps = {
  colorClassName: string;
  depthBarClassName: string;
  levels: [number, number, number][];
  label: string;
  maxCumulativeSize: number;
};

function OrderbookSide({
  colorClassName,
  depthBarClassName,
  levels,
  label,
  maxCumulativeSize,
}: OrderbookSideProps) {
  return (
    <div className="space-y-3">
      <div className="items-center justify-between grid grid-cols-3 gap-2 text-xs">
        <span>Price</span>
        <span className="text-right">Size</span>
        <span className="text-right">Total</span>
      </div>

      <div className={"space-y-0.5"}>
        {levels.length === 0 ? (
          <div className="grid grid-cols-3 gap-2">
            <Skeleton />
            <Skeleton />
            <Skeleton />
          </div>
        ) : (
          levels.map(([price, size, cumulativeSize]) => (
            <div
              key={`${label}-${price}-${size}-${cumulativeSize}`}
              className="relative grid grid-cols-3 gap-2 rounded-xl py-0.5 font-mono text-xs"
            >
              <div
                className={`absolute inset-y-0 left-0 ${depthBarClassName}`}
                style={{
                  width: `${(cumulativeSize / maxCumulativeSize) * 100}%`,
                }}
              />
              <span className={`relative ${colorClassName}`}>
                {NUMBER_FORMATTER.format(price)}
              </span>
              <span className="relative text-right text-gray-700">
                {NUMBER_FORMATTER.format(size)}
              </span>
              <span className="relative text-right text-gray-500">
                {NUMBER_FORMATTER.format(cumulativeSize)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

type OrderbookCardProps = {
  coin: string;
};

function OrderbookCard({ coin }: OrderbookCardProps) {
  const [tick, setTick] = useState("");
  const { data: baseData } = useL2Book(coin, { depth: 11 });
  const levels = baseData?.levels ?? [];
  const defaultTick = levels[0]?.tick ?? "";
  const selectedTick = levels.some((level) => level.tick === tick)
    ? tick
    : defaultTick;
  const selectedLevel =
    levels.find((level) => level.tick === selectedTick) ?? levels[0];
  const { data: levelData } = useL2Book(coin, {
    depth: 11,
    nSigFigs: selectedLevel?.nSigFigs,
  });
  const data = levelData ?? baseData;

  if (!data) {
    return (
      <div>
        <Skeleton />
      </div>
    );
  }

  const { bids, asks, maxCumulativeSize, spread, spreadPercent } = data;

  return (
    <Card className="bg-white border border-gray-200 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between text-sm">
          {coin}-USDC
        </CardTitle>
        <div className="flex justify-end">
          <label className="sr-only" htmlFor={`${coin}-tick-size`}>
            Tick size
          </label>
          <select
            id={`${coin}-tick-size`}
            className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600"
            onChange={(event) => setTick(event.target.value)}
            value={selectedTick}
          >
            {levels.length === 0 ? (
              <option value="">--</option>
            ) : (
              levels.map((level) => (
                <option key={level.tick} value={level.tick}>
                  {level.tick}
                </option>
              ))
            )}
          </select>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <OrderbookSide
          label="Asks"
          levels={asks.slice(0, 12).reverse()}
          colorClassName="text-rose-600"
          depthBarClassName="bg-rose-100"
          maxCumulativeSize={Math.max(maxCumulativeSize, 1)}
        />
        <div className="grid grid-cols-3 items-center gap-2 rounded-xl bg-gray-100 px-3 py-2 text-xs">
          <span className="font-medium text-gray-600">Spread</span>
          <span className="text-center font-mono text-gray-800">
            {NUMBER_FORMATTER.format(spread)}
          </span>
          <span className="text-right font-mono text-gray-500">
            {PERCENT_FORMATTER.format(spreadPercent)}
          </span>
        </div>
        <OrderbookSide
          label="Bids"
          levels={bids.slice(0, 12)}
          colorClassName="text-emerald-600"
          depthBarClassName="bg-emerald-100"
          maxCumulativeSize={Math.max(maxCumulativeSize, 1)}
        />
      </CardContent>
    </Card>
  );
}

export function OrderbookDemo() {
  return (
    <section className="space-y-2">
      <h2 className="text-xl font-semibold">L2Book</h2>

      <div className="grid gap-6 lg:grid-cols-4 sm:grid-cols-3">
        <OrderbookCard coin="HYPE" />
        <OrderbookCard coin="BTC" />
        <OrderbookCard coin="ETH" />
        <OrderbookCard coin="@107" />
      </div>
    </section>
  );
}
