import type { TwapStatesEvent } from "@nktkas/hyperliquid/api/subscription";
import { type UseSubscribeState, useSubscribe } from "@outofgas/react-stream";
import { wsClient } from "./config/hl.js";

export type TwapStatesData = TwapStatesEvent;

export type UseTwapStatesOptions = {
  dex?: string;
  enabled?: boolean;
  onUpdate?: (event: TwapStatesEvent) => void;
};

const DEFAULT_DEX = "";

export function useTwapStates(
  user: `0x${string}`,
  options: UseTwapStatesOptions = {},
): UseSubscribeState<TwapStatesData> {
  const { dex = DEFAULT_DEX, enabled: enabledOverride, onUpdate } = options;
  const enabled = enabledOverride ?? Boolean(user);

  return useSubscribe<TwapStatesData>({
    key: ["twap-states", user, dex],
    enabled,
    subscribe: async ({ onData, onError }) => {
      const subscription = await wsClient.twapStates({ user, dex }, (event) => {
        try {
          onUpdate?.(event);
          onData(event);
        } catch (error) {
          onError(
            error instanceof Error
              ? error
              : new Error("Failed to process twap states event"),
          );
        }
      });

      return {
        unsubscribe: () => subscription.unsubscribe(),
      };
    },
  });
}
