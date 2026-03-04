import { expect, test } from "bun:test";
import { act, renderHook } from "@testing-library/react";
import { useDebouncedValue } from "./use-debounced-value";

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

test("useDebouncedValue updates after the delay", async () => {
  const { result, rerender } = renderHook(
    ({ value }: { value: string }) => useDebouncedValue(value, 20),
    { initialProps: { value: "a" } },
  );

  expect(result.current).toBe("a");

  rerender({ value: "abc" });
  expect(result.current).toBe("a");

  await act(async () => {
    await sleep(30);
  });

  expect(result.current).toBe("abc");
});
