import {
  HttpTransport,
  InfoClient,
  SubscriptionClient,
  WebSocketTransport,
} from "@nktkas/hyperliquid";

export const transport = new HttpTransport();

export const infoClient = new InfoClient({ transport: transport });

export const wsTransport = new WebSocketTransport();

export const wsClient = new SubscriptionClient({ transport: wsTransport });
