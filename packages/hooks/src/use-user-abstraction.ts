import type { UserAbstractionResponse } from "@nktkas/hyperliquid/api/info";
import {
  type UseQueryOptions,
  type UseQueryResult,
  useQuery,
} from "@tanstack/react-query";
import { infoClient } from "./config/hl.js";

export type UserAbstractionData = UserAbstractionResponse;
export type UseUserAbstractionOptions = Omit<
  UseQueryOptions<
    UserAbstractionData,
    Error,
    UserAbstractionData,
    ["userAbstraction", `0x${string}`]
  >,
  "queryKey" | "queryFn"
>;

export function useUserAbstraction(
  user: `0x${string}`,
  options: UseUserAbstractionOptions = {},
): UseQueryResult<UserAbstractionData, Error> {
  const enabled = options.enabled ?? Boolean(user);

  return useQuery({
    queryKey: ["userAbstraction", user],
    queryFn: () => infoClient.userAbstraction({ user }),
    ...options,
    enabled,
  });
}
