import { useEffect, useMemo, useState } from "react";
import { useSubscribe, type UseSubscribeState } from "@outofgas/react-stream";
import type { UserTwapSliceFillsEvent } from "@nktkas/hyperliquid/api/subscription";
import { wsClient } from "./config/hl.js";

export type UserTwapSliceFillsData = {
  user: `0x${string}`;
  twapSliceFills: UserTwapSliceFillsEvent["twapSliceFills"];
};

export type UseUserTwapSliceFillsOptions = {
  enabled?: boolean;
  onUpdate?: (event: UserTwapSliceFillsEvent) => void;
};

export function useUserTwapSliceFills(
  user: `0x${string}`,
  options: UseUserTwapSliceFillsOptions = {},
): UseSubscribeState<UserTwapSliceFillsData> {
  const { enabled: enabledOverride, onUpdate } = options;
  const enabled = enabledOverride ?? Boolean(user);
  const rawState = useSubscribe<UserTwapSliceFillsEvent>({
    key: ["user-twap-slice-fills", user],
    enabled,
    subscribe: async ({ onData, onError }) => {
      const subscription = await wsClient.userTwapSliceFills({ user }, (event) => {
        try {
          onUpdate?.(event);
          onData(event);
        } catch (error) {
          onError(
            error instanceof Error
              ? error
              : new Error("Failed to process user twap slice fills event"),
          );
        }
      });

      return {
        unsubscribe: () => subscription.unsubscribe(),
      };
    },
  });

  const [data, setData] = useState<UserTwapSliceFillsData | undefined>(undefined);

  useEffect(() => {
    if (!enabled) {
      setData(undefined);
      return;
    }

    if (!rawState.data) {
      return;
    }

    setData((previous) => {
      if (rawState.data?.isSnapshot || !previous || previous.user !== rawState.data.user) {
        return {
          user: rawState.data.user,
          twapSliceFills: rawState.data.twapSliceFills,
        };
      }

      return {
        user: rawState.data.user,
        twapSliceFills: [...previous.twapSliceFills, ...rawState.data.twapSliceFills],
      };
    });
  }, [enabled, rawState.data, user]);

  return useMemo(
    () => ({
      ...rawState,
      data,
    }),
    [data, rawState],
  );
}
