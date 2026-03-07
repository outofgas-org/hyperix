import Decimal from "decimal.js";
import { type TradeHistory, useTradeHistory } from "@hyperix/hooks";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Skeleton } from "./ui/skeleton";

const NUMBER_FORMATTER = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 8,
});

const VALUE_FORMATTER = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 6,
});

const TIME_FORMATTER = new Intl.DateTimeFormat("en-US", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

const DEFAULT_ADDRESS = "0x0000000000000000000000000000000000000000";

function isAddress(value: string): value is `0x${string}` {
  return /^0x[a-fA-F0-9]{40}$/.test(value);
}

function formatSignedValue(value: string) {
  const numericValue = Number(value);
  const prefix = numericValue > 0 ? "+" : "";
  return `${prefix}${VALUE_FORMATTER.format(numericValue)}`;
}

function FillRow({ fill }: { fill: TradeHistory }) {
  const tradeValue = new Decimal(fill.px).mul(fill.sz).toNumber();
  const pnl = Number(fill.netPnlInQuote);

  return (
    <div className="grid grid-cols-8 gap-2 rounded-xl px-2 py-1 even:bg-gray-50">
      <div className="min-w-0">
        <div className={fill.side === "B" ? "text-emerald-600" : "text-rose-600"}>
          {fill.displayCoin}
        </div>
        <div className="truncate text-[11px] text-gray-400">
          {fill.baseCoin}/{fill.quoteCoin}
        </div>
      </div>
      <span className="text-right text-gray-700">{NUMBER_FORMATTER.format(Number(fill.sz))}</span>
      <span className="text-right text-gray-700">{NUMBER_FORMATTER.format(Number(fill.px))}</span>
      <span className="text-right text-gray-700">{VALUE_FORMATTER.format(tradeValue)}</span>
      <span className="text-right text-gray-700">{fill.side === "B" ? "Buy" : "Sell"}</span>
      <span className="text-right text-gray-700">
        {formatSignedValue(fill.feeInQuote)} {fill.pnlCurrency}
      </span>
      <span className={`text-right ${pnl >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
        {formatSignedValue(fill.netPnlInQuote)} {fill.pnlCurrency}
      </span>
      <span className="text-right text-gray-500">
        {TIME_FORMATTER.format(new Date(fill.time))}
      </span>
    </div>
  );
}

export function UserFillsDemo() {
  const [input, setInput] = useState(DEFAULT_ADDRESS);
  const address = isAddress(input) ? input : undefined;
  const { data, loading, error, ready } = useTradeHistory(address ?? DEFAULT_ADDRESS, {
    enabled: Boolean(address),
  });

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">Trade History</h2>
        <p className="text-sm text-gray-500">
          Normalized trade history built on top of <code>useUserFills</code>.
        </p>
      </div>

      <Card className="border border-gray-200 bg-white shadow-sm">
        <CardHeader className="space-y-4">
          <div className="space-y-2">
            <CardTitle className="text-sm">Tracked Wallet</CardTitle>
            <Input
              className="font-mono text-sm"
              onChange={(event) => {
                setInput(event.target.value);
              }}
              placeholder="0x..."
              value={input}
            />
          </div>
          <div className="rounded-xl bg-gray-50 px-3 py-2 text-xs text-gray-500">
            {address
              ? `Subscribed to ${address}`
              : "Enter a valid 42-character hex wallet address to start the subscription."}
          </div>
        </CardHeader>

        <CardContent className="space-y-2 font-mono text-xs">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-700">History</h3>
            <span className="text-gray-500">
              {ready ? `${data?.fills.length ?? 0} trades` : loading ? "Loading..." : "Idle"}
            </span>
          </div>
          <div className="grid grid-cols-8 gap-2 text-gray-500">
            <span>Market</span>
            <span className="text-right">Size</span>
            <span className="text-right">Price</span>
            <span className="text-right">Value</span>
            <span className="text-right">Side</span>
            <span className="text-right">Fee (Quote)</span>
            <span className="text-right">Net PnL (Quote)</span>
            <span className="text-right">Time</span>
          </div>
          {error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-rose-700">
              {error}
            </div>
          ) : !address || (!ready && !data) ? (
            <div className="space-y-1">
              <Skeleton />
              <Skeleton />
              <Skeleton />
            </div>
          ) : (data?.fills.length ?? 0) === 0 ? (
            <div className="rounded-xl bg-gray-50 px-3 py-2 text-gray-500">No trades yet.</div>
          ) : (
            <div className="h-72 space-y-1 overflow-y-auto">
              {(data?.fills ?? []).map((fill) => (
                <FillRow
                  key={`${fill.hash}-${fill.tid}-${fill.time}-${fill.startPosition}`}
                  fill={fill}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
