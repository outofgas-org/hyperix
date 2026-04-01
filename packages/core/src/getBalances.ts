import {
  getDexNamesFromAllPerpMetas,
  getPerpDexName,
  getTokenByIndex,
} from "./shared";
import { getDefaultInfoClient } from "./config/hl";
import {
  AllPerpMetas,
  ClearinghouseState,
  HyperliquidBalance, HyperliquidUserOptions,
  SpotAssetContexts,
  SpotClearinghouseState,
  SpotMeta,
} from "./types";

function buildSpotBalances(
  spotMeta: SpotMeta,
  spotAssetCtxs: SpotAssetContexts,
  spotState: SpotClearinghouseState,
): HyperliquidBalance[] {
  const tokenByIndex = getTokenByIndex(spotMeta);
  const spotMarketsByCoin = new Map<string, { markPrice: number; tokenId: string }>();

  for (const market of spotMeta.universe) {
    if (market.tokens.length < 2) {
      continue;
    }

    const baseToken = tokenByIndex.get(market.tokens[0]);
    const ctx = spotAssetCtxs.find((item) => item.coin === market.name);
    if (!baseToken || !ctx) {
      continue;
    }

    spotMarketsByCoin.set(baseToken.name, {
      markPrice: Number(ctx.markPx),
      tokenId: baseToken.tokenId,
    });
  }

  return spotState.balances.map((balance) => {
    const tokenInfo = spotMarketsByCoin.get(balance.coin);
    const total = Number(balance.total);
    const price = tokenInfo?.markPrice ?? 1;
    const value = total * price;
    const pnl = value - Number(balance.entryNtl ?? 0);

    return {
      asset: balance.coin,
      type: "spot",
      total,
      available: total,
      value,
      pnl,
      contract: tokenInfo?.tokenId ?? "",
    };
  });
}

function buildPerpBalances(
  allPerpMetas: AllPerpMetas,
  spotMeta: SpotMeta,
  perpStates: Array<{
    dex: string;
    state: ClearinghouseState;
  }>,
): HyperliquidBalance[] {
  const perpMetaByDex = new Map<string, AllPerpMetas[number]>();
  for (const dexMetadata of allPerpMetas) {
    perpMetaByDex.set(getPerpDexName(dexMetadata), dexMetadata);
  }

  const tokenByIndex = getTokenByIndex(spotMeta);

  return perpStates.flatMap(({ dex, state }) => {
    const total = Number(state.marginSummary.accountValue);
    if (total <= 0) {
      return [];
    }

    const collateralTokenIndex = perpMetaByDex.get(dex)?.collateralToken;
    const collateralToken = collateralTokenIndex === undefined ? undefined : tokenByIndex.get(collateralTokenIndex);

    return [
      {
        asset: collateralToken?.name ?? "USDC",
        type: "perp" as const,
        dex,
        total,
        available: Number(state.withdrawable),
        value: total,
        contract: "",
      },
    ];
  });
}

export async function getBalances(options: HyperliquidUserOptions): Promise<HyperliquidBalance[]> {
  const infoClient = getDefaultInfoClient();
  const [spotState, spotMetaAndAssetCtxs, allPerpMetas] = await Promise.all([
    infoClient.spotClearinghouseState({ user: options.user }),
    infoClient.spotMetaAndAssetCtxs(),
    infoClient.allPerpMetas(),
  ]);

  const [spotMeta, spotAssetCtxs] = spotMetaAndAssetCtxs;
  const dexNames = getDexNamesFromAllPerpMetas(allPerpMetas);
  const perpStates = await Promise.all(
    dexNames.map(async (dex) => ({
      dex,
      state: await infoClient.clearinghouseState({
        user: options.user,
        dex,
      }),
    })),
  );

  const spotBalances = buildSpotBalances(spotMeta, spotAssetCtxs, spotState);
  const perpBalances = buildPerpBalances(allPerpMetas, spotMeta, perpStates);

  return [...perpBalances, ...spotBalances];
}
