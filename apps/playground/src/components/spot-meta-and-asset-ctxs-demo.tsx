import { useSpotMetaAndAssetCtxs } from "@hyperix/hooks";
import {
  DEMO_CARD_CLASS_NAME,
  DEMO_CARD_HEADER_CLASS_NAME,
  DEMO_CARD_STATUS_CLASS_NAME,
  DEMO_CARD_TITLE_CLASS_NAME,
} from "./demo-card-styles";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Skeleton } from "./ui/skeleton";

const NUMBER_FORMATTER = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const PRICE_FORMATTER = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 6,
});

function formatNumber(value: string | number) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return "--";
  }

  return NUMBER_FORMATTER.format(numericValue);
}

function formatPrice(value: string | null) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return "--";
  }

  return PRICE_FORMATTER.format(numericValue);
}

function JsonPreview({ value }: { value: unknown }) {
  return (
    <pre className="max-h-80 overflow-auto rounded-2xl bg-stone-950 p-4 text-[11px] leading-5 text-stone-100">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

function SpotMetaAndCtxsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-24 rounded-[24px]" />
        <Skeleton className="h-24 rounded-[24px]" />
        <Skeleton className="h-24 rounded-[24px]" />
      </div>
      <Skeleton className="h-64 w-full rounded-[28px]" />
    </div>
  );
}

export function SpotMetaAndAssetCtxsDemo() {
  const { data, isLoading, error, isFetched } = useSpotMetaAndAssetCtxs();
  const [meta, assetCtxs] = data ?? [];
  const tokens = meta?.tokens ?? [];
  const markets =
    meta?.universe.map((market, index) => {
      const baseToken = tokens.find(
        (token) => token.index === market.tokens[0],
      );
      const quoteToken = tokens.find(
        (token) => token.index === market.tokens[1],
      );
      const assetCtx = assetCtxs?.[index];

      return {
        index: market.index,
        pair: market.name,
        isCanonical: market.isCanonical,
        baseToken,
        quoteToken,
        assetCtx,
        dayNtlVlm: Number(assetCtx?.dayNtlVlm ?? 0),
      };
    }) ?? [];

  const rankedMarkets = [...markets].sort(
    (left, right) => right.dayNtlVlm - left.dayNtlVlm,
  );
  const totalVolume = rankedMarkets.reduce(
    (sum, market) => sum + market.dayNtlVlm,
    0,
  );
  const canonicalCount = rankedMarkets.filter(
    (market) => market.isCanonical,
  ).length;

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">Spot Meta and Asset Ctxs</h2>
        <p className="text-sm text-gray-500">
          Query demo for <code>useSpotMetaAndAssetCtxs</code>, combining spot
          market metadata and asset context snapshots in one request.
        </p>
      </div>

      <Card className={DEMO_CARD_CLASS_NAME}>
        <CardHeader className={DEMO_CARD_HEADER_CLASS_NAME}>
          <div className="space-y-2">
            <CardTitle className={DEMO_CARD_TITLE_CLASS_NAME}>
              Spot Market Snapshot
            </CardTitle>
            <p className="text-sm text-stone-500">
              Each market row joins token metadata with its latest spot asset
              context so we can inspect pair structure, liquidity, and pricing
              in one place.
            </p>
          </div>
          <div className={DEMO_CARD_STATUS_CLASS_NAME}>
            {isLoading
              ? "Fetching combined spot metadata and asset contexts..."
              : isFetched
                ? `${rankedMarkets.length} spot markets, ${tokens.length} tokens, $${formatNumber(totalVolume)} total daily notional volume`
                : "Waiting for response"}
          </div>
        </CardHeader>

        <CardContent className="space-y-4 p-6">
          {error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error.message}
            </div>
          ) : isLoading ? (
            <SpotMetaAndCtxsSkeleton />
          ) : !data ? (
            <div className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-600">
              No spot metadata payload returned.
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-[24px] border border-stone-200 bg-stone-50/80 p-4">
                  <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-stone-400">
                    Spot Markets
                  </div>
                  <div className="mt-3 text-2xl font-semibold text-stone-900">
                    {rankedMarkets.length}
                  </div>
                </div>
                <div className="rounded-[24px] border border-stone-200 bg-stone-50/80 p-4">
                  <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-stone-400">
                    Tokens
                  </div>
                  <div className="mt-3 text-2xl font-semibold text-stone-900">
                    {tokens.length}
                  </div>
                </div>
                <div className="rounded-[24px] border border-stone-200 bg-stone-50/80 p-4">
                  <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-stone-400">
                    Canonical Markets
                  </div>
                  <div className="mt-3 text-2xl font-semibold text-stone-900">
                    {canonicalCount}
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto rounded-[28px] border border-stone-200 bg-white/80">
                <table className="min-w-[1080px] table-auto border-separate border-spacing-0">
                  <thead className="sticky top-0 z-10 bg-[#f8fbfd]">
                    <tr className="text-left text-[11px] uppercase tracking-[0.12em] text-[#6f8797]">
                      <th className="px-4 py-3 font-medium">Pair</th>
                      <th className="px-4 py-3 font-medium">Base</th>
                      <th className="px-4 py-3 font-medium">Quote</th>
                      <th className="px-4 py-3 font-medium">Mark</th>
                      <th className="px-4 py-3 font-medium">Mid</th>
                      <th className="px-4 py-3 font-medium">24h Notional</th>
                      <th className="px-4 py-3 font-medium">24h Base</th>
                      <th className="px-4 py-3 font-medium">Supply</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rankedMarkets.map((market) => (
                      <tr
                        key={market.pair}
                        className="border-b border-stone-100 bg-white/80 text-sm text-stone-700"
                      >
                        <td className="px-4 py-3">
                          <div className="font-semibold text-stone-900">
                            {market.pair}
                          </div>
                          <div className="text-xs text-stone-500">
                            #{market.index}{" "}
                            {market.isCanonical ? "canonical" : "non-canonical"}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-stone-900">
                            {market.baseToken?.name ?? "--"}
                          </div>
                          <div className="text-xs text-stone-500">
                            {market.baseToken?.fullName ?? "Unknown token"}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-stone-900">
                            {market.quoteToken?.name ?? "--"}
                          </div>
                          <div className="text-xs text-stone-500">
                            {market.quoteToken?.fullName ?? "Unknown token"}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-stone-900">
                          ${formatPrice(market.assetCtx?.markPx ?? null)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-stone-900">
                          ${formatPrice(market.assetCtx?.midPx ?? null)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-stone-900">
                          ${formatNumber(market.assetCtx?.dayNtlVlm ?? 0)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-stone-900">
                          {formatNumber(market.assetCtx?.dayBaseVlm ?? 0)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-stone-900">
                          {market.assetCtx
                            ? `${formatNumber(market.assetCtx.circulatingSupply)} / ${formatNumber(market.assetCtx.totalSupply)}`
                            : "--"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-medium uppercase tracking-[0.18em] text-stone-400">
                  Raw Response
                </div>
                <JsonPreview value={data} />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
