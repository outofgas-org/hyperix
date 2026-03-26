import { HttpTransport, InfoClient } from "@nktkas/hyperliquid";

export type HyperliquidBalance = {
  coin: string;
  type: "spot" | "perp";
  total: number;
  available: number;
  value: number;
  contract: string;
  pnl?: number;
  dex?: string;
};

export type HyperliquidBalancesClient = Pick<
  InfoClient,
  "allPerpMetas" | "clearinghouseState" | "spotClearinghouseState" | "spotMetaAndAssetCtxs"
>;

export type GetBalancesOptions = {
  user: string;
  infoClient?: HyperliquidBalancesClient;
};

type SpotMeta = Awaited<ReturnType<InfoClient["spotMetaAndAssetCtxs"]>>[0];
type SpotAssetContexts = Awaited<ReturnType<InfoClient["spotMetaAndAssetCtxs"]>>[1];
type AllPerpMetas = Awaited<ReturnType<InfoClient["allPerpMetas"]>>;

function createInfoClient(): InfoClient {
  return new InfoClient({
    transport: new HttpTransport(),
  });
}

function getCoinDexName(coin: string): string {
  return coin.includes(":") ? (coin.split(":")[0] ?? "") : "";
}

function getDexNames(allPerpMetas: AllPerpMetas): string[] {
  return allPerpMetas.map((dexMetadata) => {
    const firstName = dexMetadata.universe[0]?.name ?? "";
    return getCoinDexName(firstName);
  });
}

function buildSpotBalances(
  spotMeta: SpotMeta,
  spotAssetCtxs: SpotAssetContexts,
  spotState: Awaited<ReturnType<InfoClient["spotClearinghouseState"]>>,
): HyperliquidBalance[] {
  const tokenByIndex = new Map(spotMeta.tokens.map((token) => [token.index, token]));
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
      coin: balance.coin,
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
    state: Awaited<ReturnType<InfoClient["clearinghouseState"]>>;
  }>,
): HyperliquidBalance[] {
  const perpMetaByDex = new Map<string, AllPerpMetas[number]>();
  for (const dexMetadata of allPerpMetas) {
    const firstName = dexMetadata.universe[0]?.name ?? "";
    perpMetaByDex.set(getCoinDexName(firstName), dexMetadata);
  }

  const tokenByIndex = new Map(spotMeta.tokens.map((token) => [token.index, token]));

  return perpStates.flatMap(({ dex, state }) => {
    const total = Number(state.marginSummary.accountValue);
    if (total <= 0) {
      return [];
    }

    const collateralTokenIndex = perpMetaByDex.get(dex)?.collateralToken;
    const collateralToken = collateralTokenIndex === undefined ? undefined : tokenByIndex.get(collateralTokenIndex);

    return [
      {
        coin: collateralToken?.name ?? "USDC",
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

export async function getBalances(options: GetBalancesOptions): Promise<HyperliquidBalance[]> {
  const infoClient = options.infoClient ?? createInfoClient();
  const [spotState, spotMetaAndAssetCtxs, allPerpMetas] = await Promise.all([
    infoClient.spotClearinghouseState({ user: options.user }),
    infoClient.spotMetaAndAssetCtxs(),
    infoClient.allPerpMetas(),
  ]);

  const [spotMeta, spotAssetCtxs] = spotMetaAndAssetCtxs;
  const dexNames = getDexNames(allPerpMetas);
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
