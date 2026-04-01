import { getDefaultInfoClient, getMetadataCache } from "./config/hl";
import { normalizeMarketCoin, requireByUppercase, toOrderSide } from "./shared";
import type { GetHyperliquidOpenOrdersOptions, HyperliquidOpenOrder } from "./types";

export async function getOpenOrders(options: GetHyperliquidOpenOrdersOptions): Promise<HyperliquidOpenOrder[]> {
  const infoClient = getDefaultInfoClient();
  const orders = await infoClient.openOrders({ user: options.user });

  const normalizedOrders = await Promise.all(
    orders.map(async (order) => {
      const normalized = await normalizeMarketCoin(order.coin, getMetadataCache());

      return {
        ...order,
        coin: normalized.coin,
        side: toOrderSide(order.side),
        marketType: normalized.marketType,
      };
    }),
  );

  return requireByUppercase(normalizedOrders, options.coin);
}
