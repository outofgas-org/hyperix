import Decimal from "decimal.js";
import { useSubscribe, type UseSubscribeState } from "@outofgas/react-stream";
import { L2BookEvent } from "@nktkas/hyperliquid/api/subscription";
import { wsClient } from "./config/hl.js";

export type L2BookLevel = [price: number, size: number, cumulativeSize: number];

export type L2Book = {
  bids: L2BookLevel[];
  asks: L2BookLevel[];
  maxCumulativeSize: number;
  levels: { nSigFigs: number; tick: string }[];
  spread: number;
  spreadPercent: number;
};

export type UseL2BookOptions = {
  depth?: number;
  nSigFigs?: number;
};

export const EMPTY_L2_BOOK: L2Book = {
  bids: [],
  asks: [],
  maxCumulativeSize: 0,
  levels: [],
  spread: 0,
  spreadPercent: 0,
};

const HL_NSIGFIGS = [5, 4, 3, 2];

export function calcOrderbookLevels(price: number) {
  if (!price || price <= 0) return [];

  const magnitude = Math.floor(Math.log10(price));

  return HL_NSIGFIGS.map((nSigFigs) => {
    const tick = new Decimal(10).pow(magnitude - nSigFigs + 1).toFixed();
    return {
      nSigFigs,
      tick,
    };
  });
}

function withCumulativeSize(
  levels: { px: string; sz: string }[],
  depth?: number,
): L2BookLevel[] {
  let cumulativeSize = new Decimal(0);
  const slicedLevels = depth === undefined ? levels : levels.slice(0, depth);

  return slicedLevels.map(({ px, sz }) => {
    const price = Number(px);
    const size = Number(sz);

    cumulativeSize = cumulativeSize.plus(sz);

    return [price, size, cumulativeSize.toNumber()];
  });
}

function formatL2Book(levels: L2BookEvent["levels"], depth?: number): L2Book {
  const [bids, asks] = levels;
  const formattedBids = withCumulativeSize(bids, depth);
  const formattedAsks = withCumulativeSize(asks, depth);
  const maxCumulativeSize = Math.max(
    ...formattedBids.map(([, , cumulativeSize]) => cumulativeSize),
    ...formattedAsks.map(([, , cumulativeSize]) => cumulativeSize),
    0,
  );

  const ask1 = formattedAsks?.length > 0 ? formattedAsks[0][0] : 1;
  const bid1 = formattedBids?.length > 0 ? formattedBids[0][0] : 1;
  const midPrice = new Decimal(ask1).plus(bid1).div(2).toNumber();

  const spread = new Decimal(ask1).minus(bid1).toNumber();
  const spreadPercent = new Decimal(spread).div(midPrice).toNumber();

  return {
    bids: formattedBids,
    asks: formattedAsks,
    maxCumulativeSize,
    levels: calcOrderbookLevels(midPrice),
    spread,
    spreadPercent,
  };
}

export const useL2Book = (coin: string, options: UseL2BookOptions = {}) => {
  const { depth, nSigFigs } = options;
  return useSubscribe<L2Book>({
    key: ["l2-book", coin, nSigFigs, depth],
    enabled: Boolean(coin),
    initialData: EMPTY_L2_BOOK,
    subscribe: async ({ onData }) => {
      const subscription = await wsClient.l2Book({ coin, nSigFigs }, (msg) => {
        onData(formatL2Book(msg.levels, depth));
      });

      return {
        unsubscribe: () => subscription.unsubscribe(),
      };
    },
  });
};
