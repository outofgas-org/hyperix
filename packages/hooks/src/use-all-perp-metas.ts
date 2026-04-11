import type { AllPerpMetasResponse } from "@nktkas/hyperliquid/api/info";
import {
  type UseQueryOptions,
  type UseQueryResult,
  useQuery,
} from "@tanstack/react-query";
import { infoClient } from "./config/hl.js";

export type AllPerpMetasData = AllPerpMetasResponse;
export type UseAllPerpMetasOptions = Omit<
  UseQueryOptions<
    AllPerpMetasData,
    Error,
    AllPerpMetasData,
    ["all-perp-metas"]
  >,
  "queryKey" | "queryFn"
>;

export function useAllPerpMetas(
  options: UseAllPerpMetasOptions = {},
): UseQueryResult<AllPerpMetasData, Error> {
  return useQuery({
    queryKey: ["all-perp-metas"],
    queryFn: () => infoClient.allPerpMetas(),
    ...options,
  });
}
