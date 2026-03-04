import { SubscriptionClient, WebSocketTransport } from "@nktkas/hyperliquid";

export const wsTransport = new WebSocketTransport();

export const wsClient = new SubscriptionClient({ transport: wsTransport });
