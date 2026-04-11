import type { InfoClient } from "@nktkas/hyperliquid";

export type HyperliquidMarketType = "spot" | "perp";

export type SpotMeta = Awaited<
  ReturnType<InfoClient["spotMetaAndAssetCtxs"]>
>[0];
export type SpotAssetContexts = Awaited<
  ReturnType<InfoClient["spotMetaAndAssetCtxs"]>
>[1];
export type AllPerpMetas = Awaited<ReturnType<InfoClient["allPerpMetas"]>>;
export type PerpMeta = AllPerpMetas[number];
export type ClearinghouseState = Awaited<
  ReturnType<InfoClient["clearinghouseState"]>
>;
export type SpotClearinghouseState = Awaited<
  ReturnType<InfoClient["spotClearinghouseState"]>
>;
export type MetaAndAssetCtxs = Awaited<
  ReturnType<InfoClient["metaAndAssetCtxs"]>
>;
export type PerpAssetContext = MetaAndAssetCtxs[1][number];
export type SpotAssetContext = SpotAssetContexts[number];
export type L2Book = Awaited<ReturnType<InfoClient["l2Book"]>>;
export type L2BookParameters = Parameters<InfoClient["l2Book"]>[0];
export type OpenOrder = Awaited<ReturnType<InfoClient["openOrders"]>>[number];
export type UserFill = Awaited<ReturnType<InfoClient["userFills"]>>[number];
export type UserTwapFill = Awaited<
  ReturnType<InfoClient["userTwapSliceFills"]>
>[number];
export type ActiveAssetData = Awaited<
  ReturnType<InfoClient["activeAssetData"]>
>;
export type TokenInfo = SpotMeta["tokens"][number];

export class HyperliquidCoreError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "HyperliquidCoreError";
  }
}

export type GetHyperliquidMarketsOptions = {
  marketType: HyperliquidMarketType;
  coin?: string;
};

export type HyperliquidUserOptions = {
  user: string;
};

export type GetHyperliquidOpenOrdersOptions = HyperliquidUserOptions & {
  coin?: string;
};

export type GetHyperliquidFillsOptions = HyperliquidUserOptions & {
  aggregateByTime?: boolean;
  coin?: string;
  limit?: number;
  since?: number;
  twapFills?: boolean;
};

export type GetHyperliquidUserFillsOptions = Omit<
  GetHyperliquidFillsOptions,
  "twapFills"
>;

export type GetHyperliquidTickerOptions = {
  coin: string;
  marketType: HyperliquidMarketType;
};

export type GetHyperliquidFundingOptions = {
  coin: string;
};

export type GetHyperliquidOrderbookOptions = {
  coin: string;
  limit?: number;
  mantissa?: L2BookParameters["mantissa"];
  nSigFigs?: L2BookParameters["nSigFigs"];
};

export type GetHyperliquidActiveAssetDataOptions = HyperliquidUserOptions & {
  coin: string;
};

export type HyperliquidBalance = {
  asset: string;
  type: "spot" | "perp" | "all";
  total: string;
  available: string;
  value: string;
  contract: string;
  entryNtl?: string;
  pnl?: string;
  dex?: string;
};

export type HyperliquidSpotMarket = {
  coin: string;
  pairId: string;
  base: string;
  quote: string;
  szDecimals: number;
  weiDecimals: number;
  marketType: "spot";
};

export type HyperliquidPerpMarket = {
  coin: string;
  base: string;
  quote: string;
  dexName: string;
  maxLeverage: number;
  szDecimals: number;
  onlyIsolated: boolean;
  marginMode: string | null;
  marketType: "perp";
};

export type HyperliquidPosition = {
  dexName: string;
  marketType: "perp";
  coin: string;
  szi: string;
  leverage: number;
  isCross: boolean;
  leverageType: string;
  entryPx: string;
  positionValue: string;
  unrealizedPnl: string;
  returnOnEquity: string;
  liquidationPx: string | null;
  marginUsed: string;
  maxLeverage: number;
  cumFunding: {
    allTime: string;
    sinceChange: string;
    sinceOpen: string;
  };
};

export type HyperliquidOpenOrder = Omit<OpenOrder, "coin" | "side"> & {
  coin: string;
  side: "BUY" | "SELL";
  marketType: HyperliquidMarketType;
};

export type HyperliquidFill = Omit<UserFill, "coin" | "side"> & {
  coin: string;
  side: "BUY" | "SELL";
  marketType: HyperliquidMarketType;
  isTwapSliceFill: false;
};

export type HyperliquidTwapFill = Omit<
  UserTwapFill["fill"],
  "coin" | "side"
> & {
  coin: string;
  side: "BUY" | "SELL";
  marketType: HyperliquidMarketType;
  isTwapSliceFill: true;
  twapId: UserTwapFill["twapId"];
};

export type HyperliquidTicker = {
  coin: string;
  marketType: HyperliquidMarketType;
  last: number;
  bid: number;
  ask: number;
  open: number;
  close: number;
  change: number;
  percentage: number;
  volume: number;
  quoteVolume: number;
  timestamp: number;
};

export type HyperliquidFunding = {
  coin: string;
  fundingRate: number;
  nextFundingRate: number | null;
  nextFundingTimestamp: number | null;
  markPrice: number;
  indexPrice: number;
};

export type HyperliquidDexQuote = {
  dex: string;
  quote: string;
};

export type HyperliquidActiveAsset = {
  coin: string;
  leverage: number;
  isCross: boolean;
  leverageType: string;
  maxTradeSzs: ActiveAssetData["maxTradeSzs"];
  availableToTrade: ActiveAssetData["availableToTrade"];
  markPx: string;
};

export type BuilderHyperliquidInternalTransferOptions = {
  dex: string;
  fromPerp: boolean;
  destination: string;
  amount: string;
};

export type BuildHyperliquidSendAssetOptions = {
  asset: string;
  destination: string;
  marketType: "spot" | "perp";
  amount: string;
};

export type HyperliquidInternalTransfer = {
  sourceDex: string;
  destination: string;
  destinationDex: string;
  token: string;
  amount: string;
};

export type HyperliquidSendAsset = {
  destination: string;
  amount: string;
  sourceDex: string;
  destinationDex: string;
  token: string;
};
