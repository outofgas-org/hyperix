import type { AllDexsAssetCtxsEvent } from "@nktkas/hyperliquid/api/subscription";
import { type UseSubscribeState, useSubscribe } from "@outofgas/react-stream";
import { wsClient } from "./config/hl.js";

export type AllDexsAssetCtxsData = AllDexsAssetCtxsEvent;

export type UseAllDexsAssetCtxsOptions = {
  enabled?: boolean;
  onUpdate?: (event: AllDexsAssetCtxsEvent) => void;
};

export function useAllDexsAssetCtxs(
  options: UseAllDexsAssetCtxsOptions = {},
): UseSubscribeState<AllDexsAssetCtxsData> {
  const { enabled = true, onUpdate } = options;

  return useSubscribe<AllDexsAssetCtxsEvent>({
    key: ["all-dexs-asset-ctxs"],
    enabled,
    subscribe: async ({ onData, onError }) => {
      const subscription = await wsClient.allDexsAssetCtxs((event) => {
        try {
          onUpdate?.(event);
          onData(event);
        } catch (error) {
          onError(
            error instanceof Error
              ? error
              : new Error("Failed to process all dexs asset ctxs event"),
          );
        }
      });

      return {
        unsubscribe: () => subscription.unsubscribe(),
      };
    },
  });
}
