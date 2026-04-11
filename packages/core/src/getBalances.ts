import Decimal from "decimal.js";
import { getDefaultInfoClient } from "./config/hl";
import {
  getDexNamesFromAllPerpMetas,
  getPerpDexName,
  getTokenByIndex,
} from "./shared";
import type {
  AllPerpMetas,
  ClearinghouseState,
  HyperliquidBalance,
  HyperliquidUserOptions,
  SpotAssetContexts,
  SpotClearinghouseState,
  SpotMeta,
} from "./types";

function buildSpotBalances(
  spotMeta: SpotMeta,
  spotAssetCtxs: SpotAssetContexts,
  spotState: SpotClearinghouseState,
  balanceType: HyperliquidBalance["type"] = "spot",
): HyperliquidBalance[] {
  const tokenByIndex = getTokenByIndex(spotMeta);
  const spotMarketsByCoin = new Map<
    string,
    { markPrice: number; tokenId: string }
  >();

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

  return spotState.balances.flatMap((balance) => {
    const tokenInfo = spotMarketsByCoin.get(balance.coin);
    const total = new Decimal(balance.total);
    if (total.lte(0)) {
      return [];
    }

    const hold = new Decimal(balance.hold);
    const available = total.minus(hold);
    const price = new Decimal(tokenInfo?.markPrice ?? 1);
    const value = total.mul(price);
    const entryNtl = new Decimal(balance.entryNtl ?? 0);
    const pnl = value.minus(entryNtl);

    return [
      {
        asset: balance.coin,
        type: balanceType,
        total: total.toString(),
        available: available.toString(),
        value: value.toString(),
        entryNtl: entryNtl.toString(),
        pnl: pnl.toString(),
        contract: tokenInfo?.tokenId ?? "0x6d1e7cde53ba9467b783cb7c530ce054",
      },
    ];
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
    const total = new Decimal(state.marginSummary.accountValue);
    if (total.lte(0)) {
      return [];
    }

    const collateralTokenIndex = perpMetaByDex.get(dex)?.collateralToken;
    const collateralToken =
      collateralTokenIndex === undefined
        ? undefined
        : tokenByIndex.get(collateralTokenIndex);

    return [
      {
        asset: collateralToken?.name ?? "USDC",
        type: "perp" as const,
        dex,
        total: total.toString(),
        available: new Decimal(state.withdrawable).toString(),
        value: total.toString(),
        contract: "",
      },
    ];
  });
}

export async function getBalances(
  options: HyperliquidUserOptions,
): Promise<HyperliquidBalance[]> {
  const infoClient = getDefaultInfoClient();
  const [abstraction, spotState, spotMetaAndAssetCtxs, allPerpMetas] =
    await Promise.all([
      infoClient.userAbstraction({ user: options.user }),
      infoClient.spotClearinghouseState({ user: options.user }),
      infoClient.spotMetaAndAssetCtxs(),
      infoClient.allPerpMetas(),
    ]);

  const [spotMeta, spotAssetCtxs] = spotMetaAndAssetCtxs;
  const spotBalances = buildSpotBalances(
    spotMeta,
    spotAssetCtxs,
    spotState,
    abstraction === "unifiedAccount" ? "all" : "spot",
  );
  if (abstraction === "unifiedAccount") {
    return spotBalances;
  }

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

  const perpBalances = buildPerpBalances(allPerpMetas, spotMeta, perpStates);

  return [...perpBalances, ...spotBalances];
}
