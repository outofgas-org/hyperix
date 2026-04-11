import type { UserTwapHistoryEvent } from "@nktkas/hyperliquid/api/subscription";
import { type UseSubscribeState, useSubscribe } from "@outofgas/react-stream";
import { useEffect, useMemo, useState } from "react";
import { wsClient } from "./config/hl.js";

export type UserTwapHistoryData = {
  user: `0x${string}`;
  history: UserTwapHistoryEvent["history"];
};

export type UseUserTwapHistoryOptions = {
  enabled?: boolean;
  onUpdate?: (event: UserTwapHistoryEvent) => void;
};

export function useUserTwapHistory(
  user: `0x${string}`,
  options: UseUserTwapHistoryOptions = {},
): UseSubscribeState<UserTwapHistoryData> {
  const { enabled: enabledOverride, onUpdate } = options;
  const enabled = enabledOverride ?? Boolean(user);
  const rawState = useSubscribe<UserTwapHistoryEvent>({
    key: ["user-twap-history", user],
    enabled,
    subscribe: async ({ onData, onError }) => {
      const subscription = await wsClient.userTwapHistory({ user }, (event) => {
        try {
          onUpdate?.(event);
          onData(event);
        } catch (error) {
          onError(
            error instanceof Error
              ? error
              : new Error("Failed to process user twap history event"),
          );
        }
      });

      return {
        unsubscribe: () => subscription.unsubscribe(),
      };
    },
  });

  const [data, setData] = useState<UserTwapHistoryData | undefined>(undefined);

  useEffect(() => {
    if (!enabled) {
      setData(undefined);
      return;
    }

    const nextEvent = rawState.data;

    if (!nextEvent) {
      return;
    }

    setData((previous) => {
      if (
        nextEvent.isSnapshot ||
        !previous ||
        previous.user !== nextEvent.user
      ) {
        return {
          user: nextEvent.user,
          history: nextEvent.history,
        };
      }

      return {
        user: nextEvent.user,
        history: [...previous.history, ...nextEvent.history],
      };
    });
  }, [enabled, rawState.data]);

  return useMemo(
    () => ({
      ...rawState,
      data,
    }),
    [data, rawState],
  );
}
