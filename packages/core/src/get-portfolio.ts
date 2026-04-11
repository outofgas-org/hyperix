import type { PortfolioResponse } from "@nktkas/hyperliquid/api/info";
import { infoClient } from "./config/hl";
import type { HyperliquidUserOptions } from "./types";

export type HyperliquidPortfolio = PortfolioResponse;

export async function getPortfolio(
  options: HyperliquidUserOptions,
): Promise<HyperliquidPortfolio> {
  return infoClient.portfolio({ user: options.user });
}
