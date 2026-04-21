import type { ClearinghouseStateResponse } from "@nktkas/hyperliquid/api/info";
import Decimal from "decimal.js";
import { HYCORE_USDC_ADDRESS } from "../config/hl.js";
import type { AllDexsClearingHouseStateData } from "../use-all-dexs-clearing-house-state.js";
import type { PerpMarket } from "../use-perp-markets.js";
import type { Position } from "../use-positions.js";
import type { SpotMarket } from "../use-spot-markets.js";
import type { SpotBalance } from "../use-spot-state.js";
import type { UserDelegatorSummaryData } from "../use-user-delegator-summary.js";
import type { UserVaultEquitiesData } from "../use-user-vault-equities.js";

export type BalanceType = "spot" | "perp" | "all";

export type Balance = {
  coin: string;
  type: BalanceType;
  dex: string;
  total: number;
  available: number;
  value: number;
  entryNtl?: number;
  pnl?: number;
  contract: string;
};

export type StakingInfo = {
  delegatedAmount: number;
  hypePrice: number;
  stakingEquity: number;
};

export type PerpsOverview = {
  balance: number;
  unrealizedPNL: number;
  crossMarginRatio: number;
  maintenanceMargin: number;
  crossAccountLeverage: number;
};

export type BalancesData = {
  balances: Balance[];
  isUnifiedAccount: boolean;
  tradingEquity: number;
  spotEquity: number;
  perpEquity: number;
  vaultEquity: number;
  stakingInfo: StakingInfo;
  totalEquity: number;
  perpsOverview: PerpsOverview;
  crossMarginAvailable: number;
};

export type BuildBalancesDataInput = {
  spotBalances: SpotBalance[];
  spotMarkets: SpotMarket[];
  clearinghouseState?: AllDexsClearingHouseStateData;
  perpMarkets?: PerpMarket[];
  isUnifiedAccount: boolean;
  vaultEquities?: UserVaultEquitiesData;
  delegatorSummary?: UserDelegatorSummaryData;
  positions?: Position[];
};

type PerpDexInfo = {
  dexName: string;
  quoteCoin: string;
};

type PerpsOverviewInfo = {
  totalCrossMaintenanceMarginUsed: Decimal;
  totalCrossMarginSummaryValue: Decimal;
  totalCrossPositionValue: Decimal;
  totalCrossMarginAvailableValue: Decimal;
  unifiedAccountRatio: Decimal;
  unifiedTotalCollateralBalance: Decimal;
};

export function groupByQuoteCoinMap(
  data: { quoteCoin: string; dexName: string }[] | undefined,
) {
  const map = new Map<string, string[]>();
  if (!data) return map;

  for (const item of data) {
    const dexNames = map.get(item.quoteCoin) ?? [];
    dexNames.push(item.dexName);
    map.set(item.quoteCoin, dexNames);
  }

  return map;
}

export function coverClearinghouseStates(
  data: AllDexsClearingHouseStateData["clearinghouseStates"] | undefined,
) {
  const map = new Map<string, ClearinghouseStateResponse>();
  for (const state of data ?? []) {
    const dexName = normalizeDexName(state[0]);
    map.set(dexName, state[1]);
  }
  return map;
}

function normalizeDexName(dex: string): string {
  return dex === "" ? "core" : dex;
}

function sumBy<T>(items: T[], getValue: (item: T) => number): number {
  return items.reduce((acc, item) => acc + getValue(item), 0);
}

function buildPerpDexInfos(
  perpMarkets: PerpMarket[] | undefined,
): PerpDexInfo[] {
  const dexInfos = new Map<string, PerpDexInfo>();

  for (const market of perpMarkets ?? []) {
    const dexName = normalizeDexName(market.dex);
    if (dexInfos.has(dexName)) continue;

    dexInfos.set(dexName, {
      dexName,
      quoteCoin: market.collateralToken,
    });
  }

  return [...dexInfos.values()];
}

function buildSpotBalances(
  spotBalances: SpotBalance[],
  spotMarkets: SpotMarket[],
  isUnifiedAccount: boolean,
): Balance[] {
  return spotBalances.map((spot) => {
    const tokenInfo = spotMarkets.find(
      (market) => market.baseToken === spot.coin,
    );
    const total = new Decimal(spot.total);
    const hold = new Decimal(spot.hold ?? 0);
    const price = new Decimal(tokenInfo?.markPrice ?? 1);
    const value = total.mul(price);
    const entryNtl = new Decimal(spot.entryNtl ?? 0);
    const pnl = value.minus(entryNtl);

    return {
      coin: spot.coin,
      type: isUnifiedAccount ? "all" : "spot",
      dex: "",
      total: total.toNumber(),
      available: total.minus(hold).toNumber(),
      value: value.toNumber(),
      entryNtl: entryNtl.toNumber(),
      pnl: pnl.toNumber(),
      contract: tokenInfo?.tokenId ?? HYCORE_USDC_ADDRESS,
    };
  });
}

function buildPerpBalances(
  clearinghouseState: AllDexsClearingHouseStateData | undefined,
  perpMarkets: PerpMarket[] | undefined,
): Balance[] {
  const perpBalances: Balance[] = [];
  const clearinghouseStatesMap = coverClearinghouseStates(
    clearinghouseState?.clearinghouseStates,
  );

  for (const dexInfo of buildPerpDexInfos(perpMarkets)) {
    const dexState = clearinghouseStatesMap.get(dexInfo.dexName);
    if (!dexState) continue;

    const totalAccountValue = new Decimal(dexState.marginSummary.accountValue);
    if (totalAccountValue.lte(0)) continue;

    perpBalances.push({
      coin: dexInfo.quoteCoin,
      type: "perp",
      dex: dexInfo.dexName,
      total: totalAccountValue.toNumber(),
      available: new Decimal(dexState.withdrawable).toNumber(),
      value: totalAccountValue.toNumber(),
      contract: "",
    });
  }

  return perpBalances;
}

function buildPerpsOverviewInfo(
  clearinghouseState: AllDexsClearingHouseStateData | undefined,
  spotBalances: SpotBalance[],
  perpMarkets: PerpMarket[] | undefined,
  isUnifiedAccount: boolean,
): PerpsOverviewInfo | undefined {
  if (!clearinghouseState) {
    return undefined;
  }

  let totalCrossMaintenanceMarginUsed = new Decimal(0);
  let totalCrossMarginSummaryValue = new Decimal(0);
  let totalCrossPositionValue = new Decimal(0);
  let totalCrossMarginAvailableValue = new Decimal(0);
  let unifiedAccountRatio = new Decimal(0);
  let unifiedTotalCollateralBalance = new Decimal(0);
  const clearinghouseStatesMap = coverClearinghouseStates(
    clearinghouseState.clearinghouseStates,
  );
  const spotBalanceByCoin = new Map(
    spotBalances.map((spot) => [spot.coin, Number(spot.total)]),
  );
  const isolatedMarginByCoin = new Map<string, Decimal>();
  const collateralCoins = new Set<string>();
  const dexInfos = buildPerpDexInfos(perpMarkets);

  if (isUnifiedAccount) {
    for (const [dexName, state] of clearinghouseStatesMap) {
      const quoteCoin = dexInfos.find(
        (info) => info.dexName === dexName,
      )?.quoteCoin;
      if (!quoteCoin) continue;
      collateralCoins.add(quoteCoin);

      for (const assetPosition of state.assetPositions) {
        if (assetPosition.position.leverage.type !== "isolated") continue;

        const isolatedMargin =
          isolatedMarginByCoin.get(quoteCoin) ?? new Decimal(0);
        isolatedMarginByCoin.set(
          quoteCoin,
          isolatedMargin.plus(assetPosition.position.marginUsed),
        );
      }
    }
  }

  for (const [dexName, state] of clearinghouseStatesMap) {
    totalCrossMaintenanceMarginUsed = totalCrossMaintenanceMarginUsed.plus(
      state.crossMaintenanceMarginUsed,
    );
    totalCrossMarginSummaryValue = totalCrossMarginSummaryValue.plus(
      state.crossMarginSummary.accountValue,
    );
    totalCrossPositionValue = totalCrossPositionValue.plus(
      state.crossMarginSummary.totalNtlPos,
    );

    if (isUnifiedAccount) {
      const quoteCoin = dexInfos.find(
        (info) => info.dexName === dexName,
      )?.quoteCoin;
      if (quoteCoin) {
        const available = new Decimal(
          spotBalanceByCoin.get(quoteCoin) ?? 0,
        ).minus(isolatedMarginByCoin.get(quoteCoin) ?? 0);
        if (available.gt(0)) {
          const ratio = new Decimal(state.crossMaintenanceMarginUsed).div(
            available,
          );
          if (ratio.gt(unifiedAccountRatio)) {
            unifiedAccountRatio = ratio;
          }
        }
      }
    }

    if (dexName === "core") {
      totalCrossMarginAvailableValue = totalCrossMarginAvailableValue.plus(
        new Decimal(state.crossMarginSummary.accountValue).minus(
          state.crossMaintenanceMarginUsed,
        ),
      );
    }
  }

  if (isUnifiedAccount) {
    for (const quoteCoin of collateralCoins) {
      const totalCollateral = new Decimal(
        spotBalanceByCoin.get(quoteCoin) ?? 0,
      );
      if (totalCollateral.gt(0)) {
        unifiedTotalCollateralBalance =
          unifiedTotalCollateralBalance.plus(totalCollateral);
      }
    }
  }

  return {
    totalCrossMaintenanceMarginUsed,
    totalCrossMarginSummaryValue,
    totalCrossPositionValue,
    totalCrossMarginAvailableValue,
    unifiedAccountRatio,
    unifiedTotalCollateralBalance,
  };
}

export function buildBalancesData(input: BuildBalancesDataInput): BalancesData {
  const spotBalances = buildSpotBalances(
    input.spotBalances,
    input.spotMarkets,
    input.isUnifiedAccount,
  );
  const perpBalances = input.isUnifiedAccount
    ? []
    : buildPerpBalances(input.clearinghouseState, input.perpMarkets);
  const balances = [...perpBalances, ...spotBalances];

  const rawSpotEquity = sumBy(
    balances.filter((balance) => balance.type === "spot"),
    (balance) => balance.value,
  );
  const rawPerpEquity = sumBy(
    balances.filter((balance) => balance.type === "perp"),
    (balance) => balance.value,
  );
  const tradingEquity = input.isUnifiedAccount
    ? sumBy(
        balances.filter((balance) => balance.type === "all"),
        (balance) => balance.value,
      )
    : rawSpotEquity + rawPerpEquity;
  const spotEquity = input.isUnifiedAccount ? tradingEquity : rawSpotEquity;
  const perpEquity = input.isUnifiedAccount ? tradingEquity : rawPerpEquity;
  const vaultEquity = sumBy(input.vaultEquities ?? [], (vault) =>
    Number(vault.equity),
  );
  const delegatedAmount = Number(input.delegatorSummary?.delegated ?? 0);
  const hypePrice =
    input.spotMarkets.find((market) => market.baseToken === "HYPE")
      ?.markPrice ?? 0;
  const stakingEquity = new Decimal(hypePrice).mul(delegatedAmount).toNumber();
  const totalEquity = tradingEquity + vaultEquity + stakingEquity;
  const totalUnrealizedPNL = sumBy(input.positions ?? [], (position) =>
    Number(position.position.unrealizedPnl),
  );
  const perpsOverviewInfo = buildPerpsOverviewInfo(
    input.clearinghouseState,
    input.spotBalances,
    input.perpMarkets,
    input.isUnifiedAccount,
  );

  const perpsOverview: PerpsOverview = {
    balance: new Decimal(perpEquity).minus(totalUnrealizedPNL).toNumber(),
    unrealizedPNL: totalUnrealizedPNL,
    crossMarginRatio: input.isUnifiedAccount
      ? (perpsOverviewInfo?.unifiedAccountRatio.toNumber() ?? 0)
      : perpEquity
        ? (perpsOverviewInfo?.totalCrossMaintenanceMarginUsed
            .div(perpEquity)
            .toNumber() ?? 0)
        : 0,
    maintenanceMargin:
      perpsOverviewInfo?.totalCrossMaintenanceMarginUsed.toNumber() ?? 0,
    crossAccountLeverage: input.isUnifiedAccount
      ? perpsOverviewInfo?.unifiedTotalCollateralBalance.gt(0)
        ? (perpsOverviewInfo?.totalCrossPositionValue
            .div(perpsOverviewInfo.unifiedTotalCollateralBalance)
            .toNumber() ?? 0)
        : 0
      : perpEquity
        ? (perpsOverviewInfo?.totalCrossPositionValue
            .div(perpEquity)
            .toNumber() ?? 0)
        : 0,
  };

  return {
    balances,
    isUnifiedAccount: input.isUnifiedAccount,
    tradingEquity,
    spotEquity,
    perpEquity,
    vaultEquity,
    stakingInfo: { delegatedAmount, hypePrice, stakingEquity },
    totalEquity,
    perpsOverview,
    crossMarginAvailable:
      perpsOverviewInfo?.totalCrossMarginAvailableValue.toNumber() ?? 0,
  };
}
