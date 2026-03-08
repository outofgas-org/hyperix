import { useSubscribe, type UseSubscribeState } from "@outofgas/react-stream";
import type { OpenOrdersEvent } from "@nktkas/hyperliquid/api/subscription";
import { wsClient } from "./config/hl.js";

export type OpenOrder = OpenOrdersEvent["orders"][number];

export type OpenOrdersData = {
  dex: string;
  user: `0x${string}`;
  orders: OpenOrder[];
};

export type UseOpenOrdersOptions = {
  dex?: string;
  enabled?: boolean;
  onUpdate?: (event: OpenOrdersEvent) => void;
};

const DEFAULT_DEX = "ALL_DEXS";

function compareOpenOrders(left: OpenOrder, right: OpenOrder): number {
  return right.timestamp - left.timestamp;
}

function formatOpenOrders(event: OpenOrdersEvent): OpenOrdersData {
  return {
    dex: event.dex,
    user: event.user,
    orders: [...event.orders].sort(compareOpenOrders),
  };
}

export function useOpenOrders(
  user: `0x${string}`,
  options: UseOpenOrdersOptions = {},
): UseSubscribeState<OpenOrdersData> {
  const { dex = DEFAULT_DEX, enabled: enabledOverride, onUpdate } = options;
  const enabled = enabledOverride ?? Boolean(user);

  return useSubscribe<OpenOrdersData>({
    key: ["open-orders", user, dex ?? ""],
    enabled,
    subscribe: async ({ onData, onError }) => {
      const subscription = await wsClient.openOrders({ user, dex }, (event) => {
        try {
          onUpdate?.(event);
          onData(formatOpenOrders(event));
        } catch (error) {
          onError(
            error instanceof Error
              ? error
              : new Error("Failed to process open orders event"),
          );
        }
      });

      return {
        unsubscribe: () => subscription.unsubscribe(),
      };
    },
  });
}
