import { useMemo } from "react";
import type { PerpMarket } from "./use-perp-markets.js";
import {
  type UsePerpMarketsOptions,
  usePerpMarkets,
} from "./use-perp-markets.js";

export function usePerpMarket(
  coin: string,
  options: UsePerpMarketsOptions = {},
) {
  const marketsState = usePerpMarkets(options);

  const data = useMemo<PerpMarket | undefined>(() => {
    return marketsState.data.find(
      (market) => market.symbol === coin || market.coin === coin,
    );
  }, [coin, marketsState.data]);

  return {
    ...marketsState,
    data,
  };
}
