import type { MaxBuilderFeeResponse } from "@nktkas/hyperliquid/api/info";
import {
  type UseQueryOptions,
  type UseQueryResult,
  useQuery,
} from "@tanstack/react-query";
import { infoClient } from "./config/hl.js";

export type MaxBuilderFeeData = MaxBuilderFeeResponse;
export type UseMaxBuilderFeeOptions = Omit<
  UseQueryOptions<
    MaxBuilderFeeData,
    Error,
    MaxBuilderFeeData,
    ["max-builder-fee", `0x${string}`, `0x${string}`]
  >,
  "queryKey" | "queryFn"
>;

export function useMaxBuilderFee(
  user: `0x${string}`,
  builder: `0x${string}`,
  options: UseMaxBuilderFeeOptions = {},
): UseQueryResult<MaxBuilderFeeData, Error> {
  const enabled = options.enabled ?? Boolean(user && builder);

  return useQuery({
    queryKey: ["max-builder-fee", user, builder],
    queryFn: () => infoClient.maxBuilderFee({ user, builder }),
    ...options,
    enabled,
  });
}
