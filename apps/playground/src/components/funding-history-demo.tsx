import { type FundingHistory, useFundingHistory } from "@hyperix/hooks";
import { useMemo, useState } from "react";
import { formatDate } from "../lib/format-date";
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

const HOUR_MS = 60 * 60 * 1000;

const WINDOW_OPTIONS = [
  {
    label: "24H",
    durationMs: 24 * HOUR_MS,
  },
  {
    label: "7D",
    durationMs: 7 * 24 * HOUR_MS,
  },
  {
    label: "30D",
    durationMs: 30 * 24 * HOUR_MS,
  },
] as const;

const RATE_FORMATTER = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 4,
  maximumFractionDigits: 6,
});

const VALUE_FORMATTER = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 6,
});

function formatRate(value: string) {
  return `${RATE_FORMATTER.format(Number(value) * 100)}%`;
}

function formatValue(value: string) {
  return VALUE_FORMATTER.format(Number(value));
}

function FundingHistoryRow({ record }: { record: FundingHistory }) {
  const fundingRate = Number(record.fundingRate);

  return (
    <div className="grid grid-cols-4 gap-2 rounded-xl px-2 py-2 even:bg-gray-50">
      <div className="font-semibold text-stone-900">{record.coin}</div>
      <div
        className={`text-right ${
          fundingRate >= 0 ? "text-emerald-600" : "text-rose-600"
        }`}
      >
        {formatRate(record.fundingRate)}
      </div>
      <div className="text-right text-stone-700">
        {formatValue(record.premium)}
      </div>
      <div className="text-right text-stone-500">
        {formatDate(record.time)}
      </div>
    </div>
  );
}

export function FundingHistoryDemo() {
  const [coinInput, setCoinInput] = useState("ETH");
  const [durationMs, setDurationMs] = useState(WINDOW_OPTIONS[0].durationMs);
  const coin = coinInput.trim().toUpperCase();
  const endTime = useMemo(() => Date.now(), [durationMs]);
  const startTime = endTime - durationMs;
  const { data, isPending, error, isFetched } = useFundingHistory(
    coin || "ETH",
    startTime,
    {
      enabled: Boolean(coin),
      endTime,
    },
  );
  const history = data ?? [];

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">Funding History</h2>
        <p className="text-sm text-gray-500">
          Historical funding rates fetched through{" "}
          <code>useFundingHistory</code>.
        </p>
      </div>

      <Card className={DEMO_CARD_CLASS_NAME}>
        <CardHeader className={DEMO_CARD_HEADER_CLASS_NAME}>
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
            <div className="space-y-2">
              <CardTitle className={DEMO_CARD_TITLE_CLASS_NAME}>
                Perp Market
              </CardTitle>
              <Input
                className={DEMO_CARD_INPUT_CLASS_NAME}
                onChange={(event) => {
                  setCoinInput(event.target.value);
                }}
                placeholder="ETH"
                value={coinInput}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {WINDOW_OPTIONS.map((option) => {
                const isActive = option.durationMs === durationMs;

                return (
                  <Button
                    key={option.label}
                    className="h-10 rounded-full px-4 text-xs"
                    onClick={() => {
                      setDurationMs(option.durationMs);
                    }}
                    type="button"
                    variant={isActive ? "default" : "outline"}
                  >
                    {option.label}
                  </Button>
                );
              })}
            </div>
          </div>
          <div
            className={`${DEMO_CARD_STATUS_CLASS_NAME} flex items-center justify-between gap-4`}
          >
            <span>
              {coin
                ? `${coin} funding records from ${formatDate(startTime)} to ${formatDate(endTime)}`
                : "Enter a perp market symbol to fetch funding history."}
            </span>
            <span>
              {isPending ? "Loading..." : isFetched ? "Fetched" : "Idle"}
            </span>
          </div>
        </CardHeader>

        <CardContent className="space-y-3 p-6 font-mono text-xs">
          <div className="grid grid-cols-4 gap-2 text-stone-500">
            <span>Market</span>
            <span className="text-right">Funding Rate</span>
            <span className="text-right">Premium</span>
            <span className="text-right">Time</span>
          </div>

          {error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-rose-700">
              {error.message}
            </div>
          ) : isPending ? (
            <div className="space-y-1">
              <Skeleton />
              <Skeleton />
              <Skeleton />
            </div>
          ) : history.length === 0 ? (
            <div className="rounded-xl bg-gray-50 px-3 py-2 text-gray-500">
              No funding history returned for this window.
            </div>
          ) : (
            <div className="h-72 space-y-1 overflow-y-auto">
              {history.map((record) => (
                <FundingHistoryRow
                  key={`${record.coin}-${record.time}-${record.fundingRate}`}
                  record={record}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
