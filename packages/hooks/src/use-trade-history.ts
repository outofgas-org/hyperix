import {
  type InfiniteData,
  type UseInfiniteQueryOptions,
  type UseInfiniteQueryResult,
  useInfiniteQuery,
  useQueryClient,
} from "@tanstack/react-query";
import Decimal from "decimal.js";
import { useMemo } from "react";
import { infoClient } from "./config/hl.js";
import { useSymbolConverter } from "./use-symbol-converter.js";
import {
  type UserFillsData,
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

type RawTradeHistoryPage = UserFillsData & {
  startTime: number;
  endTime: number;
};

type InfiniteTradeHistoryQueryKey = [
  "infinite-trade-history",
  `0x${string}`,
  boolean,
  number,
  number | undefined,
];

export type UseInfiniteTradeHistoryOptions = Omit<
  UseInfiniteQueryOptions<
    RawTradeHistoryPage,
    Error,
    InfiniteTradeHistoryData,
    InfiniteTradeHistoryQueryKey,
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

function sortFills<T extends Pick<UserFill, "tid" | "time">>(
  fills: T[],
): T[] {
  return [...fills].sort((a, b) => {
    if (a.time !== b.time) {
      return b.time - a.time;
    }

    return b.tid - a.tid;
  });
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
  return sortFills(fills);
}

function mergeFills<T extends Pick<UserFill, "hash" | "tid" | "time">>(
  pages: { fills: T[] }[],
  realtimeFills: T[],
): T[] {
  const fillsByKey = new Map<string, T>();

  for (const page of pages) {
    for (const fill of page.fills) {
      fillsByKey.set(getFillKey(fill), fill);
    }
  }

  for (const fill of realtimeFills) {
    fillsByKey.set(getFillKey(fill), fill);
  }

  return sortFills([...fillsByKey.values()]);
}

function formatTradeHistoryPage(
  page: RawTradeHistoryPage,
  symbolConverter: ReturnType<typeof useSymbolConverter>,
): TradeHistoryPage {
  return {
    ...page,
    fills: sortTradeHistory(
      page.fills.map((fill) =>
        formatTradeHistoryFill(
          fill,
          symbolConverter?.getSpotByPairId(fill.coin),
        ),
      ),
    ),
  };
}

function flattenTradeHistoryPages(pages: TradeHistoryPage[]): TradeHistory[] {
  const fills: TradeHistory[] = [];

  for (const page of pages) {
    fills.push(...page.fills);
  }

  return fills;
}

function getLatestPageFromFills(
  user: `0x${string}`,
  fills: UserFill[],
  fallbackEndTime: number,
  pageDurationMs: number,
): RawTradeHistoryPage {
  const endTime = fills[0]?.time ?? fallbackEndTime;
  const startTime = Math.max(0, endTime - pageDurationMs);

  return {
    user,
    startTime,
    endTime,
    fills: fills.filter(
      (fill) => fill.time >= startTime && fill.time <= endTime,
    ),
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
    realtime = false,
    ...queryOptions
  } = options;
  const enabled = enabledOverride ?? Boolean(user);
  const symbolConverter = useSymbolConverter();
  const queryClient = useQueryClient();
  const queryKey: InfiniteTradeHistoryQueryKey = [
    "infinite-trade-history",
    user,
    aggregateByTime,
    pageDurationMs,
    endTime,
  ];
  const selectTradeHistoryData = useMemo(
    () => (data: InfiniteData<RawTradeHistoryPage>) => {
      const pages = data.pages.map((page) =>
        formatTradeHistoryPage(page, symbolConverter),
      );

      return {
        pages,
        user,
        fills: flattenTradeHistoryPages(pages),
      };
    },
    [symbolConverter, user],
  );

  useUserFills(user, {
    aggregateByTime,
    enabled: enabled && realtime,
    onUpdate: (event) => {
      const realtimeFills = sortFills(event.fills);

      if (realtimeFills.length === 0) {
        return;
      }

      queryClient.setQueryData<
        InfiniteData<RawTradeHistoryPage, InfiniteTradeHistoryPageParam>
      >(queryKey, (previousData) => {
        const [latestPage, ...olderPages] = previousData?.pages ?? [];

        if (!previousData || !latestPage) {
          return previousData;
        }

        const fills = mergeFills([latestPage], realtimeFills);

        return {
          ...previousData,
          pages: [
            {
              ...latestPage,
              endTime: Math.max(latestPage.endTime, fills[0]?.time ?? 0),
              fills,
            },
            ...olderPages,
          ],
        };
      });
    },
  });

  return useInfiniteQuery({
    queryKey,
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
      const fills = sortFills(rawFills);

      if (pageParam.latest) {
        return getLatestPageFromFills(
          user,
          fills,
          pageParam.endTime,
          pageDurationMs,
        );
      }

      return {
        user,
        startTime: pageParam.startTime,
        endTime: pageParam.endTime,
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
    select: selectTradeHistoryData,
    ...queryOptions,
    enabled,
  });
}
