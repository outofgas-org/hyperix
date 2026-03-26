import { getDefaultInfoClient } from "./config/hl";
import type { GetHyperliquidOrderbookOptions, L2Book } from "./types";

export async function getOrderbook(options: GetHyperliquidOrderbookOptions): Promise<L2Book | null> {
  const infoClient = getDefaultInfoClient();
  const orderbook = await infoClient.l2Book({
    coin: options.coin,
    nSigFigs: options.nSigFigs,
    mantissa: options.mantissa,
  });

  if (!orderbook || !options.limit) {
    return orderbook;
  }

  return {
    ...orderbook,
    levels: [orderbook.levels[0].slice(0, options.limit), orderbook.levels[1].slice(0, options.limit)],
  };
}
