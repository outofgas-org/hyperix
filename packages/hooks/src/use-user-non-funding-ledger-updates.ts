import type { UserNonFundingLedgerUpdatesEvent } from "@nktkas/hyperliquid/api/subscription";
import { type UseSubscribeState, useSubscribe } from "@outofgas/react-stream";
import { wsClient } from "./config/hl.js";

export type UserNonFundingLedgerUpdate =
  UserNonFundingLedgerUpdatesEvent["nonFundingLedgerUpdates"][number];

export type UserNonFundingLedgerUpdatesData = {
  user: `0x${string}`;
  nonFundingLedgerUpdates: UserNonFundingLedgerUpdate[];
};

export type UseUserNonFundingLedgerUpdatesOptions = {
  enabled?: boolean;
  onUpdate?: (event: UserNonFundingLedgerUpdatesEvent) => void;
};

function mergeUserNonFundingLedgerUpdates(
  previousData: UserNonFundingLedgerUpdatesData | undefined,
  incomingEvent: UserNonFundingLedgerUpdatesEvent,
): UserNonFundingLedgerUpdatesData {
  const nonFundingLedgerUpdates = incomingEvent.isSnapshot
    ? incomingEvent.nonFundingLedgerUpdates
    : [
        ...(previousData?.nonFundingLedgerUpdates ?? []),
        ...incomingEvent.nonFundingLedgerUpdates,
      ];

  return {
    user: incomingEvent.user,
    nonFundingLedgerUpdates: [...nonFundingLedgerUpdates].sort(
      (a, b) => b.time - a.time,
    ),
  };
}

export function useUserNonFundingLedgerUpdates(
  user: `0x${string}`,
  options: UseUserNonFundingLedgerUpdatesOptions = {},
): UseSubscribeState<UserNonFundingLedgerUpdatesData> {
  const { enabled: enabledOverride, onUpdate } = options;
  const enabled = enabledOverride ?? Boolean(user);

  return useSubscribe<UserNonFundingLedgerUpdatesData>({
    key: ["user-non-funding-ledger-updates", user],
    enabled,
    subscribe: async ({ onData, onError }) => {
      let data: UserNonFundingLedgerUpdatesData | undefined;

      const subscription = await wsClient.userNonFundingLedgerUpdates(
        { user },
        (event) => {
          try {
            if (!event.isSnapshot) {
              onUpdate?.(event);
            }

            data = mergeUserNonFundingLedgerUpdates(data, event);
            onData(data);
          } catch (error) {
            onError(
              error instanceof Error
                ? error
                : new Error(
                    "Failed to process user non-funding ledger updates event",
                  ),
            );
          }
        },
      );

      return {
        unsubscribe: () => subscription.unsubscribe(),
      };
    },
  });
}
