import type { AllDexsAssetCtxsEvent } from "@nktkas/hyperliquid/api/subscription";
import { useMemo } from "react";
import type { SymbolConverter } from "./lib/symbol-converter.js";
import { useAllDexsAssetCtxs } from "./use-all-dexs-asset-ctxs.js";
import { useAllMids } from "./use-all-mids.js";
import { useSymbolConverter } from "./use-symbol-converter.js";

export type MidSource = "all-mids" | "all-dexs-asset-ctxs";

export type UseMidResult = {
  data: string | undefined;
  loading: boolean;
  ready: boolean;
  error: string | undefined;
  source: MidSource | undefined;
};

function isSpotCoin(coin: string) {
  return coin.includes("/");
}

function getPerpCtx(
  coin: string,
  assetCtxs?: AllDexsAssetCtxsEvent,
  symbolConverter?: SymbolConverter | null,
) {
  if (!symbolConverter || !assetCtxs) {
    return undefined;
  }

  const assetId = symbolConverter.getAssetId(coin);
  if (assetId === undefined) {
    return undefined;
  }

  const builder = coin.includes(":") ? coin.split(":")[0] : "";
  const index = assetId % 10_000;
  const prices = assetCtxs.ctxs.find(([dex]) => dex === builder)?.[1];

  return prices?.[index];
}

export function useMid(coin: string): UseMidResult {
  const symbolConverter = useSymbolConverter();
  const spot = isSpotCoin(coin);
  const midsState = useAllMids({ enabled: spot && Boolean(coin) });
  const assetCtxsState = useAllDexsAssetCtxs({
    enabled: !spot && Boolean(coin),
  });

  return useMemo(() => {
    if (!coin) {
      return {
        data: undefined,
        loading: false,
        ready: false,
        error: undefined,
        source: undefined,
      };
    }

    if (!symbolConverter) {
      return {
        data: undefined,
        loading: true,
        ready: false,
        error: undefined,
        source: undefined,
      };
    }

    if (spot) {
      const id = symbolConverter.getSpotPairId(coin);

      return {
        data: id ? midsState.data?.mids?.[id] : undefined,
        loading: midsState.loading,
        ready: midsState.ready,
        error: midsState.error,
        source: "all-mids",
      };
    }

    const ctx = getPerpCtx(coin, assetCtxsState.data, symbolConverter);

    return {
      data: ctx?.midPx ?? undefined,
      loading: assetCtxsState.loading,
      ready: assetCtxsState.ready,
      error: assetCtxsState.error,
      source: "all-dexs-asset-ctxs",
    };
  }, [
    coin,
    spot,
    symbolConverter,
    midsState.data,
    midsState.loading,
    midsState.ready,
    midsState.error,
    assetCtxsState.data,
    assetCtxsState.loading,
    assetCtxsState.ready,
    assetCtxsState.error,
  ]);
}
