import type { UseSubscribeState } from "@outofgas/react-stream";
import { useMemo } from "react";
import {
  type Balance,
  type BalanceType,
  type BalancesData,
  type PerpsOverview,
  type StakingInfo,
  buildBalancesData,
} from "./lib/balances.js";
import { useAllDexsClearingHouseState } from "./use-all-dexs-clearing-house-state.js";
import { usePerpAllDex } from "./use-perp-all-dex.js";
import { usePositions } from "./use-positions.js";
import { useSpotMarkets } from "./use-spot-markets.js";
import { useSpotState } from "./use-spot-state.js";
import { useUserAbstraction } from "./use-user-abstraction.js";
import { useUserDelegatorSummary } from "./use-user-delegator-summary.js";
import { useUserVaultEquities } from "./use-user-vault-equities.js";

export type { Balance, BalancesData, BalanceType, PerpsOverview, StakingInfo };

export type UseBalancesOptions = {
  enabled?: boolean;
};

function firstError(
  ...errors: Array<Error | string | null | undefined>
): string | undefined {
  const error = errors.find(Boolean);
  if (!error) return undefined;
  return error instanceof Error ? error.message : error;
}

export function useBalances(
  user: `0x${string}`,
  options: UseBalancesOptions = {},
): UseSubscribeState<BalancesData> {
  const enabled = options.enabled ?? true;
  const spotMarketsState = useSpotMarkets({ enabled });
  const clearinghouseState = useAllDexsClearingHouseState(user, { enabled });
  const spotState = useSpotState(user, { enabled });
  const perpAllDexState = usePerpAllDex({ enabled });
  const vaultEquitiesState = useUserVaultEquities(user, { enabled });
  const delegatorSummaryState = useUserDelegatorSummary(user, { enabled });
  const userAbstractionState = useUserAbstraction(user, { enabled });
  const positionsState = usePositions(user, { enabled });

  const data = useMemo<BalancesData | undefined>(() => {
    if (
      !enabled ||
      !spotState.data ||
      !spotMarketsState.data ||
      !userAbstractionState.data
    ) {
      return undefined;
    }

    return buildBalancesData({
      spotBalances: spotState.data.balances,
      spotMarkets: spotMarketsState.data,
      clearinghouseState: clearinghouseState.data,
      perpDexInfos: perpAllDexState.data,
      isUnifiedAccount: userAbstractionState.data === "unifiedAccount",
      vaultEquities: vaultEquitiesState.data,
      delegatorSummary: delegatorSummaryState.data,
      positions: positionsState.data,
    });
  }, [
    clearinghouseState.data,
    delegatorSummaryState.data,
    enabled,
    perpAllDexState.data,
    positionsState.data,
    spotState.data,
    spotMarketsState.data,
    userAbstractionState.data,
    vaultEquitiesState.data,
  ]);

  return {
    data,
    ready: Boolean(data),
    loading:
      enabled &&
      (spotMarketsState.loading ||
        clearinghouseState.loading ||
        spotState.loading ||
        perpAllDexState.isLoading ||
        vaultEquitiesState.isLoading ||
        delegatorSummaryState.isLoading ||
        userAbstractionState.isLoading ||
        positionsState.loading),
    error: firstError(
      spotMarketsState.error,
      clearinghouseState.error,
      spotState.error,
      perpAllDexState.error,
      vaultEquitiesState.error,
      delegatorSummaryState.error,
      userAbstractionState.error,
      positionsState.error,
    ),
  };
}
