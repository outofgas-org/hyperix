import type { SpotAssetCtxsEvent } from "@nktkas/hyperliquid/api/subscription";
import { type UseSubscribeState, useSubscribe } from "@outofgas/react-stream";
import { wsClient } from "./config/hl.js";

export type SpotAssetCtxsData = SpotAssetCtxsEvent;

export type UseSpotAssetCtxsOptions = {
  enabled?: boolean;
  onUpdate?: (event: SpotAssetCtxsEvent) => void;
};

export function useSpotAssetCtxs(
  options: UseSpotAssetCtxsOptions = {},
): UseSubscribeState<SpotAssetCtxsData> {
  const { enabled = true, onUpdate } = options;

  return useSubscribe<SpotAssetCtxsData>({
    key: ["spot-asset-ctxs"],
    enabled,
    subscribe: async ({ onData, onError }) => {
      const subscription = await wsClient.spotAssetCtxs((event) => {
        try {
          onUpdate?.(event);
          onData(event);
        } catch (error) {
          onError(
            error instanceof Error
              ? error
              : new Error("Failed to process spot asset ctxs event"),
          );
        }
      });

      return {
        unsubscribe: () => subscription.unsubscribe(),
      };
    },
  });
}
