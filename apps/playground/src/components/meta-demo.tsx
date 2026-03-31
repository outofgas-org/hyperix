import { useAllPerpMetas, useSpotMeta } from "@hyperix/hooks";
import {
  DEMO_CARD_CLASS_NAME,
  DEMO_CARD_HEADER_CLASS_NAME,
  DEMO_CARD_STATUS_CLASS_NAME,
  DEMO_CARD_TITLE_CLASS_NAME,
} from "./demo-card-styles";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Skeleton } from "./ui/skeleton";

function JsonPreview({ value }: { value: unknown }) {
  return (
    <pre className="max-h-80 overflow-auto rounded-2xl bg-stone-950 p-4 text-[11px] leading-5 text-stone-100">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

function MetaPanel({
  title,
  description,
  status,
  error,
  loading,
  payload,
}: {
  title: string;
  description: string;
  status: string;
  error: string | undefined;
  loading: boolean;
  payload: unknown;
}) {
  return (
    <div className="space-y-4 rounded-[24px] border border-stone-200 bg-white/80 p-4">
      <div className="space-y-1">
        <div className="text-xs uppercase tracking-[0.18em] text-stone-400">{title}</div>
        <div className="text-sm text-stone-600">{description}</div>
      </div>
      <div className="rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs text-stone-600">
        {status}
      </div>
      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </div>
      ) : loading ? (
        <div className="space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : (
        <JsonPreview value={payload} />
      )}
    </div>
  );
}

export function MetaDemo() {
  const allPerpMetasState = useAllPerpMetas();
  const spotMetaState = useSpotMeta();

  const perpDexCount = allPerpMetasState.data?.length ?? 0;
  const perpUniverseCount =
    allPerpMetasState.data?.reduce((total, dexMetadata) => total + dexMetadata.universe.length, 0) ??
    0;
  const spotMarketCount = spotMetaState.data?.universe.length ?? 0;
  const spotTokenCount = spotMetaState.data?.tokens.length ?? 0;

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">Perp and Spot Metadata</h2>
        <p className="text-sm text-gray-500">
          Snapshot info fetched through <code>useAllPerpMetas</code> and <code>useSpotMeta</code>.
        </p>
      </div>

      <Card className={DEMO_CARD_CLASS_NAME}>
        <CardHeader className={DEMO_CARD_HEADER_CLASS_NAME}>
          <div className="space-y-2">
            <CardTitle className={DEMO_CARD_TITLE_CLASS_NAME}>Market Metadata</CardTitle>
            <p className="text-sm text-stone-500">
              Compare the perpetual universe with the spot token and market listings.
            </p>
          </div>
          <div className={DEMO_CARD_STATUS_CLASS_NAME}>
            {allPerpMetasState.isLoading || spotMetaState.isLoading
              ? "Fetching metadata snapshots..."
              : `${perpUniverseCount} perp markets across ${perpDexCount} DEXs, ${spotMarketCount} spot markets, ${spotTokenCount} spot tokens`}
          </div>
        </CardHeader>

        <CardContent className="grid gap-4 p-6 lg:grid-cols-2">
          <MetaPanel
            description="Perpetual market metadata returned by Hyperliquid info."
            error={allPerpMetasState.error?.message}
            loading={allPerpMetasState.isLoading}
            payload={allPerpMetasState.data}
            status={
              allPerpMetasState.isFetched
                ? `${perpUniverseCount} perpetual markets across ${perpDexCount} DEXs`
                : "Waiting for perpetual metadata"
            }
            title="All Perp Metas"
          />
          <MetaPanel
            description="Spot tokens plus the current tradable spot market universe."
            error={spotMetaState.error?.message}
            loading={spotMetaState.isLoading}
            payload={spotMetaState.data}
            status={
              spotMetaState.isFetched
                ? `${spotMarketCount} spot markets and ${spotTokenCount} tokens loaded`
                : "Waiting for spot metadata"
            }
            title="Spot Meta"
          />
        </CardContent>
      </Card>
    </section>
  );
}
