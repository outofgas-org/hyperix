import { infoClient } from "./config/hl";
import type {
  GetHyperliquidActiveAssetDataOptions,
  HyperliquidActiveAsset,
} from "./types";

export async function getActiveAssetData(
  options: GetHyperliquidActiveAssetDataOptions,
): Promise<HyperliquidActiveAsset> {
  const current = await infoClient.activeAssetData({
    user: options.user,
    coin: options.coin,
  });

  return {
    coin: current.coin,
    leverage: current.leverage.value,
    isCross: current.leverage.type === "cross",
    leverageType: current.leverage.type,
    maxTradeSzs: current.maxTradeSzs, // [0] is perp Buy and [1] is perp Sell to maxTradeSzs
    availableToTrade: current.availableToTrade, // [0] is perp Buy and [1] is perp Sell to availableToTrade
    markPx: current.markPx,
  };
}
