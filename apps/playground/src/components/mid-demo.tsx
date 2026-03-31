import { useMid } from "@hyperix/hooks";
import { useState } from "react";
import {
  DEMO_CARD_CLASS_NAME,
  DEMO_CARD_HEADER_CLASS_NAME,
  DEMO_CARD_INPUT_CLASS_NAME,
  DEMO_CARD_STATUS_CLASS_NAME,
  DEMO_CARD_TITLE_CLASS_NAME,
} from "./demo-card-styles";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Skeleton } from "./ui/skeleton";

const PRICE_FORMATTER = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 6,
});

const EXAMPLES = ["BTC", "HYPE/USDC", "xyz:SILVER"] as const;

function formatMid(value: string | undefined) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return "--";
  }

  return PRICE_FORMATTER.format(numericValue);
}

export function MidDemo() {
  const [coin, setCoin] = useState("BTC");
  const { data, loading, ready, error, source } = useMid(coin.trim());

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">Mid</h2>
        <p className="text-sm text-gray-500">
          Unified market mid from <code>useMid(coin)</code> across spot and perp
          symbols.
        </p>
      </div>

      <Card className={DEMO_CARD_CLASS_NAME}>
        <CardHeader className={DEMO_CARD_HEADER_CLASS_NAME}>
          <div className="space-y-2">
            <CardTitle className={DEMO_CARD_TITLE_CLASS_NAME}>
              Lookup By Coin
            </CardTitle>
            <Input
              className={DEMO_CARD_INPUT_CLASS_NAME}
              onChange={(event) => {
                setCoin(event.target.value);
              }}
              placeholder="BTC or HYPE/USDC"
              value={coin}
            />
            <div className="flex flex-wrap gap-2">
              {EXAMPLES.map((example) => (
                <Button
                  key={example}
                  className="h-8 rounded-full px-3 text-xs"
                  onClick={() => {
                    setCoin(example);
                  }}
                  type="button"
                  variant="outline"
                >
                  {example}
                </Button>
              ))}
            </div>
          </div>
          <div className={DEMO_CARD_STATUS_CLASS_NAME}>
            {error
              ? "Subscription error"
              : ready
              ? `Resolved from ${source ?? "unknown source"}`
              : loading
              ? "Resolving market mid..."
              : "Enter a market symbol to start."}
          </div>
        </CardHeader>

        <CardContent className="grid gap-4 p-6 md:grid-cols-3">
          <div className="rounded-[24px] border border-stone-200 bg-[linear-gradient(180deg,#ffffff_0%,#f7f7ef_100%)] p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-stone-400">
              Coin
            </div>
            <div className="mt-2 font-mono text-xl text-stone-900">
              {coin || "--"}
            </div>
          </div>
          <div className="rounded-[24px] border border-stone-200 bg-[linear-gradient(180deg,#ffffff_0%,#f7f7ef_100%)] p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-stone-400">
              Source
            </div>
            <div className="mt-2 font-mono text-xl text-stone-900">
              {source ?? "--"}
            </div>
          </div>
          <div className="rounded-[24px] border border-stone-200 bg-[linear-gradient(180deg,#ffffff_0%,#f7f7ef_100%)] p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-stone-400">
              Mid
            </div>
            <div className="mt-2 font-mono text-xl text-stone-900">
              {loading && !ready ? (
                <Skeleton className="h-7 w-24" />
              ) : (
                formatMid(data)
              )}
            </div>
          </div>

          {error ? (
            <div className="md:col-span-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </div>
          ) : ready && !data ? (
            <div className="md:col-span-3 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-600">
              No mid found for this symbol yet. Spot symbols should look like
              `BASE/QUOTE`, while perp symbols should be plain coin names such
              as `BTC` or builder-dex names like `test:ABC`.
            </div>
          ) : null}
        </CardContent>
      </Card>
    </section>
  );
}
