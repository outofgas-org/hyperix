import { useL2Book } from "@hyperix/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import { useEffect, useState } from "react";

const NUMBER_FORMATTER = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 8,
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
  const { data } = useL2Book(coin);

  if (!data) {
    return (
      <div>
        <Skeleton />
      </div>
    );
  }

  const { bids, asks, maxCumulativeSize } = data;

  return (
    <Card className="bg-white border border-gray-200 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between text-sm">
          {coin}-USDC
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <OrderbookSide
          label="Asks"
          levels={asks.slice(0, 12).reverse()}
          colorClassName="text-rose-600"
          depthBarClassName="bg-rose-100"
          maxCumulativeSize={Math.max(maxCumulativeSize, 1)}
        />
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
