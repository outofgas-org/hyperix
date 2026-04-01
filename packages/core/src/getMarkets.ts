import {
  getPerpDexName,
  getTokenByIndex,
  requireByUppercase,
} from "./shared";
import { getMetadataCache } from "./config/hl";
import type { GetHyperliquidMarketsOptions, HyperliquidPerpMarket, HyperliquidSpotMarket } from "./types";

export async function getMarkets(
  options: GetHyperliquidMarketsOptions,
): Promise<Array<HyperliquidSpotMarket | HyperliquidPerpMarket>> {
  const spotMeta = await getMetadataCache().getSpotMeta();
  const tokenByIndex = getTokenByIndex(spotMeta);

  if (options.marketType === "spot") {
    const markets = spotMeta.universe
      .filter((market) => market.tokens.length >= 2)
      .map((market) => {
        const base = tokenByIndex.get(market.tokens[0])?.name ?? String(market.tokens[0]);
        const quote = tokenByIndex.get(market.tokens[1])?.name ?? String(market.tokens[1]);

        return {
          coin: `${base}/${quote}`,
          pairId: market.name,
          base,
          quote,
          szDecimals: tokenByIndex.get(market.tokens[0])?.szDecimals ?? 0,
          weiDecimals: tokenByIndex.get(market.tokens[0])?.szDecimals ?? 0,
          marketType: "spot" as const,
        };
      });

    if (!options.coin) {
      return markets;
    }

    return requireByUppercase(markets, options.coin);
  }

  const allPerpMetas = await getMetadataCache().getAllPerpMetas();
  const markets = allPerpMetas.flatMap((dexMetadata) => {
    const dexName = getPerpDexName(dexMetadata);

    return dexMetadata.universe
      .filter((market) => !market.isDelisted)
      .map((market) => ({
        coin: market.name,
        base: market.name,
        quote: tokenByIndex.get(dexMetadata.collateralToken)?.name ?? "USDC",
        dexName,
        maxLeverage: market.maxLeverage,
        szDecimals: market.szDecimals,
        onlyIsolated: market.onlyIsolated ?? false,
        marginMode: market.marginMode ?? null,
        marketType: "perp" as const,
      }));
  });

  if (!options.coin) {
    return markets;
  }

  return requireByUppercase(markets, options.coin);
}
