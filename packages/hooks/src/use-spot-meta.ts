import { useQuery, type UseQueryOptions, type UseQueryResult } from "@tanstack/react-query";
import type { SpotMetaResponse } from "@nktkas/hyperliquid";
import { infoClient } from "./config/hl.js";

export type SpotMetaData = SpotMetaResponse;
export type UseSpotMetaOptions = Omit<
  UseQueryOptions<SpotMetaData, Error, SpotMetaData, ["spot-meta"]>,
  "queryKey" | "queryFn"
>;

export function useSpotMeta(
  options: UseSpotMetaOptions = {},
): UseQueryResult<SpotMetaData, Error> {
  return useQuery({
    queryKey: ["spot-meta"],
    queryFn: () => infoClient.spotMeta(),
    ...options,
  });
}
