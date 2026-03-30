import { useSubscribe, type UseSubscribeState } from "@outofgas/react-stream";
import type { AllMidsEvent } from "@nktkas/hyperliquid/api/subscription";
import { wsClient } from "./config/hl.js";

export type AllMidsData = AllMidsEvent;

export type UseAllMidsOptions = {
  enabled?: boolean;
  onUpdate?: (event: AllMidsEvent) => void;
};

export function useAllMids(
  options: UseAllMidsOptions = {},
): UseSubscribeState<AllMidsData> {
  const { enabled = true, onUpdate } = options;

  return useSubscribe<AllMidsEvent>({
    key: ["all-mids"],
    enabled,
    subscribe: async ({ onData, onError }) => {
      const subscription = await wsClient.allMids((event) => {
        try {
          onUpdate?.(event);
          onData(event);
        } catch (error) {
          onError(
            error instanceof Error
              ? error
              : new Error("Failed to process all mids event"),
          );
        }
      });

      return {
        unsubscribe: () => subscription.unsubscribe(),
      };
    },
  });
}
