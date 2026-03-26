import { expect, test } from "bun:test";
import {
  createMonorepoBanner,
  formatBytes,
  formatDuration,
  formatNumber,
  getBalances,
  getEnv,
  isDev,
  isProd,
  retry,
} from "./index";

test("format helpers return readable values", () => {
  expect(formatNumber(1234567)).toBe("1,234,567");
  expect(formatBytes(1024)).toBe("1 KB");
  expect(formatDuration(65000)).toBe("1m 5s");
  expect(
    createMonorepoBanner({ projectName: "BunStack", packageCount: 3 }),
  ).toBe("BunStack · 3 packages");
});

test("environment helpers read from process.env", () => {
  const previous = process.env.NODE_ENV;

  process.env.NODE_ENV = "development";
  expect(isDev()).toBe(true);
  expect(isProd()).toBe(false);

  process.env.NODE_ENV = "production";
  expect(isDev()).toBe(false);
  expect(isProd()).toBe(true);

  if (previous === undefined) {
    process.env.NODE_ENV = undefined;
  } else {
    process.env.NODE_ENV = previous;
  }
});

test("getEnv returns fallback and throws when missing", () => {
  process.env.BUNSTACK_SAMPLE = undefined;

  expect(getEnv("BUNSTACK_SAMPLE", "fallback")).toBe("fallback");
  expect(() => getEnv("BUNSTACK_SAMPLE")).toThrow(
    "Environment variable BUNSTACK_SAMPLE is not defined",
  );
});

test("retry retries until the function succeeds", async () => {
  let attempts = 0;

  const value = await retry(
    async () => {
      attempts += 1;
      if (attempts < 3) {
        throw new Error("fail");
      }
      return "ok";
    },
    { delayMs: 0 },
  );

  expect(value).toBe("ok");
  expect(attempts).toBe(3);
});

test("getBalances normalizes perp and spot balances", async () => {
  const balances = await getBalances({
    user: "0x123",
    infoClient: {
      allPerpMetas: async () => [
        {
          universe: [{ name: "testdex:BTC" }],
          collateralToken: 1,
        },
        {
          universe: [{ name: "ETH" }],
          collateralToken: 1,
        },
      ],
      clearinghouseState: async ({ dex }: { dex: string }) => ({
        marginSummary: {
          accountValue: dex === "testdex" ? "250" : "0",
        },
        withdrawable: dex === "testdex" ? "200" : "0",
      }),
      spotClearinghouseState: async () => ({
        balances: [
          {
            coin: "HYPE",
            total: "2",
            entryNtl: "6",
          },
          {
            coin: "USDC",
            total: "5",
            entryNtl: "5",
          },
        ],
      }),
      spotMetaAndAssetCtxs: async () => [
        {
          universe: [
            { name: "@107", tokens: [2, 1] },
            { name: "@999", tokens: [1] },
          ],
          tokens: [
            { index: 1, name: "USDC", tokenId: "0xusdc" },
            { index: 2, name: "HYPE", tokenId: "0xhype" },
          ],
        },
        [{ coin: "@107", markPx: "4" }],
      ],
    } as any,
  });

  expect(balances).toEqual([
    {
      coin: "USDC",
      type: "perp",
      dex: "testdex",
      total: 250,
      available: 200,
      value: 250,
      contract: "",
    },
    {
      coin: "HYPE",
      type: "spot",
      total: 2,
      available: 2,
      value: 8,
      pnl: 2,
      contract: "0xhype",
    },
    {
      coin: "USDC",
      type: "spot",
      total: 5,
      available: 5,
      value: 5,
      pnl: 0,
      contract: "",
    },
  ]);
});
