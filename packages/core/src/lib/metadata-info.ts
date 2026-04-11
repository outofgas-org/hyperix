import { getTransport, infoClient } from "../config/hl";
import type { AllPerpMetas, SpotMeta } from "../types";
import { SymbolConverter } from "./symbol-converter";

const METADATA_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export type HyperliquidMetadataCacheOptions = {
  ttlMs?: number;
};

type MetadataCacheEntry<T> = {
  data: T;
  expiresAt: number;
};

export type HyperliquidMetadataCache = {
  getSpotMeta(): Promise<SpotMeta>;
  getAllPerpMetas(): Promise<AllPerpMetas>;
  getSymbolConverter(): Promise<SymbolConverter>;
  clear(): void;
};

export class DefaultHyperliquidMetadataCache
  implements HyperliquidMetadataCache
{
  private readonly ttlMs: number;
  private spotMetaEntry?: MetadataCacheEntry<SpotMeta>;
  private allPerpMetasEntry?: MetadataCacheEntry<AllPerpMetas>;
  private symbolConverterEntry?: MetadataCacheEntry<SymbolConverter>;
  private symbolConverterPromise?: Promise<SymbolConverter>;

  constructor(options: HyperliquidMetadataCacheOptions = {}) {
    this.ttlMs = options.ttlMs ?? METADATA_CACHE_TTL_MS;
  }

  async getSpotMeta(): Promise<SpotMeta> {
    const now = Date.now();
    if (this.spotMetaEntry && this.spotMetaEntry.expiresAt > now) {
      return this.spotMetaEntry.data;
    }

    const [spotMeta] = await infoClient.spotMetaAndAssetCtxs();
    this.spotMetaEntry = {
      data: spotMeta,
      expiresAt: now + this.ttlMs,
    };

    return spotMeta;
  }

  async getAllPerpMetas(): Promise<AllPerpMetas> {
    const now = Date.now();
    if (this.allPerpMetasEntry && this.allPerpMetasEntry.expiresAt > now) {
      return this.allPerpMetasEntry.data;
    }

    const allPerpMetas = await infoClient.allPerpMetas();
    this.allPerpMetasEntry = {
      data: allPerpMetas,
      expiresAt: now + this.ttlMs,
    };

    return allPerpMetas;
  }

  async getSymbolConverter(): Promise<SymbolConverter> {
    const now = Date.now();
    if (
      this.symbolConverterEntry &&
      this.symbolConverterEntry.expiresAt > now
    ) {
      return this.symbolConverterEntry.data;
    }

    if (!this.symbolConverterPromise) {
      this.symbolConverterPromise = SymbolConverter.create({
        transport: getTransport(),
        dexs: true,
      }).catch((error) => {
        this.symbolConverterPromise = undefined;
        throw error;
      });
    }

    const symbolConverter = await this.symbolConverterPromise;
    this.symbolConverterEntry = {
      data: symbolConverter,
      expiresAt: now + this.ttlMs,
    };
    this.symbolConverterPromise = undefined;

    return symbolConverter;
  }

  clear(): void {
    this.spotMetaEntry = undefined;
    this.allPerpMetasEntry = undefined;
    this.symbolConverterEntry = undefined;
    this.symbolConverterPromise = undefined;
  }
}
