import Decimal from "decimal.js";
import { type OpenOrder, useOpenOrders } from "@hyperix/hooks";
import { useState } from "react";
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

const NUMBER_FORMATTER = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 6,
});

const DEFAULT_ADDRESS = "0x0000000000000000000000000000000000000000";

const HEADERS = [
  "Coin",
  "Asset ID",
  "Side",
  "Type",
  "Size",
  "Original Size",
  "Price",
  "Value",
  "Trigger",
  "Reduce Only",
  "Order ID",
  "Time",
] as const;

function isAddress(value: string): value is `0x${string}` {
  return /^0x[a-fA-F0-9]{40}$/.test(value);
}

function formatAmount(value: string | number) {
  return NUMBER_FORMATTER.format(Number(value));
}

function formatDirection(order: OpenOrder) {
  if (order.reduceOnly) {
    return order.side === "A" ? "Close Long" : "Close Short";
  }

  return order.side === "B" ? "Buy" : "Sell";
}

function formatPrice(order: OpenOrder) {
  if (order.orderType.includes("Market")) {
    return "Market";
  }

  return formatAmount(order.limitPx);
}

function formatValue(order: OpenOrder) {
  if (order.orderType.includes("Market")) {
    return "Market";
  }

  return formatAmount(new Decimal(order.origSz).mul(order.limitPx).toString());
}

function formatTrigger(order: OpenOrder) {
  return order.isTrigger && Number(order.triggerPx) > 0
    ? formatAmount(order.triggerPx)
    : "--";
}

function OpenOrderRow({ order }: { order: OpenOrder }) {
  const isBuy = order.side === "B";

  return (
    <tr className="border-b border-[#edf3f7] last:border-b-0 odd:bg-white even:bg-[#fbfdff]">
      <td
        className={`px-4 py-3 font-semibold ${
          isBuy ? "text-[#27d3b2]" : "text-[#ff6b8f]"
        }`}
      >
        {order.coin}
      </td>
      <td className="px-4 py-3 text-[#183242]">{order.assetId ?? "--"}</td>
      <td
        className={`px-4 py-3 ${isBuy ? "text-[#27d3b2]" : "text-[#ff6b8f]"}`}
      >
        {formatDirection(order)}
      </td>
      <td className="px-4 py-3 text-[#183242]">{order.orderType}</td>
      <td className="px-4 py-3 text-[#183242]">{formatAmount(order.sz)}</td>
      <td className="px-4 py-3 text-[#183242]">{formatAmount(order.origSz)}</td>
      <td className="px-4 py-3 text-[#183242]">{formatPrice(order)}</td>
      <td className="px-4 py-3 text-[#183242]">{formatValue(order)}</td>
      <td className="px-4 py-3 text-[#183242]">{formatTrigger(order)}</td>
      <td className="px-4 py-3 text-[#183242]">
        {order.reduceOnly ? "Yes" : "No"}
      </td>
      <td className="px-4 py-3 text-[#183242]">{order.oid}</td>
      <td className="px-4 py-3 text-[#183242]">
        {formatDate(order.timestamp)}
      </td>
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

export function OpenOrdersDemo() {
  const [input, setInput] = useState(DEFAULT_ADDRESS);
  const address = isAddress(input) ? input : undefined;
  const { data, loading, error, ready } = useOpenOrders(
    address ?? DEFAULT_ADDRESS,
    {
      enabled: Boolean(address),
    }
  );
  const orders = data?.orders ?? [];

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">Open Orders</h2>
        <p className="text-sm text-gray-500">
          Table demo for <code>useOpenOrders</code>. The hook defaults to{" "}
          <code>ALL_DEXS</code>
          and returns orders sorted by newest timestamp first.
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
                ? `Subscribed to ${address} across ALL_DEXS`
                : "Enter a valid 42-character hex wallet address to start the subscription."}
            </span>
            <span>
              {ready
                ? `${orders.length} orders`
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
          ) : orders.length === 0 ? (
            <div className="m-4 rounded-xl border border-[#e8eef3] bg-[#f8fbfd] px-3 py-2 text-[#6f8797]">
              No open orders.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[1260px] table-auto border-separate border-spacing-0">
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
                  {orders.map((order) => (
                    <OpenOrderRow
                      key={`${order.coin}-${order.oid}-${order.timestamp}`}
                      order={order}
                    />
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
