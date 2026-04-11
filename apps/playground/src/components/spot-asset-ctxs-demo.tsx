import { useSpotAssetCtxs, useSymbolConverter } from "@hyperix/hooks";
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

function formatNumber(value: string | number | null) {
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

function SpotSkeleton() {
  return (
    <div className="space-y-3 p-6">
      {Array.from({ length: 8 }, (_, index) => (
        <div
          key={index}
          className="grid grid-cols-7 gap-3 rounded-2xl border border-stone-200 bg-white/80 p-4"
        >
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-24" />
        </div>
      ))}
    </div>
  );
}

const HEADERS = [
  "Coin",
  "Raw ID",
  "Mark",
  "Mid",
  "24h Notional",
  "24h Base",
  "Supply",
] as const;

export function SpotAssetCtxsDemo() {
  const { data, loading, error, ready } = useSpotAssetCtxs();
  const symbolConverter = useSymbolConverter();
  const assets = [...(data ?? [])].sort(
    (left, right) => Number(right.dayNtlVlm) - Number(left.dayNtlVlm),
  );
  const totalSpotVolume = (data ?? []).reduce(
    (sum, asset) => sum + Number(asset.dayNtlVlm),
    0,
  );

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">Spot Asset Ctxs</h2>
        <p className="text-sm text-gray-500">
          Live stream from <code>useSpotAssetCtxs</code>, listed in a table and
          resolved through the symbol converter when possible.
        </p>
      </div>

      <Card className={DEMO_CARD_CLASS_NAME}>
        <CardHeader className={DEMO_CARD_HEADER_CLASS_NAME}>
          <div className="space-y-2">
            <CardTitle className={DEMO_CARD_TITLE_CLASS_NAME}>
              Spot Context Snapshot
            </CardTitle>
            <p className="text-sm text-stone-500">
              Each row is a streamed spot asset context with a
              converter-resolved market name, live prices, turnover, and supply
              metrics.
            </p>
          </div>
          <div className={DEMO_CARD_STATUS_CLASS_NAME}>
            {error
              ? "Subscription error"
              : ready
                ? `${formatNumber(data?.length ?? 0)} assets, $${formatNumber(totalSpotVolume)} total daily notional volume`
                : loading
                  ? "Connecting to spot asset contexts..."
                  : "Waiting for first snapshot..."}
          </div>
        </CardHeader>

        <CardContent className="p-0 font-mono text-xs">
          {error ? (
            <div className="m-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </div>
          ) : !ready && loading ? (
            <SpotSkeleton />
          ) : assets.length === 0 ? (
            <div className="m-4 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-600">
              No spot asset contexts available yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[1160px] table-auto border-separate border-spacing-0">
                <thead className="sticky top-0 z-10 bg-[#f8fbfd]">
                  <tr className="border-b border-[#edf3f7] text-left text-[11px] uppercase tracking-[0.12em] text-[#6f8797]">
                    {HEADERS.map((header) => (
                      <th
                        key={header}
                        className="px-4 py-3 font-medium whitespace-nowrap"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {assets.map((asset) => {
                    const displayCoin =
                      symbolConverter?.getSpotByPairId(asset.coin) ??
                      asset.coin;

                    return (
                      <tr
                        key={asset.coin}
                        className="border-b border-stone-100 bg-white/80 text-stone-700"
                      >
                        <td className="px-4 py-3 font-semibold whitespace-nowrap text-stone-900">
                          {displayCoin}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-stone-500">
                          {asset.coin}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-stone-900">
                          ${formatPrice(asset.markPx)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-stone-900">
                          ${formatPrice(asset.midPx)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-stone-900">
                          ${formatNumber(asset.dayNtlVlm)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-stone-900">
                          {formatNumber(asset.dayBaseVlm)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-stone-900">
                          {formatNumber(asset.circulatingSupply)} /{" "}
                          {formatNumber(asset.totalSupply)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
