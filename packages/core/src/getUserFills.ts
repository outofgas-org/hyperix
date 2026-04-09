import { getFills } from "./getFills";
import type { GetHyperliquidUserFillsOptions, HyperliquidFill } from "./types";

export async function getUserFills(
  options: GetHyperliquidUserFillsOptions,
): Promise<HyperliquidFill[]> {
  return getFills({
    ...options,
    twapFills: false,
  }) as Promise<HyperliquidFill[]>;
}
