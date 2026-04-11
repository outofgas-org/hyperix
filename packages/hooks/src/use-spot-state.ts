import type { SpotStateEvent } from "@nktkas/hyperliquid/api/subscription";
import { type UseSubscribeState, useSubscribe } from "@outofgas/react-stream";
import { wsClient } from "./config/hl.js";

export type SpotBalance = SpotStateEvent["spotState"]["balances"][number];
export type SpotEscrow = NonNullable<
  SpotStateEvent["spotState"]["evmEscrows"]
>[number];

export type SpotStateData = SpotStateEvent["spotState"] & {
  user: `0x${string}`;
};

export type UseSpotStateOptions = {
  enabled?: boolean;
  ignorePortfolioMargin?: boolean;
  onUpdate?: (event: SpotStateEvent) => void;
};

export function useSpotState(
  user: `0x${string}`,
  options: UseSpotStateOptions = {},
): UseSubscribeState<SpotStateData> {
  const { enabled: enabledOverride, ignorePortfolioMargin, onUpdate } = options;
  const enabled = enabledOverride ?? Boolean(user);

  return useSubscribe<SpotStateData>({
    key: ["spot-state", user, ignorePortfolioMargin ? "ignore-pm" : "default"],
    enabled,
    subscribe: async ({ onData, onError }) => {
      const subscription = await wsClient.spotState(
        { user, ignorePortfolioMargin },
        (event) => {
          try {
            onUpdate?.(event);
            onData({
              user: event.user,
              ...event.spotState,
            });
          } catch (error) {
            onError(
              error instanceof Error
                ? error
                : new Error("Failed to process spot state event"),
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
