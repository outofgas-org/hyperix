import type { TradesEvent } from "@nktkas/hyperliquid/api/subscription";
import { type UseSubscribeState, useSubscribe } from "@outofgas/react-stream";
import { wsClient } from "./config/hl.js";

export type Trade = TradesEvent[number];

export type UseTradesOptions = {
  limit?: number;
  enabled?: boolean;
};

export const EMPTY_TRADES: Trade[] = [];

function formatTrades(
  previousTrades: Trade[],
  incomingTrades: TradesEvent,
  limit: number,
): Trade[] {
  const uniqueTrades = Array.from(
    new Map(
      [...incomingTrades, ...previousTrades].map((trade) => [trade.tid, trade]),
    ).values(),
  );

  return uniqueTrades.sort((a, b) => b.time - a.time).slice(0, limit);
}

export function useTrades(
  coin: string,
  options: UseTradesOptions = {},
): UseSubscribeState<Trade[]> {
  const { limit = 60, enabled: enabledOverride } = options;
  const enabled = enabledOverride ?? Boolean(coin);

  return useSubscribe<Trade[]>({
    key: ["trades", coin, limit],
    enabled,
    initialData: EMPTY_TRADES,
    subscribe: async ({ onData }) => {
      let trades = EMPTY_TRADES;
      const subscription = await wsClient.trades({ coin }, (msg) => {
        trades = formatTrades(trades, msg, limit);
        onData(trades);
      });

      return {
        unsubscribe: () => subscription.unsubscribe(),
      };
    },
  });
}
