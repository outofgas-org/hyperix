import {
  HttpTransport,
  InfoClient,
  SubscriptionClient,
  WebSocketTransport,
} from "@nktkas/hyperliquid";

export const transport = new HttpTransport();

export const infoClient = new InfoClient({ transport });

export const wsTransport = new WebSocketTransport();

export const wsClient = new SubscriptionClient({ transport: wsTransport });

export const HYCORE_USDC_ADDRESS = "0x6d1e7cde53ba9467b783cb7c530ce054";
