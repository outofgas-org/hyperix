import { useUserVaultEquities } from "@hyperix/hooks";
import { useMemo, useState } from "react";
import { formatDate } from "../lib/format-date";
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

function formatUsd(value: string) {
  return `${VALUE_FORMATTER.format(Number(value))} USDC`;
}

function VaultEquitiesSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-20 w-full" />
    </div>
  );
}

export function UserVaultEquitiesDemo() {
  const [input, setInput] = useState(DEFAULT_ADDRESS);
  const address = isAddress(input) ? input : undefined;
  const { data, isPending, error, isFetched } = useUserVaultEquities(
    address ?? DEFAULT_ADDRESS,
    {
      enabled: Boolean(address),
    },
  );

  const summary = useMemo(() => {
    const entries = data ?? [];
    const totalEquity = entries.reduce(
      (sum, item) => sum + Number(item.equity),
      0,
    );

    return {
      count: entries.length,
      totalEquity,
    };
  }, [data]);

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">User Vault Equities</h2>
        <p className="text-sm text-gray-500">
          Query demo for <code>useUserVaultEquities</code>, showing vault
          deposits for a tracked wallet.
        </p>
      </div>

      <Card className={`${DEMO_CARD_CLASS_NAME} text-[#183242]`}>
        <CardHeader className={DEMO_CARD_HEADER_CLASS_NAME}>
          <div className="space-y-2">
            <CardTitle className={DEMO_CARD_TITLE_CLASS_NAME}>
              Tracked Wallet
            </CardTitle>
            <Input
              className={DEMO_CARD_INPUT_CLASS_NAME}
              onChange={(event) => {
                setInput(event.target.value);
              }}
              placeholder="0x..."
              value={input}
            />
          </div>
          <div
            className={`${DEMO_CARD_STATUS_CLASS_NAME} flex items-center justify-between gap-4`}
          >
            <span>
              {address
                ? `Fetching vault equities for ${address}`
                : "Enter a valid 42-character hex wallet address to load vault equities."}
            </span>
            <span>
              {isPending
                ? "Loading..."
                : isFetched
                  ? `${summary.count} vaults`
                  : "Idle"}
            </span>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 p-6">
          {error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error.message}
            </div>
          ) : !address || isPending ? (
            <VaultEquitiesSkeleton />
          ) : summary.count === 0 ? (
            <div className="rounded-xl border border-[#e8eef3] bg-[#f8fbfd] px-3 py-2 text-sm text-[#6f8797]">
              No vault equity records returned for this wallet.
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[24px] border border-stone-200 bg-stone-50/80 p-4">
                  <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-stone-400">
                    Vault Count
                  </div>
                  <div className="mt-3 text-2xl font-semibold text-stone-900">
                    {summary.count}
                  </div>
                </div>
                <div className="rounded-[24px] border border-stone-200 bg-stone-50/80 p-4">
                  <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-stone-400">
                    Total Equity
                  </div>
                  <div className="mt-3 text-2xl font-semibold text-stone-900">
                    {formatUsd(String(summary.totalEquity))}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)] gap-3 px-2 text-[11px] font-medium uppercase tracking-[0.18em] text-stone-400">
                  <span>Vault</span>
                  <span className="text-right">Equity</span>
                  <span className="text-right">Locked Until</span>
                </div>
                <div className="space-y-2">
                  {data?.map((item) => (
                    <div
                      key={`${item.vaultAddress}-${item.lockedUntilTimestamp}-${item.equity}`}
                      className="grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)] gap-3 rounded-[24px] border border-stone-200 bg-white/70 px-4 py-3 text-sm"
                    >
                      <div className="min-w-0">
                        <div className="truncate font-medium text-stone-900">
                          {item.vaultAddress}
                        </div>
                        <div className="text-xs text-stone-500">
                          Vault address
                        </div>
                      </div>
                      <div className="text-right font-medium text-stone-900">
                        {formatUsd(item.equity)}
                      </div>
                      <div className="text-right text-stone-600">
                        {item.lockedUntilTimestamp > 0
                          ? formatDate(item.lockedUntilTimestamp)
                          : "Available"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
