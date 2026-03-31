import { useQuery, type UseQueryOptions, type UseQueryResult } from "@tanstack/react-query";
import type { SpotMetaAndAssetCtxsResponse } from "@nktkas/hyperliquid/api/info";
import { infoClient } from "./config/hl.js";

export type SpotMetaAndAssetCtxsData = SpotMetaAndAssetCtxsResponse;
export type UseSpotMetaAndAssetCtxsOptions = Omit<
  UseQueryOptions<SpotMetaAndAssetCtxsData, Error, SpotMetaAndAssetCtxsData, ["spot-meta-and-asset-ctxs"]>,
  "queryKey" | "queryFn"
>;

export function useSpotMetaAndAssetCtxs(
  options: UseSpotMetaAndAssetCtxsOptions = {},
): UseQueryResult<SpotMetaAndAssetCtxsData, Error> {
  return useQuery({
    queryKey: ["spot-meta-and-asset-ctxs"],
    queryFn: () => infoClient.spotMetaAndAssetCtxs(),
    ...options,
  });
}
