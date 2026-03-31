import { useAllDexsAssetCtxs } from "@hyperix/hooks";
import {
  DEMO_CARD_CLASS_NAME,
  DEMO_CARD_HEADER_CLASS_NAME,
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

const FUNDING_FORMATTER = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatNumber(value: number) {
  if (!Number.isFinite(value)) {
    return "--";
  }

  return NUMBER_FORMATTER.format(value);
}

function formatPrice(value: string | null) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return "--";
  }

  return PRICE_FORMATTER.format(numericValue);
}

function formatFundingBps(value: number) {
  if (!Number.isFinite(value)) {
    return "--";
  }

  return `${FUNDING_FORMATTER.format(value * 10_000)} bps`;
}

function getDexSummaries(
  data: NonNullable<ReturnType<typeof useAllDexsAssetCtxs>["data"]>,
) {
  return data.ctxs.map(([dex, ctxs]) => {
    const rankedAssets = ctxs
      .map((ctx, index) => ({
        assetIndex: index + 1,
        ctx,
        dayNtlVlm: Number(ctx.dayNtlVlm),
      }))
      .sort((left, right) => right.dayNtlVlm - left.dayNtlVlm);

    const totalDayNtlVlm = rankedAssets.reduce((sum, asset) => sum + asset.dayNtlVlm, 0);
    const averageFunding =
      rankedAssets.reduce((sum, asset) => sum + Number(asset.ctx.funding), 0) /
      Math.max(rankedAssets.length, 1);

    return {
      dex,
      assetCount: ctxs.length,
      totalDayNtlVlm,
      averageFunding,
      topAssets: rankedAssets.slice(0, 3),
    };
  });
}

function DexSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {Array.from({ length: 4 }, (_, index) => (
        <div
          key={index}
          className="space-y-4 rounded-[28px] border border-stone-200 bg-white/80 p-5"
        >
          <div className="flex items-center justify-between gap-4">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Skeleton className="h-16 rounded-2xl" />
            <Skeleton className="h-16 rounded-2xl" />
            <Skeleton className="h-16 rounded-2xl" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-10 rounded-2xl" />
            <Skeleton className="h-10 rounded-2xl" />
            <Skeleton className="h-10 rounded-2xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function AllDexsAssetCtxsDemo() {
  const { data, loading, error, ready } = useAllDexsAssetCtxs();
  const summaries = data ? getDexSummaries(data) : [];
  const totalAssetCount = summaries.reduce((sum, summary) => sum + summary.assetCount, 0);

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">All DEXs Asset Ctxs</h2>
        <p className="text-sm text-gray-500">
          Live stream from <code>useAllDexsAssetCtxs</code>, grouped by DEX and ranked by daily
          notional volume.
        </p>
      </div>

      <Card className={DEMO_CARD_CLASS_NAME}>
        <CardHeader className={DEMO_CARD_HEADER_CLASS_NAME}>
          <div className="space-y-2">
            <CardTitle className={DEMO_CARD_TITLE_CLASS_NAME}>DEX Context Snapshot</CardTitle>
            <p className="text-sm text-stone-500">
              The payload does not include market symbols, so the demo labels each perpetual as
              its streamed asset index within that DEX.
            </p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-stone-700">
            {error
              ? "Subscription error"
              : ready
                ? `${summaries.length} DEXs, ${formatNumber(totalAssetCount)} asset contexts`
                : loading
                  ? "Connecting to all DEX asset contexts..."
                  : "Waiting for first snapshot..."}
          </div>
        </CardHeader>

        <CardContent className="space-y-4 p-6">
          {error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </div>
          ) : !ready && loading ? (
            <DexSkeleton />
          ) : summaries.length === 0 ? (
            <div className="rounded-xl bg-gray-50 px-3 py-2 text-sm text-gray-500">
              No asset contexts available yet.
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {summaries.map((summary) => (
                <div
                  key={summary.dex}
                  className="rounded-[28px] border border-stone-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8f5ef_100%)] p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-xs uppercase tracking-[0.18em] text-stone-400">
                        {summary.dex}
                      </div>
                      <div className="mt-2 text-lg font-semibold text-stone-900">
                        {summary.assetCount} perpetual contexts
                      </div>
                    </div>
                    <div className="rounded-2xl border border-stone-200 bg-white px-3 py-2 text-right text-xs text-stone-500">
                      <div>Total notional volume</div>
                      <div className="mt-1 font-mono text-sm text-stone-900">
                        ${formatNumber(summary.totalDayNtlVlm)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-stone-200 bg-white/80 p-3">
                      <div className="text-xs uppercase tracking-[0.12em] text-stone-400">
                        Assets
                      </div>
                      <div className="mt-2 font-mono text-lg text-stone-900">
                        {formatNumber(summary.assetCount)}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-stone-200 bg-white/80 p-3">
                      <div className="text-xs uppercase tracking-[0.12em] text-stone-400">
                        Avg Funding
                      </div>
                      <div className="mt-2 font-mono text-lg text-stone-900">
                        {formatFundingBps(summary.averageFunding)}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-stone-200 bg-white/80 p-3">
                      <div className="text-xs uppercase tracking-[0.12em] text-stone-400">
                        Top Asset
                      </div>
                      <div className="mt-2 font-mono text-lg text-stone-900">
                        {summary.topAssets[0] ? `#${summary.topAssets[0].assetIndex}` : "--"}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    {summary.topAssets.map((asset) => (
                      <div
                        key={`${summary.dex}-${asset.assetIndex}`}
                        className="grid grid-cols-[auto_1fr] gap-3 rounded-2xl border border-stone-200 bg-white/75 px-4 py-3 sm:grid-cols-[auto_1fr_auto_auto]"
                      >
                        <div className="rounded-full bg-stone-900 px-2.5 py-1 text-xs font-semibold text-white">
                          #{asset.assetIndex}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-stone-800">
                            Asset #{asset.assetIndex}
                          </div>
                          <div className="text-xs text-stone-500">
                            Daily volume ${formatNumber(asset.dayNtlVlm)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs uppercase tracking-[0.12em] text-stone-400">
                            Mark
                          </div>
                          <div className="font-mono text-sm text-stone-900">
                            {formatPrice(asset.ctx.markPx)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs uppercase tracking-[0.12em] text-stone-400">
                            Mid
                          </div>
                          <div className="font-mono text-sm text-stone-900">
                            {formatPrice(asset.ctx.midPx)}
                          </div>
                        </div>
                      </div>
                    ))}
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
