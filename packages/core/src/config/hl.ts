import { HttpTransport, InfoClient } from "@nktkas/hyperliquid";
import type { IRequestTransport } from "@nktkas/hyperliquid";
import {
  DefaultHyperliquidMetadataCache,
  type HyperliquidMetadataCache,
  type HyperliquidMetadataCacheOptions,
} from "../lib/metadataInfo";

let transport: IRequestTransport = new HttpTransport();
let infoClient = new InfoClient({ transport });
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

export function getDefaultInfoClient(): InfoClient {
  return infoClient;
}

export function replaceTransport(
  nextTransport: IRequestTransport = new HttpTransport(),
): InfoClient {
  transport = nextTransport;
  infoClient = new InfoClient({ transport });
  return infoClient;
}
