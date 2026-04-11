import type { AllDexsClearinghouseStateEvent } from "@nktkas/hyperliquid/api/subscription";
import { type UseSubscribeState, useSubscribe } from "@outofgas/react-stream";
import { wsClient } from "./config/hl.js";

export type AllDexsClearingHouseStateData = AllDexsClearinghouseStateEvent;

export type UseAllDexsClearingHouseStateOptions = {
  enabled?: boolean;
  onUpdate?: (event: AllDexsClearinghouseStateEvent) => void;
};

export function useAllDexsClearingHouseState(
  user: `0x${string}`,
  options: UseAllDexsClearingHouseStateOptions = {},
): UseSubscribeState<AllDexsClearingHouseStateData> {
  const { enabled: enabledOverride, onUpdate } = options;
  const enabled = enabledOverride ?? Boolean(user);

  return useSubscribe<AllDexsClearinghouseStateEvent>({
    key: ["all-dexs-clearing-house-state", user],
    enabled,
    subscribe: async ({ onData, onError }) => {
      const subscription = await wsClient.allDexsClearinghouseState(
        { user },
        (event) => {
          try {
            onUpdate?.(event);
            onData(event);
          } catch (error) {
            onError(
              error instanceof Error
                ? error
                : new Error(
                    "Failed to process all dexs clearing house state event",
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
