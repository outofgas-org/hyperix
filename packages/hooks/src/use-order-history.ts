import { useMemo } from "react";
import { useSymbolConverter } from "./use-symbol-converter.js";
import {
  type HistoricalOrder,
  useHistoricalOrders,
  type UseHistoricalOrdersOptions,
} from "./use-historical-orders.js";

export type OrderHistoryDirection =
  | "Buy"
  | "Sell"
  | "Long"
  | "Short"
  | "Close Long"
  | "Close Short";

export type OrderHistory = HistoricalOrder & {
  displayCoin: string;
  direction: OrderHistoryDirection;
};

export type OrderHistoryData = {
  user: `0x${string}`;
  orderHistory: OrderHistory[];
};

function formatOrderDirection(order: HistoricalOrder["order"], isSpot: boolean): OrderHistoryDirection {
  if (order.reduceOnly) {
    return order.side === "A" ? "Close Long" : "Close Short";
  }

  if (order.side === "B") {
    return isSpot ? "Buy" : "Long";
  }

  return isSpot ? "Sell" : "Short";
}

function formatOrderHistoryEntry(
  historicalOrder: HistoricalOrder,
  displayCoin: string | undefined,
): OrderHistory {
  const isSpot = Boolean(displayCoin);

  return {
    ...historicalOrder,
    displayCoin: displayCoin ?? historicalOrder.order.coin,
    direction: formatOrderDirection(historicalOrder.order, isSpot),
  };
}

export function useOrderHistory(
  user: `0x${string}`,
  options: UseHistoricalOrdersOptions = {},
) {
  const historicalOrdersState = useHistoricalOrders(user, options);
  const symbolConverter = useSymbolConverter();

  const data = useMemo<OrderHistoryData | undefined>(() => {
    if (!historicalOrdersState.data) {
      return undefined;
    }

    return {
      ...historicalOrdersState.data,
      orderHistory: historicalOrdersState.data.orderHistory.map((historicalOrder) =>
        formatOrderHistoryEntry(
          historicalOrder,
          symbolConverter?.getSpotByPairId(historicalOrder.order.coin),
        ),
      ),
    };
  }, [historicalOrdersState.data, symbolConverter]);

  return {
    ...historicalOrdersState,
    data,
  };
}
