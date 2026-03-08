import { useMemo } from "react";
import { useSubscribe, type UseSubscribeState } from "@outofgas/react-stream";
import type { OpenOrdersEvent } from "@nktkas/hyperliquid/api/subscription";
import { wsClient } from "./config/hl.js";
import type { SymbolConverter } from "./lib/symbol-converter.js";
import { useSymbolConverter } from "./use-symbol-converter.js";

type RawOpenOrder = OpenOrdersEvent["orders"][number];

export type OpenOrderDirection =
  | "Buy"
  | "Sell"
  | "Long"
  | "Short"
  | "Close Long"
  | "Close Short";

export type OpenOrder = RawOpenOrder & {
  isSpot: boolean;
  displayCoin: string;
  direction: OpenOrderDirection;
  assetId: number | undefined;
};

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

type RawOpenOrdersData = {
  dex: string;
  user: `0x${string}`;
  orders: RawOpenOrder[];
};

const DEFAULT_DEX = "ALL_DEXS";

function compareOpenOrders(left: OpenOrder, right: OpenOrder): number {
  return right.timestamp - left.timestamp;
}

function formatOpenOrderDirection(order: RawOpenOrder, isSpot: boolean): OpenOrderDirection {
  if (order.reduceOnly) {
    return order.side === "A" ? "Close Long" : "Close Short";
  }

  if (order.side === "B") {
    return isSpot ? "Buy" : "Long";
  }

  return isSpot ? "Sell" : "Short";
}

function formatOpenOrder(
  order: RawOpenOrder,
  displayCoin: string | undefined,
  assetId: number | undefined,
): OpenOrder {
  const isSpot = Boolean(displayCoin);

  return {
    ...order,
    isSpot,
    displayCoin: displayCoin ?? order.coin,
    direction: formatOpenOrderDirection(order, isSpot),
    assetId,
  };
}

function formatOpenOrders(
  data: RawOpenOrdersData,
  symbolConverter?: SymbolConverter | null,
): OpenOrdersData {
  return {
    dex: data.dex,
    user: data.user,
    orders: [...data.orders]
      .map((order) => {
        const displayCoin = symbolConverter?.getSpotByPairId(order.coin);
        return formatOpenOrder(
          order,
          displayCoin,
          symbolConverter?.getAssetId(displayCoin ?? order.coin),
        );
      })
      .sort(compareOpenOrders),
  };
}

export function useOpenOrders(
  user: `0x${string}`,
  options: UseOpenOrdersOptions = {},
): UseSubscribeState<OpenOrdersData> {
  const { dex = DEFAULT_DEX, enabled: enabledOverride, onUpdate } = options;
  const enabled = enabledOverride ?? Boolean(user);
  const symbolConverter = useSymbolConverter();
  const openOrdersState = useSubscribe<RawOpenOrdersData>({
    key: ["open-orders", user, dex ?? ""],
    enabled,
    subscribe: async ({ onData, onError }) => {
      const subscription = await wsClient.openOrders({ user, dex }, (event) => {
        try {
          onUpdate?.(event);
          onData({
            dex: event.dex,
            user: event.user,
            orders: event.orders,
          });
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

  const data = useMemo<OpenOrdersData | undefined>(() => {
    if (!openOrdersState.data) {
      return undefined;
    }

    return formatOpenOrders(openOrdersState.data, symbolConverter);
  }, [openOrdersState.data, symbolConverter]);

  return {
    ...openOrdersState,
    data,
  };
}
