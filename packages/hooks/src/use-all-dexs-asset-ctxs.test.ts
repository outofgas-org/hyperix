import { afterEach, expect, mock, test } from "bun:test";
import { act, renderHook } from "@testing-library/react";
import type { AllDexsAssetCtxsEvent } from "@nktkas/hyperliquid/api/subscription";
import { wsClient } from "./config/hl.js";
import { useAllDexsAssetCtxs } from "./use-all-dexs-asset-ctxs.js";

const originalAllDexsAssetCtxs = wsClient.allDexsAssetCtxs;

afterEach(() => {
  wsClient.allDexsAssetCtxs = originalAllDexsAssetCtxs;
});

test("useAllDexsAssetCtxs receives data after unsubscribe and later resubscribe", async () => {
  const unsubscribe = mock(() => Promise.resolve());
  const listeners: Array<(event: AllDexsAssetCtxsEvent) => void> = [];

  wsClient.allDexsAssetCtxs = mock((listener) => {
    listeners.push(listener);

    return Promise.resolve({
      unsubscribe,
      failureSignal: new AbortController().signal,
    });
  });

  const first = renderHook(() => useAllDexsAssetCtxs());

  expect(first.result.current).toEqual({
    data: undefined,
    ready: false,
    loading: true,
    error: undefined,
  });

  await act(async () => {
    await Promise.resolve();
  });

  const firstEvent = {
    assetCtxs: [["1", { funding: "0.01" }]],
  } as unknown as AllDexsAssetCtxsEvent;

  await act(async () => {
    listeners[0]?.(firstEvent);
    await Promise.resolve();
  });

  expect(first.result.current).toEqual({
    data: firstEvent,
    ready: true,
    loading: false,
    error: undefined,
  });

  first.unmount();

  expect(unsubscribe).toHaveBeenCalledTimes(1);

  const second = renderHook(() => useAllDexsAssetCtxs());

  expect(second.result.current).toEqual({
    data: firstEvent,
    ready: true,
    loading: true,
    error: undefined,
  });

  await act(async () => {
    await Promise.resolve();
  });

  const secondEvent = {
    assetCtxs: [["2", { funding: "0.02" }]],
  } as unknown as AllDexsAssetCtxsEvent;

  await act(async () => {
    listeners[1]?.(secondEvent);
    await Promise.resolve();
  });

  expect(second.result.current).toEqual({
    data: secondEvent,
    ready: true,
    loading: false,
    error: undefined,
  });

  second.unmount();

  expect(wsClient.allDexsAssetCtxs).toHaveBeenCalledTimes(2);
  expect(unsubscribe).toHaveBeenCalledTimes(2);
});

test("useAllDexsAssetCtxs recovers when resubscribing before async unsubscribe settles", async () => {
  const listeners: Array<(event: AllDexsAssetCtxsEvent) => void> = [];
  let unsubscribeSettled = false;
  let resolveUnsubscribe: (() => void) | undefined;

  wsClient.allDexsAssetCtxs = mock((listener) => {
    listeners.push(listener);

    return Promise.resolve({
      unsubscribe: () =>
        new Promise<void>((resolve) => {
          resolveUnsubscribe = () => {
            unsubscribeSettled = true;
            resolve();
          };
        }),
      failureSignal: new AbortController().signal,
    });
  });

  const first = renderHook(() => useAllDexsAssetCtxs());

  await act(async () => {
    await Promise.resolve();
  });

  const firstEvent = {
    assetCtxs: [["1", { funding: "0.01" }]],
  } as unknown as AllDexsAssetCtxsEvent;

  await act(async () => {
    listeners[0]?.(firstEvent);
    await Promise.resolve();
  });

  expect(first.result.current.data).toBe(firstEvent);

  first.unmount();

  const second = renderHook(() => useAllDexsAssetCtxs());

  await act(async () => {
    await Promise.resolve();
  });

  expect(wsClient.allDexsAssetCtxs).toHaveBeenCalledTimes(1);
  expect(unsubscribeSettled).toBe(false);
  expect(second.result.current).toEqual({
    data: firstEvent,
    ready: true,
    loading: true,
    error: undefined,
  });

  await act(async () => {
    resolveUnsubscribe?.();
    await Promise.resolve();
    await Promise.resolve();
  });

  expect(wsClient.allDexsAssetCtxs).toHaveBeenCalledTimes(2);

  const secondEvent = {
    assetCtxs: [["2", { funding: "0.02" }]],
  } as unknown as AllDexsAssetCtxsEvent;

  await act(async () => {
    listeners[1]?.(secondEvent);
    await Promise.resolve();
  });

  expect(second.result.current).toEqual({
    data: secondEvent,
    ready: true,
    loading: false,
    error: undefined,
  });

  second.unmount();
});
