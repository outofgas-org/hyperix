import { getMetadataCache, infoClient } from "./config/hl";
import { normalizeMarketCoin } from "./shared";
import type {
  GetHyperliquidHistoricalOrdersOptions,
  HyperliquidHistoricalOrder,
} from "./types";

export async function getHistoricalOrders(
  options: GetHyperliquidHistoricalOrdersOptions,
): Promise<HyperliquidHistoricalOrder[]> {
  const orders = await infoClient.historicalOrders({
    user: options.user,
  });

  return Promise.all(
    orders.map(async (historicalOrder) => {
      const normalized = await normalizeMarketCoin(
        historicalOrder.order.coin,
        getMetadataCache(),
      );

      return {
        ...historicalOrder,
        order: {
          ...historicalOrder.order,
          displayCoin: normalized.coin,
          marketType: normalized.marketType,
        },
      };
    }),
  );
}
