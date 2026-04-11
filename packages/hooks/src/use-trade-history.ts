import Decimal from "decimal.js";
import { useMemo } from "react";
import { useSymbolConverter } from "./use-symbol-converter.js";
import {
  type UseUserFillsOptions,
  type UserFill,
  useUserFills,
} from "./use-user-fills.js";

export type TradeHistory = UserFill & {
  displayCoin: string;
  quoteCoin: string;
  baseCoin: string;
  feeInQuote: string;
  closedPnlInQuote: string;
  netPnlInQuote: string;
  pnlCurrency: string;
};

export type TradeHistoryData = {
  user: `0x${string}`;
  fills: TradeHistory[];
};

function formatTradeHistoryFill(
  fill: UserFill,
  spotPair: string | undefined,
): TradeHistory {
  const price = new Decimal(fill.px);

  if (!spotPair) {
    const netPnlInQuote = new Decimal(fill.closedPnl)
      .minus(fill.fee)
      .toString();

    return {
      ...fill,
      baseCoin: fill.coin,
      quoteCoin: fill.feeToken,
      displayCoin: fill.coin,
      feeInQuote: fill.fee,
      closedPnlInQuote: fill.closedPnl,
      netPnlInQuote,
      pnlCurrency: fill.feeToken,
    };
  }

  const [baseCoin = fill.coin, quoteCoin = fill.feeToken] = spotPair.split("/");
  const closedPnlInQuote = new Decimal(fill.closedPnl).mul(price);
  const feeInQuote =
    fill.feeToken === baseCoin
      ? new Decimal(fill.fee).mul(price)
      : new Decimal(fill.fee);
  const netPnlInQuote = closedPnlInQuote.minus(feeInQuote);

  return {
    ...fill,
    coin: baseCoin,
    baseCoin,
    quoteCoin,
    displayCoin: spotPair,
    feeInQuote: feeInQuote.toString(),
    closedPnlInQuote: closedPnlInQuote.toString(),
    netPnlInQuote: netPnlInQuote.toString(),
    pnlCurrency: quoteCoin,
  };
}

export function useTradeHistory(
  user: `0x${string}`,
  options: UseUserFillsOptions = {},
) {
  const userFillsState = useUserFills(user, options);
  const symbolConverter = useSymbolConverter();

  const data = useMemo<TradeHistoryData | undefined>(() => {
    if (!userFillsState.data) {
      return undefined;
    }

    return {
      ...userFillsState.data,
      fills: userFillsState.data.fills
        .map((fill) =>
          formatTradeHistoryFill(
            fill,
            symbolConverter?.getSpotByPairId(fill.coin),
          ),
        )
        .reverse(),
    };
  }, [symbolConverter, userFillsState.data]);

  return {
    ...userFillsState,
    data,
  };
}
