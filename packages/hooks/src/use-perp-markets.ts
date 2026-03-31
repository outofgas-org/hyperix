import { useMemo } from "react";
import type { AllDexsAssetCtxsData } from "./use-all-dexs-asset-ctxs.js";
import { useAllDexsAssetCtxs } from "./use-all-dexs-asset-ctxs.js";
import { useAllPerpMetas } from "./use-all-perp-metas.js";
import { useSpotMeta } from "./use-spot-meta.js";

export type PerpMarket = {
  symbol: string;
  coin: string;
  dex: string;
  universeIndex: number;
  collateralToken: string;
  maxLeverage: number;
  szDecimals: number;
  onlyIsolated: boolean;
  isDelisted: boolean;
  markPrice: number;
  midPrice: number | null;
  oraclePrice: number;
  premium: number | null;
  fundingRate: number;
  openInterest: number;
  volume24h: number;
  prevDayPrice: number;
};

export type UsePerpMarketsOptions = {
  enabled?: boolean;
  includeDelisted?: boolean;
};

function getDexName(symbol: string): string {
  return symbol.includes(":") ? (symbol.split(":")[0] ?? "") : "";
}

function getCoinName(symbol: string): string {
  return symbol.includes(":") ? (symbol.split(":")[1] ?? symbol) : symbol;
}

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

function buildCtxMap(data: AllDexsAssetCtxsData | undefined) {
  return new Map(data?.ctxs ?? []);
}

export function usePerpMarkets(options: UsePerpMarketsOptions = {}) {
  const { enabled = true, includeDelisted = false } = options;
  const allPerpMetasState = useAllPerpMetas({ enabled });
  const spotMetaState = useSpotMeta({ enabled });
  const assetCtxsState = useAllDexsAssetCtxs({ enabled });

  const markets = useMemo<PerpMarket[]>(() => {
    const allPerpMetas = allPerpMetasState.data;
    const spotMeta = spotMetaState.data;
    const assetCtxsByDex = buildCtxMap(assetCtxsState.data);

    if (!allPerpMetas || !spotMeta) {
      return [];
    }

    const tokenByIndex = new Map(spotMeta.tokens.map((token) => [token.index, token]));

    return allPerpMetas
      .flatMap((dexMetadata) => {
        const dex = getDexName(dexMetadata.universe[0]?.name ?? "");
        const collateralToken = tokenByIndex.get(dexMetadata.collateralToken)?.name ?? "USDC";
        const ctxs = assetCtxsByDex.get(dex) ?? [];

        return dexMetadata.universe.map((meta, universeIndex) => {
          const ctx = ctxs[universeIndex];

          return {
            symbol: meta.name,
            coin: getCoinName(meta.name),
            dex,
            universeIndex,
            collateralToken,
            maxLeverage: meta.maxLeverage,
            szDecimals: meta.szDecimals,
            onlyIsolated: meta.onlyIsolated ?? false,
            isDelisted: meta.isDelisted ?? false,
            markPrice: toNumber(ctx?.markPx),
            midPrice: toOptionalNumber(ctx?.midPx),
            oraclePrice: toNumber(ctx?.oraclePx),
            premium: toOptionalNumber(ctx?.premium),
            fundingRate: toNumber(ctx?.funding),
            openInterest: toNumber(ctx?.openInterest),
            volume24h: toNumber(ctx?.dayNtlVlm),
            prevDayPrice: toNumber(ctx?.prevDayPx),
          };
        });
      })
      .filter((market) => includeDelisted || !market.isDelisted);
  }, [allPerpMetasState.data, spotMetaState.data, assetCtxsState.data, includeDelisted]);

  return {
    data: markets,
    loading: allPerpMetasState.isLoading || spotMetaState.isLoading || assetCtxsState.loading,
    ready: allPerpMetasState.isSuccess && spotMetaState.isSuccess && assetCtxsState.ready,
    error:
      allPerpMetasState.error?.message ?? spotMetaState.error?.message ?? assetCtxsState.error,
  };
}
