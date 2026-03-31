import { useQuery, type UseQueryOptions, type UseQueryResult } from "@tanstack/react-query";
import type { DelegatorSummaryResponse } from "@nktkas/hyperliquid/api/info";
import { infoClient } from "./config/hl.js";

export type UserDelegatorSummaryData = DelegatorSummaryResponse;
export type UseUserDelegatorSummaryOptions = Omit<
  UseQueryOptions<
    UserDelegatorSummaryData,
    Error,
    UserDelegatorSummaryData,
    ["userDelegatorSummary", `0x${string}`]
  >,
  "queryKey" | "queryFn"
>;

export function useUserDelegatorSummary(
  user: `0x${string}`,
  options: UseUserDelegatorSummaryOptions = {},
): UseQueryResult<UserDelegatorSummaryData, Error> {
  const enabled = options.enabled ?? Boolean(user);

  return useQuery({
    queryKey: ["userDelegatorSummary", user],
    queryFn: () => infoClient.delegatorSummary({ user }),
    ...options,
    enabled,
  });
}
