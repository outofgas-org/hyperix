import { useUserDelegatorSummary } from "@hyperix/hooks";
import { useState } from "react";
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

const TOKEN_FORMATTER = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 6,
});

function isAddress(value: string): value is `0x${string}` {
  return /^0x[a-fA-F0-9]{40}$/.test(value);
}

function formatTokenAmount(value: string | undefined) {
  if (!value) {
    return "--";
  }

  return `${TOKEN_FORMATTER.format(Number(value))} HYPE`;
}

function MetricSkeleton() {
  return <Skeleton className="mt-3 h-8 w-28" />;
}

export function UserDelegatorSummaryDemo() {
  const [input, setInput] = useState(DEFAULT_ADDRESS);
  const address = isAddress(input) ? input : undefined;
  const { data, isPending, error, isFetched } = useUserDelegatorSummary(
    address ?? DEFAULT_ADDRESS,
    {
      enabled: Boolean(address),
    },
  );

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">User Delegator Summary</h2>
        <p className="text-sm text-gray-500">
          Query demo for <code>useUserDelegatorSummary</code>, showing staking and withdrawal
          totals for a wallet.
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
                ? `Fetching staking summary for ${address}`
                : "Enter a valid 42-character hex wallet address to load the staking summary."}
            </span>
            <span>{isPending ? "Loading..." : isFetched ? "Fetched" : "Idle"}</span>
          </div>
        </CardHeader>

        <CardContent className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[24px] border border-stone-200 bg-stone-50/80 p-4">
            <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-stone-400">
              Delegated
            </div>
            <div className="mt-3 text-xl font-semibold text-stone-900">
              {isPending ? <MetricSkeleton /> : formatTokenAmount(data?.delegated)}
            </div>
          </div>
          <div className="rounded-[24px] border border-stone-200 bg-stone-50/80 p-4">
            <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-stone-400">
              Undelegated
            </div>
            <div className="mt-3 text-xl font-semibold text-stone-900">
              {isPending ? <MetricSkeleton /> : formatTokenAmount(data?.undelegated)}
            </div>
          </div>
          <div className="rounded-[24px] border border-stone-200 bg-stone-50/80 p-4">
            <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-stone-400">
              Pending Withdrawal
            </div>
            <div className="mt-3 text-xl font-semibold text-stone-900">
              {isPending ? <MetricSkeleton /> : formatTokenAmount(data?.totalPendingWithdrawal)}
            </div>
          </div>
          <div className="rounded-[24px] border border-stone-200 bg-stone-50/80 p-4">
            <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-stone-400">
              Pending Count
            </div>
            <div className="mt-3 text-xl font-semibold text-stone-900">
              {isPending ? <MetricSkeleton /> : data?.nPendingWithdrawals ?? "--"}
            </div>
          </div>

          {error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 md:col-span-2 xl:col-span-4">
              {error.message}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </section>
  );
}
