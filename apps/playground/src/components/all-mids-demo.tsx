import { useAllMids, useSymbolConverter } from "@hyperix/hooks";
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

const FEATURED_COINS = ["UBTC/USDC", "UETH/USDC", "HYPE/USDC"];

function formatMid(value: string | undefined) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return "--";
  }

  return PRICE_FORMATTER.format(numericValue);
}

function MidCard({
  coin,
  mid,
}: {
  coin: string;
  mid: string | undefined;
}) {
  return (
    <div className="rounded-[24px] border border-stone-200 bg-[linear-gradient(180deg,#ffffff_0%,#f7f7ef_100%)] p-4">
      <div className="text-xs uppercase tracking-[0.18em] text-stone-400">
        {coin}
      </div>
      <div className="mt-2 font-mono text-xl text-stone-900">
        {formatMid(mid)}
      </div>
      <div className="mt-1 text-xs text-stone-500">Mid price</div>
    </div>
  );
}

export function AllMidsDemo() {
  const symbolConverter = useSymbolConverter();
  const { data: mids, loading, error, ready } = useAllMids();
  const featuredCoins = FEATURED_COINS.filter((coin) => {
    const id = symbolConverter?.getSpotPairId(coin) ?? "";
    return Boolean(id && mids?.mids?.[id] !== undefined);
  });

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">All Mids</h2>
        <p className="text-sm text-gray-500">
          Live mid-price snapshot streamed from <code>useAllMids</code>.
        </p>
      </div>

      <Card className={DEMO_CARD_CLASS_NAME}>
        <CardHeader className={DEMO_CARD_HEADER_CLASS_NAME}>
          <div className="space-y-2">
            <CardTitle className={DEMO_CARD_TITLE_CLASS_NAME}>
              Market Snapshot
            </CardTitle>
            <p className="text-sm text-stone-500">
              Highlights a few core markets first, then fills the grid with the
              latest mids.
            </p>
          </div>
          <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-xs text-stone-600">
            {error
              ? "Subscription error"
              : ready
                ? `${featuredCoins.length} featured markets streaming`
                : loading
                  ? "Connecting to all mids stream..."
                  : "Waiting for first snapshot..."}
          </div>
        </CardHeader>

        <CardContent className="space-y-4 p-6">
          {error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </div>
          ) : !ready && loading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {Array.from({ length: 10 }, (_, index) => (
                <div
                  key={index}
                  className="space-y-2 rounded-2xl border border-stone-200 p-4"
                >
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-6 w-24" />
                </div>
              ))}
            </div>
          ) : featuredCoins.length === 0 ? (
            <div className="rounded-xl bg-gray-50 px-3 py-2 text-sm text-gray-500">
              No featured mid prices available yet.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {featuredCoins.map((coin) => {
                const id = symbolConverter?.getSpotPairId(coin) ?? "";
                const mid = mids?.mids?.[id] ?? "0";

                return <MidCard key={coin} coin={coin} mid={mid} />;
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
