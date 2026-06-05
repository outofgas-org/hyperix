import { afterEach, expect, mock, test } from "bun:test";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { type ReactNode, createElement, useSyncExternalStore } from "react";
import { infoClient, wsClient } from "./config/hl.js";
import type { UserFill } from "./use-user-fills.js";

type MockSymbolConverter = {
  getSpotByPairId: (id: string) => string | undefined;
};

let symbolConverter: MockSymbolConverter | null = null;
const symbolConverterListeners = new Set<() => void>();

function setSymbolConverter(converter: MockSymbolConverter | null) {
  symbolConverter = converter;
  for (const listener of symbolConverterListeners) {
    listener();
  }
}

mock.module("./use-symbol-converter.js", () => ({
  useSymbolConverter: () =>
    useSyncExternalStore(
      (listener) => {
        symbolConverterListeners.add(listener);
        return () => {
          symbolConverterListeners.delete(listener);
        };
      },
      () => symbolConverter,
      () => symbolConverter,
    ),
}));

const { useInfiniteTradeHistory } = await import("./use-trade-history.js");

const originalUserFills = infoClient.userFills;
const originalUserFillsByTime = infoClient.userFillsByTime;
const originalWsUserFills = wsClient.userFills;

const USER = "0x0000000000000000000000000000000000000001";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(
      QueryClientProvider,
      { client: queryClient },
      children,
    );
  };
}

function createFill(time: number, tid: number): UserFill {
  return {
    coin: "ETH",
    closedPnl: "0",
    fee: "1",
    feeToken: "USDC",
    hash: `0x${time.toString(16).padStart(64, "0")}`,
    px: "1000",
    side: "B",
    sz: "1",
    tid,
    time,
  } as UserFill;
}

afterEach(() => {
  infoClient.userFills = originalUserFills;
  infoClient.userFillsByTime = originalUserFillsByTime;
  wsClient.userFills = originalWsUserFills;
  symbolConverter = null;
  symbolConverterListeners.clear();
});

test("useInfiniteTradeHistory clips latest fills to the newest page window", async () => {
  infoClient.userFills = mock(() =>
    Promise.resolve([
      createFill(1000, 3),
      createFill(800, 2),
      createFill(100, 1),
    ]),
  ) as typeof infoClient.userFills;
  infoClient.userFillsByTime = mock(() =>
    Promise.resolve([]),
  ) as typeof infoClient.userFillsByTime;
  wsClient.userFills = mock(() =>
    Promise.resolve({
      unsubscribe: mock(() => Promise.resolve()),
      failureSignal: new AbortController().signal,
    }),
  ) as typeof wsClient.userFills;

  const { result } = renderHook(
    () => useInfiniteTradeHistory(USER, { pageDurationMs: 300 }),
    { wrapper: createWrapper() },
  );

  await waitFor(() => {
    expect(result.current.isSuccess).toBe(true);
  });

  expect(infoClient.userFills).toHaveBeenCalledTimes(1);
  expect(infoClient.userFillsByTime).not.toHaveBeenCalled();
  expect(wsClient.userFills).not.toHaveBeenCalled();
  expect(result.current.data?.pages[0]).toMatchObject({
    startTime: 700,
    endTime: 1000,
  });
  expect(result.current.data?.fills.map((fill) => fill.time)).toEqual([
    1000, 800,
  ]);
});

test("useInfiniteTradeHistory updates spot displayCoin when symbol converter loads", async () => {
  infoClient.userFills = mock(() =>
    Promise.resolve([
      {
        ...createFill(1000, 1),
        coin: "@1",
      },
    ]),
  ) as typeof infoClient.userFills;
  infoClient.userFillsByTime = mock(() =>
    Promise.resolve([]),
  ) as typeof infoClient.userFillsByTime;
  wsClient.userFills = mock(() =>
    Promise.resolve({
      unsubscribe: mock(() => Promise.resolve()),
      failureSignal: new AbortController().signal,
    }),
  ) as typeof wsClient.userFills;

  const { result } = renderHook(() => useInfiniteTradeHistory(USER), {
    wrapper: createWrapper(),
  });

  await waitFor(() => {
    expect(result.current.isSuccess).toBe(true);
  });

  expect(result.current.data?.fills[0].displayCoin).toBe("@1");

  act(() => {
    setSymbolConverter({
      getSpotByPairId: (id) => (id === "@1" ? "PURR/USDC" : undefined),
    });
  });

  await waitFor(() => {
    expect(result.current.data?.fills[0]).toMatchObject({
      baseCoin: "PURR",
      displayCoin: "PURR/USDC",
      quoteCoin: "USDC",
    });
  });
  expect(infoClient.userFills).toHaveBeenCalledTimes(1);
});
