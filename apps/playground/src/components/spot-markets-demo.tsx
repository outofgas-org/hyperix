import { useSpotMarkets } from "@hyperix/hooks";
import {
  DEMO_CARD_CLASS_NAME,
  DEMO_CARD_HEADER_CLASS_NAME,
  DEMO_CARD_TITLE_CLASS_NAME,
} from "./demo-card-styles";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Skeleton } from "./ui/skeleton";

const PRICE_FORMATTER = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 6,
});

const NUMBER_FORMATTER = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

function formatNumber(value: number) {
  if (!Number.isFinite(value)) {
    return "--";
  }

  return NUMBER_FORMATTER.format(value);
}

function formatPrice(value: number | null) {
  if (value === null || !Number.isFinite(value)) {
    return "--";
  }

  return PRICE_FORMATTER.format(value);
}

export function SpotMarketsDemo() {
  const { data, loading, error, ready } = useSpotMarkets();
  const topMarkets = [...data].sort((left, right) => right.volume24h - left.volume24h).slice(0, 12);

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">Spot Markets</h2>
        <p className="text-sm text-gray-500">
          Flattened spot market data from <code>useSpotMarkets</code>.
        </p>
      </div>

      <Card className={DEMO_CARD_CLASS_NAME}>
        <CardHeader className={DEMO_CARD_HEADER_CLASS_NAME}>
          <div className="space-y-2">
            <CardTitle className={DEMO_CARD_TITLE_CLASS_NAME}>Frontend Spot Market List</CardTitle>
            <p className="text-sm text-stone-500">
              Derived view that joins static spot metadata with live websocket asset contexts.
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-stone-700">
            {error
              ? "Market data error"
              : ready
                ? `${data.length} spot markets ready`
                : loading
                  ? "Loading spot markets..."
                  : "Waiting for market data..."}
          </div>
        </CardHeader>

        <CardContent className="space-y-4 p-6">
          {error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </div>
          ) : !ready && loading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 rounded-2xl" />
              <Skeleton className="h-10 rounded-2xl" />
              <Skeleton className="h-10 rounded-2xl" />
              <Skeleton className="h-10 rounded-2xl" />
            </div>
          ) : topMarkets.length === 0 ? (
            <div className="rounded-xl bg-gray-50 px-3 py-2 text-sm text-gray-500">
              No spot markets available yet.
            </div>
          ) : (
            <div className="space-y-2">
              {topMarkets.map((market) => (
                <div
                  key={market.pairId}
                  className="grid gap-3 rounded-[24px] border border-stone-200 bg-[linear-gradient(180deg,#ffffff_0%,#f4f8f2_100%)] px-4 py-3 sm:grid-cols-[minmax(0,1.2fr)_repeat(4,minmax(0,1fr))]"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-stone-900">
                      {market.symbol}
                    </div>
                    <div className="text-xs text-stone-500">
                      {market.isCanonical ? "canonical" : "non-canonical"} / #{market.universeIndex}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.12em] text-stone-400">Mark</div>
                    <div className="font-mono text-sm text-stone-900">
                      {formatPrice(market.markPrice)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.12em] text-stone-400">Mid</div>
                    <div className="font-mono text-sm text-stone-900">
                      {formatPrice(market.midPrice)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.12em] text-stone-400">
                      24h Volume
                    </div>
                    <div className="font-mono text-sm text-stone-900">
                      ${formatNumber(market.volume24h)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.12em] text-stone-400">
                      Supply
                    </div>
                    <div className="font-mono text-sm text-stone-900">
                      {formatNumber(market.circulatingSupply)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
