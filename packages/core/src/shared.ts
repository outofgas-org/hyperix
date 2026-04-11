import {
  DefaultHyperliquidMetadataCache,
  type HyperliquidMetadataCache,
} from "./lib/metadata-info";
import type {
  AllPerpMetas,
  HyperliquidMarketType,
  PerpMeta,
  SpotMeta,
  TokenInfo,
} from "./types";

export function getCoinDexName(coin: string): string {
  return coin.includes(":") ? (coin.split(":")[0] ?? "") : "";
}

export function getPerpDexName(dexMetadata: PerpMeta): string {
  const firstName = dexMetadata.universe[0]?.name ?? "";
  return getCoinDexName(firstName);
}

export function getDexNamesFromAllPerpMetas(
  allPerpMetas: AllPerpMetas,
): string[] {
  return allPerpMetas.map((dexMetadata) => getPerpDexName(dexMetadata));
}

export function getTokenByIndex(spotMeta: SpotMeta): Map<number, TokenInfo> {
  return new Map(spotMeta.tokens.map((token) => [token.index, token]));
}

export async function normalizeMarketCoin(
  coin: string,
  metadataCache: HyperliquidMetadataCache,
): Promise<{ coin: string; marketType: HyperliquidMarketType }> {
  const symbolConverter = await metadataCache.getSymbolConverter();
  const spotCoin = symbolConverter.getSpotByPairId(coin);

  if (spotCoin) {
    return {
      coin: spotCoin,
      marketType: "spot",
    };
  }

  return {
    coin,
    marketType: "perp",
  };
}

export function toOrderSide(side: string): "BUY" | "SELL" {
  return side === "B" ? "BUY" : "SELL";
}

export function requireByUppercase<T extends { coin: string }>(
  items: T[],
  coin?: string,
): T[] {
  if (!coin) {
    return items;
  }

  const normalizedCoin = coin.toUpperCase();
  return items.filter((item) => item.coin.toUpperCase() === normalizedCoin);
}
