import { getMetadataCache, infoClient } from "./config/hl";
import { normalizeMarketCoin, toOrderSide } from "./shared";
import type {
  GetHyperliquidFillsOptions,
  HyperliquidFill,
  HyperliquidTwapFill,
} from "./types";

export async function getFills(
  options: GetHyperliquidFillsOptions,
): Promise<Array<HyperliquidFill | HyperliquidTwapFill>> {
  const aggregateByTime = options.aggregateByTime ?? true;
  const twapFills = options.twapFills ?? false;

  const normalizedFills = twapFills
    ? await Promise.all(
        (options.since
          ? await infoClient.userTwapSliceFillsByTime({
              user: options.user,
              startTime: options.since,
              aggregateByTime,
            })
          : await infoClient.userTwapSliceFills({
              user: options.user,
            })
        ).map(async ({ fill, twapId }) => {
          const normalized = await normalizeMarketCoin(
            fill.coin,
            getMetadataCache(),
          );

          return {
            ...fill,
            coin: normalized.coin,
            side: toOrderSide(fill.side),
            marketType: normalized.marketType,
            twapId,
            isTwapSliceFill: true as const,
          };
        }),
      )
    : await Promise.all(
        (options.since
          ? await infoClient.userFillsByTime({
              user: options.user,
              startTime: options.since,
              aggregateByTime,
            })
          : await infoClient.userFills({
              user: options.user,
              aggregateByTime,
            })
        ).map(async (fill) => {
          const normalized = await normalizeMarketCoin(
            fill.coin,
            getMetadataCache(),
          );

          return {
            ...fill,
            coin: normalized.coin,
            side: toOrderSide(fill.side),
            marketType: normalized.marketType,
            isTwapSliceFill: false as const,
          };
        }),
      );

  const filteredFills = options.coin
    ? normalizedFills.filter(
        (fill) => fill.coin.toUpperCase() === options.coin?.toUpperCase(),
      )
    : normalizedFills;
  return options.limit ? filteredFills.slice(0, options.limit) : filteredFills;
}
