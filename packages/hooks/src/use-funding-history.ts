import type { FundingHistoryResponse } from "@nktkas/hyperliquid/api/info";
import {
  type UseQueryOptions,
  type UseQueryResult,
  useQuery,
} from "@tanstack/react-query";
import { infoClient } from "./config/hl.js";

export type FundingHistory = FundingHistoryResponse[number];
export type FundingHistoryData = FundingHistory[];

type FundingHistoryQueryKey = [
  "funding-history",
  string,
  number,
  number | undefined,
];

export type UseFundingHistoryOptions = Omit<
  UseQueryOptions<
    FundingHistoryData,
    Error,
    FundingHistoryData,
    FundingHistoryQueryKey
  >,
  "queryKey" | "queryFn"
> & {
  endTime?: number;
};

export function useFundingHistory(
  coin: string,
  startTime: number,
  options: UseFundingHistoryOptions = {},
): UseQueryResult<FundingHistoryData, Error> {
  const { enabled: enabledOverride, endTime, ...queryOptions } = options;
  const normalizedCoin = coin.trim();
  const enabled = enabledOverride ?? Boolean(normalizedCoin && startTime >= 0);

  return useQuery({
    queryKey: ["funding-history", normalizedCoin, startTime, endTime],
    queryFn: () =>
      infoClient.fundingHistory({
        coin: normalizedCoin,
        startTime,
        endTime,
      }),
    ...queryOptions,
    enabled,
  });
}
