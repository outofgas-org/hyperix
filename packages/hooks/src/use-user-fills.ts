import { useSubscribe, type UseSubscribeState } from "@outofgas/react-stream";
import type { UserFillsEvent } from "@nktkas/hyperliquid/api/subscription";
import { wsClient } from "./config/hl.js";

export type UserFill = UserFillsEvent["fills"][number];

export type UserFillsData = {
  user: `0x${string}`;
  fills: UserFill[];
};

export type UseUserFillsOptions = {
  aggregateByTime?: boolean;
  enabled?: boolean;
  onUpdate?: (event: UserFillsEvent) => void;
};

function mergeUserFills(
  previousData: UserFillsData | undefined,
  incomingEvent: UserFillsEvent,
): UserFillsData {
  if (incomingEvent.isSnapshot) {
    return {
      user: incomingEvent.user,
      fills: incomingEvent.fills,
    };
  }

  return {
    user: incomingEvent.user,
    fills: [...(previousData?.fills ?? []), ...incomingEvent.fills],
  };
}

export function useUserFills(
  user: `0x${string}`,
  options: UseUserFillsOptions = {},
): UseSubscribeState<UserFillsData> {
  const { aggregateByTime = true, enabled: enabledOverride, onUpdate } = options;
  const enabled = enabledOverride ?? Boolean(user);

  return useSubscribe<UserFillsData>({
    key: ["user-fills", user, aggregateByTime],
    enabled,
    subscribe: async ({ onData, onError }) => {
      let data: UserFillsData | undefined;

      const subscription = await wsClient.userFills({ user, aggregateByTime }, (event) => {
        try {
          if (!event.isSnapshot) {
            onUpdate?.(event);
          }

          data = mergeUserFills(data, event);
          onData(data);
        } catch (error) {
          onError(
            error instanceof Error ? error : new Error("Failed to process user fills event"),
          );
        }
      });

      return {
        unsubscribe: () => subscription.unsubscribe(),
      };
    },
  });
}
