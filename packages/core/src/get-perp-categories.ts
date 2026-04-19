import { infoClient } from "./config/hl";
import type { PerpCategories } from "./types";

export async function getPerpCategories(): Promise<PerpCategories> {
  return infoClient.perpCategories();
}
