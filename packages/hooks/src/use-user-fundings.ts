import type { UserFundingsEvent } from "@nktkas/hyperliquid/api/subscription";
import { type UseSubscribeState, useSubscribe } from "@outofgas/react-stream";
import { wsClient } from "./config/hl.js";

export type UserFunding = UserFundingsEvent["fundings"][number];

export type UserFundingsData = {
  user: `0x${string}`;
  fundings: UserFunding[];
};

export type UseUserFundingsOptions = {
  enabled?: boolean;
  onUpdate?: (event: UserFundingsEvent) => void;
};

function mergeUserFundings(
  previousData: UserFundingsData | undefined,
  incomingEvent: UserFundingsEvent,
): UserFundingsData {
  const fundings = incomingEvent.isSnapshot
    ? incomingEvent.fundings
    : [...(previousData?.fundings ?? []), ...incomingEvent.fundings];

  if (incomingEvent.isSnapshot) {
    return {
      user: incomingEvent.user,
      fundings: [...fundings].sort((a, b) => b.time - a.time),
    };
  }

  return {
    user: incomingEvent.user,
    fundings: fundings.sort((a, b) => b.time - a.time),
  };
}

export function useUserFundings(
  user: `0x${string}`,
  options: UseUserFundingsOptions = {},
): UseSubscribeState<UserFundingsData> {
  const { enabled: enabledOverride, onUpdate } = options;
  const enabled = enabledOverride ?? Boolean(user);

  return useSubscribe<UserFundingsData>({
    key: ["user-fundings", user],
    enabled,
    subscribe: async ({ onData, onError }) => {
      let data: UserFundingsData | undefined;

      const subscription = await wsClient.userFundings({ user }, (event) => {
        try {
          if (!event.isSnapshot) {
            onUpdate?.(event);
          }

          data = mergeUserFundings(data, event);
          onData(data);
        } catch (error) {
          onError(
            error instanceof Error
              ? error
              : new Error("Failed to process user fundings event"),
          );
        }
      });

      return {
        unsubscribe: () => subscription.unsubscribe(),
      };
    },
  });
}
