import { getDefaultInfoClient, getMetadataCache } from "./config/hl";
import { getCoinDexName } from "./shared";
import type {
  GetHyperliquidTickerOptions,
  HyperliquidTicker,
  PerpAssetContext,
  SpotAssetContext,
} from "./types";
import { HyperliquidCoreError } from "./types";

export async function getTickerContext(
  options: GetHyperliquidTickerOptions,
): Promise<{
  normalizedCoin: string;
  context: PerpAssetContext | SpotAssetContext;
}> {
  const infoClient = getDefaultInfoClient();

  if (options.marketType === "perp") {
    const dex = getCoinDexName(options.coin);
    const [meta, assetCtxs] = await infoClient.metaAndAssetCtxs({ dex });
    const index = meta.universe.findIndex((item) => item.name === options.coin);

    if (index === -1 || !assetCtxs[index]) {
      throw new HyperliquidCoreError(
        `Unable to resolve perpetual market price for ${options.coin}`,
      );
    }

    return {
      normalizedCoin: options.coin,
      context: assetCtxs[index],
    };
  }

  const symbolConverter = await getMetadataCache().getSymbolConverter();
  const pairId = symbolConverter.getSpotPairId(options.coin);

  if (!pairId) {
    throw new HyperliquidCoreError(
      `Unable to resolve spot market metadata for ${options.coin}`,
    );
  }

  const [, spotAssetCtxs] = await infoClient.spotMetaAndAssetCtxs();
  const context = spotAssetCtxs.find((item) => item.coin === pairId);

  if (!context) {
    throw new HyperliquidCoreError(
      `Unable to resolve spot market price for ${options.coin}`,
    );
  }

  return {
    normalizedCoin: pairId,
    context,
  };
}

function requireBook<T extends NonNullable<unknown>>(
  orderbook: T | null,
  coin: string,
): T {
  if (!orderbook) {
    throw new HyperliquidCoreError(`Unable to resolve order book for ${coin}`);
  }

  return orderbook;
}

export async function getTicker(
  options: GetHyperliquidTickerOptions,
): Promise<HyperliquidTicker> {
  const infoClient = getDefaultInfoClient();
  const { normalizedCoin, context } = await getTickerContext(options);
  const book = requireBook(
    await infoClient.l2Book({ coin: normalizedCoin }),
    options.coin,
  );

  const last = Number(context.markPx ?? context.midPx ?? context.prevDayPx);
  const open = Number(context.prevDayPx);
  const close = last;
  const bid = Number(book.levels[0][0]?.px ?? context.midPx ?? context.markPx);
  const ask = Number(book.levels[1][0]?.px ?? context.midPx ?? context.markPx);
  const change = close - open;
  const percentage = open === 0 ? 0 : (change / open) * 100;

  return {
    coin: options.coin,
    marketType: options.marketType,
    last,
    bid,
    ask,
    open,
    close,
    change,
    percentage,
    volume: Number(context.dayBaseVlm),
    quoteVolume: Number(context.dayNtlVlm),
    timestamp: book.time,
  };
}
