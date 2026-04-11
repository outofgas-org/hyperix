import { getMetadataCache } from "./config/hl";
import { getPerpDexName, getTokenByIndex } from "./shared";
import type { HyperliquidDexQuote } from "./types";

export async function getDexNames(): Promise<string[]> {
  const allPerpMetas = await getMetadataCache().getAllPerpMetas();

  return allPerpMetas.map((dexMetadata) => getPerpDexName(dexMetadata));
}

export async function getDexQuotes(): Promise<HyperliquidDexQuote[]> {
  const [allPerpMetas, spotMeta] = await Promise.all([
    getMetadataCache().getAllPerpMetas(),
    getMetadataCache().getSpotMeta(),
  ]);
  const tokenByIndex = getTokenByIndex(spotMeta);

  return allPerpMetas.map((dexMetadata) => ({
    dex: getPerpDexName(dexMetadata),
    quote: tokenByIndex.get(dexMetadata.collateralToken)?.name ?? "USDC",
  }));
}
