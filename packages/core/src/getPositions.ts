import { getDefaultInfoClient } from "./config/hl";
import { getDexNames } from "./getDexNames";
import type { HyperliquidPosition, HyperliquidUserOptions } from "./types";

export async function getPositions(
  options: HyperliquidUserOptions,
): Promise<HyperliquidPosition[]> {
  const infoClient = getDefaultInfoClient();
  const dexNames = await getDexNames();
  const states = await Promise.all(
    dexNames.map(async (dexName) => ({
      dexName,
      state: await infoClient.clearinghouseState({
        user: options.user,
        dex: dexName,
      }),
    })),
  );

  return states.flatMap(({ dexName, state }) =>
    state.assetPositions.map((assetPosition) => ({
      dexName,
      marketType: "perp" as const,
      coin: assetPosition.position.coin,
      szi: assetPosition.position.szi,
      leverage: assetPosition.position.leverage.value,
      isCross: assetPosition.position.leverage.type === "cross",
      leverageType: assetPosition.position.leverage.type,
      entryPx: assetPosition.position.entryPx,
      positionValue: assetPosition.position.positionValue,
      unrealizedPnl: assetPosition.position.unrealizedPnl,
      returnOnEquity: assetPosition.position.returnOnEquity,
      liquidationPx: assetPosition.position.liquidationPx,
      marginUsed: assetPosition.position.marginUsed,
      maxLeverage: assetPosition.position.maxLeverage,
      cumFunding: assetPosition.position.cumFunding,
    })),
  );
}
