import { useMemo } from "react";
import { useAllPerpMetas } from "./use-all-perp-metas.js";
import { useSpotMeta } from "./use-spot-meta.js";

export type PerpAllDex = {
  dexName: string;
  quoteCoin: string;
  quoteCoinAddress: string;
};

export type UsePerpAllDexOptions = {
  enabled?: boolean;
};

function getDexName(symbol: string): string {
  const dexName = symbol.includes(":") ? (symbol.split(":")[0] ?? "") : "";
  return dexName === "" ? "core" : dexName;
}

export function usePerpAllDex(options: UsePerpAllDexOptions = {}) {
  const { enabled = true } = options;
  const allPerpMetasState = useAllPerpMetas({ enabled });
  const spotMetaState = useSpotMeta({ enabled });

  const data = useMemo<PerpAllDex[] | undefined>(() => {
    const allPerpMetas = allPerpMetasState.data;
    const spotMeta = spotMetaState.data;

    if (!allPerpMetas || !spotMeta) {
      return undefined;
    }

    const tokenByIndex = new Map(
      spotMeta.tokens.map((token) => [token.index, token]),
    );

    return allPerpMetas.map((dexMetadata) => {
      const dexName = getDexName(dexMetadata.universe[0]?.name ?? "");
      const tokenInfo = tokenByIndex.get(dexMetadata.collateralToken);

      return {
        dexName,
        quoteCoin: tokenInfo?.name ?? "USDC",
        quoteCoinAddress: tokenInfo?.tokenId ?? "",
      };
    });
  }, [allPerpMetasState.data, spotMetaState.data]);

  return {
    data,
    isPending: allPerpMetasState.isPending || spotMetaState.isPending,
    isLoading: allPerpMetasState.isLoading || spotMetaState.isLoading,
    isSuccess: allPerpMetasState.isSuccess && spotMetaState.isSuccess,
    error: allPerpMetasState.error ?? spotMetaState.error,
  };
}
