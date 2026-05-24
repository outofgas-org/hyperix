import { infoClient } from "./config/hl";
import type {
  GetHyperliquidFundingHistoryOptions,
  HyperliquidFundingHistoryRecord,
} from "./types";

export async function getFundingHistory(
  options: GetHyperliquidFundingHistoryOptions,
): Promise<HyperliquidFundingHistoryRecord[]> {
  const coin = options.coin.trim();
  const history = await infoClient.fundingHistory({
    coin,
    startTime: options.startTime,
    endTime: options.endTime,
  });

  return history.map((record) => ({
    coin: record.coin,
    fundingRate: Number(record.fundingRate),
    premium: Number(record.premium),
    time: record.time,
  }));
}
