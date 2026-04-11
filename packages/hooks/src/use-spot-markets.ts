import { useMemo } from "react";
import type { SpotAssetCtxsData } from "./use-spot-asset-ctxs.js";
import { useSpotAssetCtxs } from "./use-spot-asset-ctxs.js";
import { useSpotMeta } from "./use-spot-meta.js";

export type SpotMarket = {
  symbol: string;
  pairId: string;
  baseToken: string;
  quoteToken: string;
  baseTokenFullName: string | null;
  quoteTokenFullName: string | null;
  universeIndex: number;
  szDecimals: number;
  weiDecimals: number;
  tokenId: string;
  isCanonical: boolean;
  markPrice: number;
  midPrice: number | null;
  prevDayPrice: number;
  volume24h: number;
  baseVolume24h: number;
  circulatingSupply: number;
  totalSupply: number;
};

export type UseSpotMarketsOptions = {
  enabled?: boolean;
};

function toNumber(value: string | null | undefined): number {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function toOptionalNumber(value: string | null | undefined): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
}

function buildCtxMap(data: SpotAssetCtxsData | undefined) {
  return new Map((data ?? []).map((ctx) => [ctx.coin, ctx]));
}

export function useSpotMarkets(options: UseSpotMarketsOptions = {}) {
  const { enabled = true } = options;
  const spotMetaState = useSpotMeta({ enabled });
  const assetCtxsState = useSpotAssetCtxs({ enabled });

  const markets = useMemo<SpotMarket[]>(() => {
    const spotMeta = spotMetaState.data;
    const assetCtxsByPairId = buildCtxMap(assetCtxsState.data);

    if (!spotMeta) {
      return [];
    }

    const tokenByIndex = new Map(
      spotMeta.tokens.map((token) => [token.index, token]),
    );

    return spotMeta.universe.map((market) => {
      const baseToken = tokenByIndex.get(market.tokens[0]);
      const quoteToken = tokenByIndex.get(market.tokens[1]);
      const ctx = assetCtxsByPairId.get(market.name);

      return {
        symbol:
          baseToken && quoteToken
            ? `${baseToken.name}/${quoteToken.name}`
            : market.name,
        pairId: market.name,
        baseToken: baseToken?.name ?? "",
        quoteToken: quoteToken?.name ?? "",
        baseTokenFullName: baseToken?.fullName ?? null,
        quoteTokenFullName: quoteToken?.fullName ?? null,
        universeIndex: market.index,
        szDecimals: baseToken?.szDecimals ?? 0,
        weiDecimals: baseToken?.weiDecimals ?? 0,
        tokenId: baseToken?.tokenId ?? "",
        isCanonical: market.isCanonical ?? false,
        markPrice: toNumber(ctx?.markPx),
        midPrice: toOptionalNumber(ctx?.midPx),
        prevDayPrice: toNumber(ctx?.prevDayPx),
        volume24h: toNumber(ctx?.dayNtlVlm),
        baseVolume24h: toNumber(ctx?.dayBaseVlm),
        circulatingSupply: toNumber(ctx?.circulatingSupply),
        totalSupply: toNumber(ctx?.totalSupply),
      };
    });
  }, [assetCtxsState.data, spotMetaState.data]);

  return {
    data: markets,
    loading: spotMetaState.isLoading || assetCtxsState.loading,
    ready: spotMetaState.isSuccess && assetCtxsState.ready,
    error: spotMetaState.error?.message ?? assetCtxsState.error,
  };
}
