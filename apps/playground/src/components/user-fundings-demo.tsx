import { type UserFunding, useUserFundings } from "@hyperix/hooks";
import { useState } from "react";
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

const NUMBER_FORMATTER = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 8,
});

const VALUE_FORMATTER = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 6,
});

const DEFAULT_ADDRESS = "0x0000000000000000000000000000000000000000";

function isAddress(value: string): value is `0x${string}` {
  return /^0x[a-fA-F0-9]{40}$/.test(value);
}

function formatSignedValue(value: string) {
  const numericValue = Number(value);
  const prefix = numericValue > 0 ? "+" : "";
  return `${prefix}${VALUE_FORMATTER.format(numericValue)}`;
}

function FundingRow({ funding }: { funding: UserFunding }) {
  const fundingValue = Number(funding.usdc);
  const positionSize = Number(funding.szi);

  return (
    <div className="grid grid-cols-6 gap-2 rounded-xl px-2 py-1 even:bg-gray-50">
      <div className="min-w-0">
        <div
          className={fundingValue >= 0 ? "text-emerald-600" : "text-rose-600"}
        >
          {funding.coin}
        </div>
        <div className="truncate text-[11px] text-gray-400">
          {funding.nSamples === null
            ? "Live update"
            : `${funding.nSamples} samples`}
        </div>
      </div>
      <span
        className={`text-right ${fundingValue >= 0 ? "text-emerald-600" : "text-rose-600"}`}
      >
        {formatSignedValue(funding.usdc)} USDC
      </span>
      <span className="text-right text-gray-700">
        {NUMBER_FORMATTER.format(positionSize)}
      </span>
      <span className="text-right text-gray-700">
        {VALUE_FORMATTER.format(Number(funding.fundingRate))}
      </span>
      <span className="text-right text-gray-700">
        {funding.nSamples === null ? "Realtime" : funding.nSamples}
      </span>
      <span className="text-right text-gray-500">
        {formatDate(funding.time)}
      </span>
    </div>
  );
}

export function UserFundingsDemo() {
  const [input, setInput] = useState(DEFAULT_ADDRESS);
  const address = isAddress(input) ? input : undefined;
  const { data, loading, error } = useUserFundings(address ?? DEFAULT_ADDRESS, {
    enabled: Boolean(address),
  });
  const fundings = data?.fundings ?? [];

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">User Fundings</h2>
        <p className="text-sm text-gray-500">
          Funding payment ledger streamed from <code>useUserFundings</code>.
        </p>
      </div>

      <Card className={DEMO_CARD_CLASS_NAME}>
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
          <div className={DEMO_CARD_STATUS_CLASS_NAME}>
            {address
              ? `Subscribed to ${address}`
              : "Enter a valid 42-character hex wallet address to start the subscription."}
          </div>
        </CardHeader>

        <CardContent className="space-y-2 p-6 font-mono text-xs">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-700">Ledger</h3>
            <span className="text-gray-500">
              {data
                ? `${fundings.length} entries`
                : loading
                  ? "Loading..."
                  : "Idle"}
            </span>
          </div>
          <div className="grid grid-cols-6 gap-2 text-gray-500">
            <span>Market</span>
            <span className="text-right">USDC</span>
            <span className="text-right">Position</span>
            <span className="text-right">Funding Rate</span>
            <span className="text-right">Samples</span>
            <span className="text-right">Time</span>
          </div>
          {error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-rose-700">
              {error}
            </div>
          ) : !address || (!data && loading) ? (
            <div className="space-y-1">
              <Skeleton />
              <Skeleton />
              <Skeleton />
            </div>
          ) : fundings.length === 0 ? (
            <div className="rounded-xl bg-gray-50 px-3 py-2 text-gray-500">
              No funding entries yet.
            </div>
          ) : (
            <div className="h-72 space-y-1 overflow-y-auto">
              {fundings.map((funding) => (
                <FundingRow
                  key={`${funding.time}-${funding.coin}-${funding.usdc}-${funding.fundingRate}`}
                  funding={funding}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
