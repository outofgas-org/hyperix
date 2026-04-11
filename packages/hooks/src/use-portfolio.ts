import type { PortfolioResponse } from "@nktkas/hyperliquid/api/info";
import {
  type UseQueryOptions,
  type UseQueryResult,
  useQuery,
} from "@tanstack/react-query";
import { infoClient } from "./config/hl.js";

export type PortfolioData = PortfolioResponse;
export type UsePortfolioOptions = Omit<
  UseQueryOptions<
    PortfolioData,
    Error,
    PortfolioData,
    ["portfolio", `0x${string}`]
  >,
  "queryKey" | "queryFn"
>;

export function usePortfolio(
  user: `0x${string}`,
  options: UsePortfolioOptions = {},
): UseQueryResult<PortfolioData, Error> {
  const enabled = options.enabled ?? Boolean(user);

  return useQuery({
    queryKey: ["portfolio", user],
    queryFn: () => infoClient.portfolio({ user }),
    ...options,
    enabled,
  });
}
