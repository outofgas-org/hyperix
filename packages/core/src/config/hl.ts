import { HttpTransport, InfoClient } from "@nktkas/hyperliquid";
import type { IRequestTransport } from "@nktkas/hyperliquid";
import {
  DefaultHyperliquidMetadataCache,
  type HyperliquidMetadataCache,
  type HyperliquidMetadataCacheOptions,
} from "../lib/metadata-info";

let transport: IRequestTransport = new HttpTransport();
export let infoClient = new InfoClient({ transport });
let metadataCache: HyperliquidMetadataCache =
  new DefaultHyperliquidMetadataCache();

export function replaceMetadataCache(
  options: HyperliquidMetadataCacheOptions = {},
): HyperliquidMetadataCache {
  metadataCache = new DefaultHyperliquidMetadataCache(options);
  return metadataCache;
}

export function getMetadataCache(): HyperliquidMetadataCache {
  return metadataCache;
}

export function getTransport(): IRequestTransport {
  return transport;
}

export function replaceTransport(
  nextTransport: IRequestTransport = new HttpTransport(),
): InfoClient {
  transport = nextTransport;
  infoClient = new InfoClient({ transport });
  return infoClient;
}
