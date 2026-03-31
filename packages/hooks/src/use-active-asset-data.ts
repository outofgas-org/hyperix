import { useSubscribe, type UseSubscribeState } from "@outofgas/react-stream";
import type { ActiveAssetDataEvent } from "@nktkas/hyperliquid/api/subscription";
import { wsClient } from "./config/hl.js";

export type ActiveAssetData = ActiveAssetDataEvent;

export type UseActiveAssetDataOptions = {
  enabled?: boolean;
  onUpdate?: (event: ActiveAssetDataEvent) => void;
};

export function useActiveAssetData(
  coin: string,
  user: `0x${string}`,
  options: UseActiveAssetDataOptions = {},
): UseSubscribeState<ActiveAssetData> {
  const { enabled: enabledOverride, onUpdate } = options;
  const enabled = enabledOverride ?? Boolean(coin && user);

  return useSubscribe<ActiveAssetData>({
    key: ["active-asset-data", coin, user],
    enabled,
    subscribe: async ({ onData, onError }) => {
      const subscription = await wsClient.activeAssetData({ coin, user }, (event) => {
        try {
          onUpdate?.(event);
          onData(event);
        } catch (error) {
          onError(
            error instanceof Error
              ? error
              : new Error("Failed to process active asset data event"),
          );
        }
      });

      return {
        unsubscribe: () => subscription.unsubscribe(),
      };
    },
  });
}
