import {
  useUserAccountActivity,
  type UserAccountActivity,
} from "@hyperix/hooks";
import { ExternalLink } from "lucide-react";
import { useState } from "react";
import { formatDate } from "../lib/format-date";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Skeleton } from "./ui/skeleton";

const VALUE_FORMATTER = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 6,
});

const TABS = [
  "Balances (7)",
  "Positions (2)",
  "Open Orders",
  "TWAP",
  "Trade History",
  "Funding History",
  "Order History",
  "Deposits and Withdrawals",
] as const;

const ACTIVE_TAB = "Deposits and Withdrawals";
const DEFAULT_ADDRESS = "0x0000000000000000000000000000000000000000";

function isAddress(value: string): value is `0x${string}` {
  return /^0x[a-fA-F0-9]{40}$/.test(value);
}

function truncateHash(hash: `0x${string}`) {
  return `${hash.slice(0, 8)}...${hash.slice(-6)}`;
}

function LedgerUpdateRow({ entry }: { entry: UserAccountActivity }) {
  const valueChange = entry.amount.displayValue === "--"
    ? "--"
    : entry.amount.direction === "neutral" && entry.amount.numericValue !== null
      ? `${VALUE_FORMATTER.format(entry.amount.numericValue)} ${entry.amount.token ?? ""}`.trim()
      : entry.amount.displayValue;

  return (
    <div className="grid min-w-[980px] grid-cols-[2.4fr_1.1fr_0.9fr_0.9fr_1.1fr_1.9fr_0.8fr] items-center gap-4 border-b border-stone-200/80 px-4 py-4 text-sm last:border-b-0 hover:bg-lime-50/40">
      <div className="flex min-w-0 items-center gap-2 text-stone-800">
        <span className="truncate">{formatDate(entry.time)}</span>
        <a
          className="shrink-0 text-stone-400 transition hover:text-stone-700"
          href={entry.explorerUrl}
          rel="noreferrer"
          target="_blank"
          title={truncateHash(entry.hash)}
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
      <span className="text-stone-700">{entry.status}</span>
      <span className="text-stone-800">{entry.action}</span>
      <span className="text-stone-700">{entry.source}</span>
      <span className="text-stone-700">{entry.destination}</span>
      <span
        className={
          entry.amount.direction === "out"
            ? "font-medium text-rose-500"
            : entry.amount.direction === "in"
              ? "font-medium text-emerald-600"
              : "font-medium text-stone-700"
        }
      >
        {valueChange}
      </span>
      <span className={entry.fee.displayValue === "--" ? "text-stone-400" : "text-rose-500"}>
        {entry.fee.displayValue === "--"
          ? "--"
          : `${VALUE_FORMATTER.format(entry.fee.numericValue ?? 0)} ${entry.fee.token ?? ""}`.trim()}
      </span>
    </div>
  );
}

function LedgerLoading() {
  return (
    <div className="space-y-0">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          className="grid min-w-[980px] grid-cols-[2.4fr_1.1fr_0.9fr_0.9fr_1.1fr_1.9fr_0.8fr] gap-4 border-b border-stone-200/80 px-4 py-4 last:border-b-0"
          key={index}
        >
          <Skeleton className="h-5 bg-stone-100" />
          <Skeleton className="h-5 bg-stone-100" />
          <Skeleton className="h-5 bg-stone-100" />
          <Skeleton className="h-5 bg-stone-100" />
          <Skeleton className="h-5 bg-stone-100" />
          <Skeleton className="h-5 bg-stone-100" />
          <Skeleton className="h-5 bg-stone-100" />
        </div>
      ))}
    </div>
  );
}

export function UserNonFundingLedgerUpdatesDemo() {
  const [input, setInput] = useState(DEFAULT_ADDRESS);
  const address = isAddress(input) ? input : undefined;
  const { data, loading, error } = useUserAccountActivity(address ?? DEFAULT_ADDRESS, {
    enabled: Boolean(address),
  });
  const updates = data?.activity ?? [];

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-stone-900">Deposits and Withdrawals</h2>
        <p className="text-sm text-stone-500">
          Light-theme account activity table based on <code>useUserAccountActivity</code>.
        </p>
      </div>

      <Card className="overflow-hidden rounded-[28px] border-stone-200 bg-white shadow-[0_18px_70px_-40px_rgba(20,24,12,0.35)]">
        <CardHeader className="gap-4 border-b border-stone-200 bg-[linear-gradient(180deg,#fdfdf7_0%,#f7f7ef_100%)] pb-5">
          <div className="space-y-2">
            <CardTitle className="text-sm font-medium uppercase tracking-[0.18em] text-stone-500">
              Tracked Wallet
            </CardTitle>
            <Input
              className="h-12 rounded-2xl border-stone-300 bg-white font-mono text-sm text-stone-900 placeholder:text-stone-400"
              onChange={(event) => {
                setInput(event.target.value);
              }}
              placeholder="0x..."
              value={input}
            />
          </div>
          <div className="rounded-2xl border border-lime-200 bg-lime-50 px-4 py-3 text-xs text-stone-600">
            {address
              ? `Subscribed to ${address}`
              : "Enter a valid 42-character hex wallet address to start the subscription."}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <div className="min-w-[980px]">
              <div className="flex items-end gap-6 border-b border-stone-200 bg-stone-50 px-4 pt-4">
                {TABS.map((tab) => (
                  <button
                    className={
                      tab === ACTIVE_TAB
                        ? "border-b-2 border-lime-500 pb-4 text-sm font-semibold text-stone-900"
                        : "pb-4 text-sm font-medium text-stone-400"
                    }
                    key={tab}
                    type="button"
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-[2.4fr_1.1fr_0.9fr_0.9fr_1.1fr_1.9fr_0.8fr] gap-4 border-b border-stone-200 bg-stone-50 px-4 py-4 font-mono text-[11px] uppercase tracking-[0.14em] text-stone-500">
                <span>Time</span>
                <span>Status</span>
                <span>Action</span>
                <span>Source</span>
                <span>Destination</span>
                <span>Account Value Change</span>
                <span>Fee</span>
              </div>

              {error ? (
                <div className="m-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {error}
                </div>
              ) : !address || (!data && loading) ? (
                <LedgerLoading />
              ) : updates.length === 0 ? (
                <div className="px-4 py-8 text-sm text-stone-500">No ledger updates yet.</div>
              ) : (
                <div className="max-h-[28rem] overflow-y-auto bg-white">
                  {updates.map((entry) => (
                    <LedgerUpdateRow key={`${entry.time}-${entry.hash}`} entry={entry} />
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-stone-200 bg-stone-50 px-4 py-3 font-mono text-[11px] uppercase tracking-[0.14em] text-stone-500">
            <span>Live websocket feed</span>
            <span>{data ? `${updates.length} entries` : loading ? "Loading..." : "Idle"}</span>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
