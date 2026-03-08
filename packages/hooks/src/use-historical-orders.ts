import { useSubscribe, type UseSubscribeState } from "@outofgas/react-stream";
import type { UserHistoricalOrdersEvent } from "@nktkas/hyperliquid/api/subscription";
import { wsClient } from "./config/hl.js";

export type HistoricalOrder = UserHistoricalOrdersEvent["orderHistory"][number];

export type HistoricalOrdersData = {
  user: `0x${string}`;
  orderHistory: HistoricalOrder[];
};

export type UseHistoricalOrdersOptions = {
  enabled?: boolean;
  onUpdate?: (event: UserHistoricalOrdersEvent) => void;
};

function getHistoricalOrderStatusRank(status: HistoricalOrder["status"]): number {
  if (status === "filled") return 0;
  if (status === "open") return 1;
  return 2;
}

function sortHistoricalOrders(orderHistory: HistoricalOrder[]): HistoricalOrder[] {
  return [...orderHistory].sort((a, b) => {
    if (a.statusTimestamp !== b.statusTimestamp) {
      return b.statusTimestamp - a.statusTimestamp;
    }

    const statusRankDelta =
      getHistoricalOrderStatusRank(a.status) - getHistoricalOrderStatusRank(b.status);
    if (statusRankDelta !== 0) {
      return statusRankDelta;
    }

    if (a.order.timestamp !== b.order.timestamp) {
      return b.order.timestamp - a.order.timestamp;
    }

    return b.order.oid - a.order.oid;
  });
}

function mergeHistoricalOrders(
  previousData: HistoricalOrdersData | undefined,
  incomingEvent: UserHistoricalOrdersEvent,
): HistoricalOrdersData {
  const orderHistory = incomingEvent.isSnapshot
    ? incomingEvent.orderHistory
    : [...(previousData?.orderHistory ?? []), ...incomingEvent.orderHistory];

  return {
    user: incomingEvent.user,
    orderHistory: sortHistoricalOrders(orderHistory),
  };
}

export function useHistoricalOrders(
  user: `0x${string}`,
  options: UseHistoricalOrdersOptions = {},
): UseSubscribeState<HistoricalOrdersData> {
  const { enabled: enabledOverride, onUpdate } = options;
  const enabled = enabledOverride ?? Boolean(user);

  return useSubscribe<HistoricalOrdersData>({
    key: ["historical-orders", user],
    enabled,
    subscribe: async ({ onData, onError }) => {
      let data: HistoricalOrdersData | undefined;

      const subscription = await wsClient.userHistoricalOrders({ user }, (event) => {
        try {
          if (!event.isSnapshot) {
            onUpdate?.(event);
          }

          data = mergeHistoricalOrders(data, event);
          onData(data);
        } catch (error) {
          onError(
            error instanceof Error
              ? error
              : new Error("Failed to process user historical orders event"),
          );
        }
      });

      return {
        unsubscribe: () => subscription.unsubscribe(),
      };
    },
  });
}
