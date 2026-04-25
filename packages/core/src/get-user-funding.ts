import { infoClient } from "./config/hl";
import type {
  GetHyperliquidUserFundingOptions,
  UserFunding,
} from "./types";

export async function getUserFunding(
  options: GetHyperliquidUserFundingOptions,
): Promise<UserFunding[]> {
  return infoClient.userFunding({
    user: options.user,
    startTime: options.startTime,
    endTime: options.endTime,
  });
}
