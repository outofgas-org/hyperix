import { type OrderHistory, useOrderHistory } from "@hyperix/hooks";
import Decimal from "decimal.js";
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
  maximumFractionDigits: 4,
});

const DEFAULT_ADDRESS = "0x0000000000000000000000000000000000000000";

const HEADERS = [
  "Time",
  "Type",
  "Coin",
  "Direction",
  "Size",
  "Filled Size",
  "Order Value",
  "Price",
  "Reduce Only",
  "Trigger Conditions",
  "TP/SL",
  "Status",
  "Order ID",
] as const;

function isAddress(value: string): value is `0x${string}` {
  return /^0x[a-fA-F0-9]{40}$/.test(value);
}

function formatStatus(status: OrderHistory["status"]) {
  return status.replace(/([A-Z])/g, " $1");
}

function formatAmount(value: string | number) {
  return NUMBER_FORMATTER.format(Number(value));
}

function getDirectionClass(direction: OrderHistory["direction"]) {
  return direction.includes("Buy") || direction.includes("Long")
    ? "text-[#27d3b2]"
    : "text-[#ff6b8f]";
}

function getCoinClass(side: OrderHistory["order"]["side"]) {
  return side === "B" ? "text-[#86f4e8]" : "text-[#f5adc3]";
}

function formatSize(historicalOrder: OrderHistory) {
  const { order, status } = historicalOrder;
  return status === "filled" || Number(order.sz) === 0
    ? "--"
    : formatAmount(order.origSz);
}

function formatFilledSize(historicalOrder: OrderHistory) {
  if (historicalOrder.status !== "filled") {
    return "--";
  }

  const filledSize = new Decimal(historicalOrder.order.origSz).minus(
    historicalOrder.order.sz,
  );
  return formatAmount(filledSize.toString());
}

function formatOrderValue(historicalOrder: OrderHistory) {
  if (historicalOrder.status === "filled") {
    return "--";
  }

  if (historicalOrder.order.orderType.includes("Market")) {
    return "Market";
  }

  return formatAmount(
    new Decimal(historicalOrder.order.origSz)
      .mul(historicalOrder.order.limitPx)
      .toString(),
  );
}

function formatPrice(historicalOrder: OrderHistory) {
  return historicalOrder.order.orderType.includes("Market")
    ? "Market"
    : formatAmount(historicalOrder.order.limitPx);
}

function formatReduceOnly(historicalOrder: OrderHistory) {
  return historicalOrder.displayCoin.includes("/")
    ? "--"
    : historicalOrder.order.reduceOnly
      ? "Yes"
      : "No";
}

function formatTriggerCondition(historicalOrder: OrderHistory) {
  const condition = historicalOrder.order.triggerCondition;
  return !condition || condition.toLowerCase() === "n/a" ? "N/A" : condition;
}

function formatTpSl(historicalOrder: OrderHistory) {
  return historicalOrder.order.isPositionTpsl ? "Yes" : "--";
}

function HistoricalOrderRow({
  historicalOrder,
}: { historicalOrder: OrderHistory }) {
  return (
    <tr className="border-b border-[#edf3f7] last:border-b-0 odd:bg-white even:bg-[#fbfdff]">
      <td className="px-4 py-3 text-[#183242]">
        {formatDate(historicalOrder.statusTimestamp)}
      </td>
      <td className="px-4 py-3 text-[#183242]">
        {historicalOrder.order.orderType}
      </td>
      <td
        className={`px-4 py-3 font-semibold ${getCoinClass(historicalOrder.order.side)}`}
      >
        {historicalOrder.displayCoin}
      </td>
      <td
        className={`px-4 py-3 ${getDirectionClass(historicalOrder.direction)}`}
      >
        {historicalOrder.direction}
      </td>
      <td className="px-4 py-3 text-[#183242]">
        {formatSize(historicalOrder)}
      </td>
      <td className="px-4 py-3 text-[#183242]">
        {formatFilledSize(historicalOrder)}
      </td>
      <td className="px-4 py-3 text-[#183242]">
        {formatOrderValue(historicalOrder)}
      </td>
      <td className="px-4 py-3 text-[#183242]">
        {formatPrice(historicalOrder)}
      </td>
      <td className="px-4 py-3 text-[#183242]">
        {formatReduceOnly(historicalOrder)}
      </td>
      <td className="px-4 py-3 text-[#183242]">
        {formatTriggerCondition(historicalOrder)}
      </td>
      <td className="px-4 py-3 text-[#183242]">
        {formatTpSl(historicalOrder)}
      </td>
      <td className="px-4 py-3 text-[#183242]">
        {formatStatus(historicalOrder.status)}
      </td>
      <td className="px-4 py-3 text-[#183242]">{historicalOrder.order.oid}</td>
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

export function HistoricalOrdersDemo() {
  const [input, setInput] = useState(DEFAULT_ADDRESS);
  const address = isAddress(input) ? input : undefined;
  const { data, loading, error } = useOrderHistory(address ?? DEFAULT_ADDRESS, {
    enabled: Boolean(address),
  });
  const orderHistory = data?.orderHistory ?? [];

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">Order History</h2>
        <p className="text-sm text-gray-500">
          Table demo for <code>useOrderHistory</code> with the same display coin
          and direction normalization used in the hook.
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
                ? `Subscribed to ${address}`
                : "Enter a valid 42-character hex wallet address to start the subscription."}
            </span>
            <span>
              {data
                ? `${orderHistory.length} entries`
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
          ) : !address || (!data && loading) ? (
            <TableSkeleton />
          ) : orderHistory.length === 0 ? (
            <div className="m-4 rounded-xl border border-[#e8eef3] bg-[#f8fbfd] px-3 py-2 text-[#6f8797]">
              No historical orders yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[1480px] table-auto border-separate border-spacing-0">
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
                  {orderHistory.map((historicalOrder) => (
                    <HistoricalOrderRow
                      key={`${historicalOrder.order.oid}-${historicalOrder.statusTimestamp}-${historicalOrder.status}`}
                      historicalOrder={historicalOrder}
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
