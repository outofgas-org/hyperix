import { infoClient } from "./config/hl";
import { getCoinDexName } from "./shared";
import {
  type GetHyperliquidFundingOptions,
  HyperliquidCoreError,
  type HyperliquidFunding,
} from "./types";

export async function getFunding(
  options: GetHyperliquidFundingOptions,
): Promise<HyperliquidFunding> {
  const normalizedCoin = options.coin.trim();
  const dex = getCoinDexName(normalizedCoin);
  const [[meta, assetCtxs], predictedFundings] = await Promise.all([
    infoClient.metaAndAssetCtxs({ dex }),
    infoClient.predictedFundings(),
  ]);
  const assetIndex = meta.universe.findIndex(
    (item) => item.name === normalizedCoin,
  );
  const predictedEntry =
    predictedFundings.find(([asset]) => asset === normalizedCoin) ?? null;

  if (assetIndex === -1 || !assetCtxs[assetIndex]) {
    throw new HyperliquidCoreError(
      `Unable to resolve funding for ${options.coin}`,
    );
  }

  const currentAssetCtx = assetCtxs[assetIndex];
  const nextFunding =
    predictedEntry?.[1].find(([exchange]) => exchange === "HlPerp")?.[1] ??
    null;

  return {
    coin: normalizedCoin,
    fundingRate: Number(currentAssetCtx.funding),
    nextFundingRate: nextFunding ? Number(nextFunding.fundingRate) : null,
    nextFundingTimestamp: nextFunding?.nextFundingTime ?? null,
    markPrice: Number(currentAssetCtx.markPx),
    indexPrice: Number(currentAssetCtx.oraclePx),
  };
}
