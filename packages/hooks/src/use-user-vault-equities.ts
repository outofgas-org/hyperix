import type { UserVaultEquitiesResponse } from "@nktkas/hyperliquid/api/info";
import {
  type UseQueryOptions,
  type UseQueryResult,
  useQuery,
} from "@tanstack/react-query";
import { infoClient } from "./config/hl.js";

export type UserVaultEquity = UserVaultEquitiesResponse[number];
export type UserVaultEquitiesData = UserVaultEquitiesResponse;
export type UseUserVaultEquitiesOptions = Omit<
  UseQueryOptions<
    UserVaultEquitiesData,
    Error,
    UserVaultEquitiesData,
    ["userVaultEquities", `0x${string}`]
  >,
  "queryKey" | "queryFn"
>;

export function useUserVaultEquities(
  user: `0x${string}`,
  options: UseUserVaultEquitiesOptions = {},
): UseQueryResult<UserVaultEquitiesData, Error> {
  const enabled = options.enabled ?? Boolean(user);

  return useQuery({
    queryKey: ["userVaultEquities", user],
    queryFn: () => infoClient.userVaultEquities({ user }),
    ...options,
    enabled,
  });
}
