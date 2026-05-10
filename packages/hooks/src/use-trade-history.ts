import {
  type InfiniteData,
  type UseInfiniteQueryOptions,
  type UseInfiniteQueryResult,
  useInfiniteQuery,
} from "@tanstack/react-query";
import Decimal from "decimal.js";
import { useMemo } from "react";
import { infoClient } from "./config/hl.js";
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

export type TradeHistoryPage = TradeHistoryData & {
  startTime: number;
  endTime: number;
};

export type InfiniteTradeHistoryData = {
  user: `0x${string}`;
  fills: TradeHistory[];
  pages: TradeHistoryPage[];
};

export type InfiniteTradeHistoryPageParam = {
  latest?: boolean;
  startTime: number;
  endTime: number;
};

export type UseInfiniteTradeHistoryOptions = Omit<
  UseInfiniteQueryOptions<
    TradeHistoryPage,
    Error,
    InfiniteTradeHistoryData,
    [
      "infinite-trade-history",
      `0x${string}`,
      boolean,
      number,
      number | undefined,
    ],
    InfiniteTradeHistoryPageParam
  >,
  "queryKey" | "queryFn" | "initialPageParam" | "getNextPageParam" | "select"
> & {
  aggregateByTime?: boolean;
  endTime?: number;
  pageDurationMs?: number;
  realtime?: boolean;
};

const DEFAULT_TRADE_HISTORY_PAGE_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

function getFillKey(fill: Pick<UserFill, "hash" | "tid" | "time">) {
  return `${fill.hash}-${fill.tid}-${fill.time}`;
}

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

function sortTradeHistory(fills: TradeHistory[]): TradeHistory[] {
  return [...fills].sort((a, b) => {
    if (a.time !== b.time) {
      return b.time - a.time;
    }

    return b.tid - a.tid;
  });
}

function mergeTradeHistoryFills(
  pages: TradeHistoryPage[],
  realtimeFills: TradeHistory[],
): TradeHistory[] {
  const fillsByKey = new Map<string, TradeHistory>();

  for (const page of pages) {
    for (const fill of page.fills) {
      fillsByKey.set(getFillKey(fill), fill);
    }
  }

  for (const fill of realtimeFills) {
    fillsByKey.set(getFillKey(fill), fill);
  }

  return sortTradeHistory([...fillsByKey.values()]);
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
        .sort((a, b) => b.time - a.time),
    };
  }, [symbolConverter, userFillsState.data]);

  return {
    ...userFillsState,
    data,
  };
}

export function useInfiniteTradeHistory(
  user: `0x${string}`,
  options: UseInfiniteTradeHistoryOptions = {},
): UseInfiniteQueryResult<InfiniteTradeHistoryData, Error> {
  const {
    aggregateByTime = true,
    enabled: enabledOverride,
    endTime,
    pageDurationMs = DEFAULT_TRADE_HISTORY_PAGE_DURATION_MS,
    realtime = true,
    ...queryOptions
  } = options;
  const enabled = enabledOverride ?? Boolean(user);
  const symbolConverter = useSymbolConverter();
  const realtimeState = useTradeHistory(user, {
    aggregateByTime,
    enabled: enabled && realtime,
  });

  return useInfiniteQuery({
    queryKey: [
      "infinite-trade-history",
      user,
      aggregateByTime,
      pageDurationMs,
      endTime,
    ],
    queryFn: async ({ pageParam }) => {
      const rawFills = pageParam.latest
        ? await infoClient.userFills({
            user,
            aggregateByTime,
          })
        : await infoClient.userFillsByTime({
            user,
            startTime: pageParam.startTime,
            endTime: pageParam.endTime,
            aggregateByTime,
          });
      const fills = sortTradeHistory(
        rawFills.map((fill) =>
          formatTradeHistoryFill(
            fill,
            symbolConverter?.getSpotByPairId(fill.coin),
          ),
        ),
      );
      const newestFillTime = fills[0]?.time;
      const oldestFillTime = fills.at(-1)?.time;

      return {
        user,
        startTime: oldestFillTime ?? pageParam.startTime,
        endTime: newestFillTime ?? pageParam.endTime,
        fills,
      };
    },
    initialPageParam: {
      latest: endTime === undefined,
      startTime: Math.max(0, (endTime ?? Date.now()) - pageDurationMs),
      endTime: endTime ?? Date.now(),
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.startTime <= 0) {
        return undefined;
      }

      const oldestFillTime = lastPage.fills.at(-1)?.time;
      const nextEndTime =
        oldestFillTime !== undefined
          ? oldestFillTime - 1
          : lastPage.startTime - 1;

      return {
        startTime: Math.max(0, nextEndTime - pageDurationMs),
        endTime: nextEndTime,
      };
    },
    select: (data: InfiniteData<TradeHistoryPage>) => {
      const realtimeFills = realtimeState.data?.fills ?? [];

      return {
        pages: data.pages,
        pageParams: data.pageParams,
        user,
        fills: mergeTradeHistoryFills(data.pages, realtimeFills),
      };
    },
    ...queryOptions,
    enabled,
  });
}
