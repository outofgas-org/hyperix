import type { UseSubscribeState } from "@outofgas/react-stream";
import { useMemo } from "react";
import type { SymbolConverter } from "./lib/symbol-converter.js";
import type { AllDexsAssetCtxsData } from "./use-all-dexs-asset-ctxs.js";
import { useAllDexsAssetCtxs } from "./use-all-dexs-asset-ctxs.js";
import {
  type AllDexsClearingHouseStateData,
  type UseAllDexsClearingHouseStateOptions,
  useAllDexsClearingHouseState,
} from "./use-all-dexs-clearing-house-state.js";
import type { OpenOrder } from "./use-open-orders.js";
import { useOpenOrders } from "./use-open-orders.js";
import { useSymbolConverter } from "./use-symbol-converter.js";

export type RawPosition =
  AllDexsClearingHouseStateData["clearinghouseStates"][number][1]["assetPositions"][number];

export type Position = RawPosition & {
  markPrice: number | undefined;
  fundingSinceOpen: number;
  side: "Long" | "Short" | "Flat";
  takeProfitTriggerPx: string | undefined;
  stopLossTriggerPx: string | undefined;
  triggerOrders: OpenOrder[];
};

function getSide(size: string): Position["side"] {
  const numericSize = Number(size);
  if (numericSize > 0) {
    return "Long";
  }

  if (numericSize < 0) {
    return "Short";
  }

  return "Flat";
}

function getPerpMarkPrice(
  coin: string,
  assetCtxs: AllDexsAssetCtxsData | undefined,
  symbolConverter: SymbolConverter | null,
) {
  if (!assetCtxs || !symbolConverter) {
    return undefined;
  }

  const assetId = symbolConverter.getAssetId(coin);
  if (assetId === undefined) {
    return undefined;
  }

  const dex = coin.includes(":") ? (coin.split(":")[0] ?? "") : "";
  const index = assetId % 10_000;
  const ctxs = assetCtxs.ctxs.find(([ctxDex]) => ctxDex === dex)?.[1];

  return ctxs?.[index] ? Number(ctxs[index].markPx) : undefined;
}

function getTriggerOrdersByCoin(orders: OpenOrder[]) {
  return orders.reduce<Map<string, OpenOrder[]>>((map, order) => {
    if (!order.isTrigger || !order.triggerCondition) {
      return map;
    }

    const current = map.get(order.coin) ?? [];
    current.push(order);
    map.set(order.coin, current);
    return map;
  }, new Map());
}

function getTpSl(
  orders: OpenOrder[] | undefined,
): Pick<
  Position,
  "takeProfitTriggerPx" | "stopLossTriggerPx" | "triggerOrders"
> {
  let takeProfitTriggerPx: string | undefined;
  let stopLossTriggerPx: string | undefined;

  for (const order of orders ?? []) {
    if (order.orderType.includes("Take Profit")) {
      takeProfitTriggerPx = order.triggerPx;
      continue;
    }

    stopLossTriggerPx = order.triggerPx;
  }

  return {
    takeProfitTriggerPx,
    stopLossTriggerPx,
    triggerOrders: orders ?? [],
  };
}

export function usePositions(
  user: `0x${string}`,
  options: UseAllDexsClearingHouseStateOptions = {},
): UseSubscribeState<Position[]> {
  const symbolConverter = useSymbolConverter();
  const positionsState = useAllDexsClearingHouseState(user, options);
  const assetCtxsState = useAllDexsAssetCtxs({ enabled: options.enabled });
  const openOrdersState = useOpenOrders(user, { enabled: options.enabled });

  const data = useMemo<Position[] | undefined>(() => {
    const rawPositions = positionsState.data?.clearinghouseStates
      .flatMap(([, state]) => state.assetPositions)
      .sort((left, right) =>
        Number(left.position.positionValue) <
        Number(right.position.positionValue)
          ? 1
          : -1,
      );
    const triggerOrdersByCoin = getTriggerOrdersByCoin(
      openOrdersState.data?.orders ?? [],
    );

    return rawPositions?.map((positionRecord) => {
      const position = positionRecord.position;
      const tpSl = getTpSl(triggerOrdersByCoin.get(position.coin));

      return {
        ...positionRecord,
        markPrice: getPerpMarkPrice(
          position.coin,
          assetCtxsState.data,
          symbolConverter,
        ),
        fundingSinceOpen: -Number(position.cumFunding.sinceOpen),
        side: getSide(position.szi),
        ...tpSl,
      };
    });
  }, [
    positionsState.data,
    openOrdersState.data,
    assetCtxsState.data,
    symbolConverter,
  ]);

  return {
    ...positionsState,
    loading:
      positionsState.loading || assetCtxsState.loading || openOrdersState.loading,
    ready:
      positionsState.ready &&
      assetCtxsState.ready &&
      openOrdersState.ready &&
      symbolConverter !== null,
    error:
      positionsState.error ?? assetCtxsState.error ?? openOrdersState.error,
    data,
  };
}
