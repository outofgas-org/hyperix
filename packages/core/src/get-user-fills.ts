import { getFills } from "./get-fills";
import type { GetHyperliquidUserFillsOptions, HyperliquidFill } from "./types";

export async function getUserFills(
  options: GetHyperliquidUserFillsOptions,
): Promise<HyperliquidFill[]> {
  return getFills({
    ...options,
    twapFills: false,
  }) as Promise<HyperliquidFill[]>;
}
