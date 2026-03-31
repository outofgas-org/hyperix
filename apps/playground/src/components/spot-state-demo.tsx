import { useSpotState } from "@hyperix/hooks";
import { useMemo, useState } from "react";
import {
  DEMO_CARD_CLASS_NAME,
  DEMO_CARD_HEADER_CLASS_NAME,
  DEMO_CARD_INPUT_CLASS_NAME,
  DEMO_CARD_STATUS_CLASS_NAME,
  DEMO_CARD_TITLE_CLASS_NAME,
} from "./demo-card-styles";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Skeleton } from "./ui/skeleton";

const DEFAULT_ADDRESS = "0x0000000000000000000000000000000000000000";

const VALUE_FORMATTER = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 6,
});

function isAddress(value: string): value is `0x${string}` {
  return /^0x[a-fA-F0-9]{40}$/.test(value);
}

function formatNumber(value: string | number) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return "--";
  }

  return VALUE_FORMATTER.format(numericValue);
}

function SpotStateSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-5 w-44" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}

function JsonPreview({ value }: { value: unknown }) {
  return (
    <pre className="max-h-80 overflow-auto rounded-2xl bg-stone-950 p-4 text-[11px] leading-5 text-stone-100">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

export function SpotStateDemo() {
  const [input, setInput] = useState(DEFAULT_ADDRESS);
  const address = isAddress(input) ? input : undefined;
  const { data, loading, error, ready } = useSpotState(address ?? DEFAULT_ADDRESS, {
    enabled: Boolean(address),
  });

  const balances = useMemo(() => {
    return [...(data?.balances ?? [])]
      .map((balance) => ({
        ...balance,
        displayCoin: balance.coin,
        available: Number(balance.total) - Number(balance.hold),
      }))
      .sort((left, right) => Number(right.entryNtl) - Number(left.entryNtl));
  }, [data?.balances]);

  const summary = useMemo(() => {
    return {
      totalBalance: balances.reduce((sum, item) => sum + Number(item.total), 0),
      totalHeld: balances.reduce((sum, item) => sum + Number(item.hold), 0),
      totalEntryNtl: balances.reduce((sum, item) => sum + Number(item.entryNtl), 0),
      escrowCount: data?.evmEscrows?.length ?? 0,
    };
  }, [balances, data?.evmEscrows]);

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">Spot State</h2>
        <p className="text-sm text-gray-500">
          Live wallet stream from <code>useSpotState</code>, showing token balances, held amounts,
          and escrow entries for a tracked address.
        </p>
      </div>

      <Card className={`${DEMO_CARD_CLASS_NAME} text-[#183242]`}>
        <CardHeader className={DEMO_CARD_HEADER_CLASS_NAME}>
          <div className="space-y-2">
            <CardTitle className={DEMO_CARD_TITLE_CLASS_NAME}>Tracked Wallet</CardTitle>
            <Input
              className={DEMO_CARD_INPUT_CLASS_NAME}
              onChange={(event) => {
                setInput(event.target.value);
              }}
              placeholder="0x..."
              value={input}
            />
          </div>
          <div className={`${DEMO_CARD_STATUS_CLASS_NAME} flex items-center justify-between gap-4`}>
            <span>
              {address
                ? `Streaming spot state for ${address}`
                : "Enter a valid 42-character hex wallet address to subscribe to spot state."}
            </span>
            <span>
              {error
                ? "Error"
                : ready
                  ? `${balances.length} balances`
                  : loading
                    ? "Connecting..."
                    : "Idle"}
            </span>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 p-6">
          {error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </div>
          ) : !address || (loading && !ready) ? (
            <SpotStateSkeleton />
          ) : !data ? (
            <div className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-600">
              Waiting for the first spot state snapshot.
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-[24px] border border-stone-200 bg-stone-50/80 p-4">
                  <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-stone-400">
                    Balances
                  </div>
                  <div className="mt-3 text-2xl font-semibold text-stone-900">
                    {balances.length}
                  </div>
                </div>
                <div className="rounded-[24px] border border-stone-200 bg-stone-50/80 p-4">
                  <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-stone-400">
                    Total Balance
                  </div>
                  <div className="mt-3 text-2xl font-semibold text-stone-900">
                    {formatNumber(summary.totalBalance)}
                  </div>
                </div>
                <div className="rounded-[24px] border border-stone-200 bg-stone-50/80 p-4">
                  <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-stone-400">
                    Held Amount
                  </div>
                  <div className="mt-3 text-2xl font-semibold text-stone-900">
                    {formatNumber(summary.totalHeld)}
                  </div>
                </div>
                <div className="rounded-[24px] border border-stone-200 bg-stone-50/80 p-4">
                  <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-stone-400">
                    Entry Notional
                  </div>
                  <div className="mt-3 text-2xl font-semibold text-stone-900">
                    ${formatNumber(summary.totalEntryNtl)}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="grid grid-cols-[minmax(0,1.3fr)_repeat(4,minmax(0,1fr))] gap-3 px-2 text-[11px] font-medium uppercase tracking-[0.18em] text-stone-400">
                  <span>Asset</span>
                  <span className="text-right">Total</span>
                  <span className="text-right">Hold</span>
                  <span className="text-right">Available</span>
                  <span className="text-right">Entry Ntl</span>
                </div>
                <div className="space-y-2">
                  {balances.map((balance) => (
                    <div
                      key={`${balance.token}-${balance.coin}`}
                      className="grid grid-cols-[minmax(0,1.3fr)_repeat(4,minmax(0,1fr))] gap-3 rounded-[24px] border border-stone-200 bg-white/70 px-4 py-3 text-sm"
                    >
                      <div className="min-w-0">
                        <div className="truncate font-medium text-stone-900">
                          {balance.displayCoin}
                        </div>
                        <div className="text-xs text-stone-500">
                          token #{balance.token} · raw {balance.coin}
                        </div>
                      </div>
                      <div className="text-right font-medium text-stone-900">
                        {formatNumber(balance.total)}
                      </div>
                      <div className="text-right text-stone-600">
                        {formatNumber(balance.hold)}
                      </div>
                      <div className="text-right text-stone-600">
                        {formatNumber(balance.available)}
                      </div>
                      <div className="text-right text-stone-900">
                        ${formatNumber(balance.entryNtl)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
                <div className="space-y-2">
                  <div className="text-xs font-medium uppercase tracking-[0.18em] text-stone-400">
                    EVM Escrows
                  </div>
                  {summary.escrowCount === 0 ? (
                    <div className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-600">
                      No EVM escrows reported for this wallet.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {data.evmEscrows?.map((escrow) => (
                        <div
                          key={`${escrow.token}-${escrow.coin}`}
                          className="flex items-center justify-between gap-4 rounded-[20px] border border-stone-200 bg-white/70 px-4 py-3 text-sm"
                        >
                          <div>
                            <div className="font-medium text-stone-900">
                              {escrow.coin}
                            </div>
                            <div className="text-xs text-stone-500">
                              token #{escrow.token} · raw {escrow.coin}
                            </div>
                          </div>
                          <div className="text-right font-medium text-stone-900">
                            {formatNumber(escrow.total)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-medium uppercase tracking-[0.18em] text-stone-400">
                    Raw Response
                  </div>
                  <JsonPreview value={data} />
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
