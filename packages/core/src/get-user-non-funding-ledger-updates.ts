import { infoClient } from "./config/hl";
import type {
  GetHyperliquidUserNonFundingLedgerUpdatesOptions,
  UserNonFundingLedgerUpdate,
} from "./types";

export async function getUserNonFundingLedgerUpdates(
  options: GetHyperliquidUserNonFundingLedgerUpdatesOptions,
): Promise<UserNonFundingLedgerUpdate[]> {
  return infoClient.userNonFundingLedgerUpdates({
    user: options.user,
    startTime: options.startTime,
    endTime: options.endTime,
  });
}
