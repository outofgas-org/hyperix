import { useMaxBuilderFee } from "@hyperix/hooks";
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

const EXAMPLES = [
  {
    label: "Zero / Zero",
    user: "0x0000000000000000000000000000000000000000",
    builder: "0x0000000000000000000000000000000000000000",
  },
  {
    label: "Alice / Zero",
    user: "0x1111111111111111111111111111111111111111",
    builder: "0x0000000000000000000000000000000000000000",
  },
  {
    label: "Alice / Bob",
    user: "0x1111111111111111111111111111111111111111",
    builder: "0x2222222222222222222222222222222222222222",
  },
] as const;

const FEE_FORMATTER = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 4,
});

function isAddress(value: string): value is `0x${string}` {
  return /^0x[a-fA-F0-9]{40}$/.test(value);
}

function formatFee(value: number | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "--";
  }

  return `${FEE_FORMATTER.format(value)} bps`;
}

export function MaxBuilderFeeDemo() {
  const [userInput, setUserInput] = useState(EXAMPLES[0].user);
  const [builderInput, setBuilderInput] = useState(EXAMPLES[0].builder);
  const user = isAddress(userInput) ? userInput : undefined;
  const builder = isAddress(builderInput) ? builderInput : undefined;
  const { data, isPending, error, isFetched } = useMaxBuilderFee(
    user ?? EXAMPLES[0].user,
    builder ?? EXAMPLES[0].builder,
    {
      enabled: Boolean(user && builder),
    },
  );

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">Max Builder Fee</h2>
        <p className="text-sm text-gray-500">
          Query demo for <code>useMaxBuilderFee</code>, checking the max
          approved builder fee between a user wallet and builder wallet.
        </p>
      </div>

      <Card className={`${DEMO_CARD_CLASS_NAME} text-[#183242]`}>
        <CardHeader className={DEMO_CARD_HEADER_CLASS_NAME}>
          <div className="space-y-4">
            <div className="space-y-2">
              <CardTitle className={DEMO_CARD_TITLE_CLASS_NAME}>
                User Address
              </CardTitle>
              <Input
                className={DEMO_CARD_INPUT_CLASS_NAME}
                onChange={(event) => {
                  setUserInput(event.target.value);
                }}
                placeholder="0x..."
                value={userInput}
              />
            </div>
            <div className="space-y-2">
              <CardTitle className={DEMO_CARD_TITLE_CLASS_NAME}>
                Builder Address
              </CardTitle>
              <Input
                className={DEMO_CARD_INPUT_CLASS_NAME}
                onChange={(event) => {
                  setBuilderInput(event.target.value);
                }}
                placeholder="0x..."
                value={builderInput}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {EXAMPLES.map((example) => (
                <Button
                  key={example.label}
                  className="h-8 rounded-full px-3 text-xs"
                  onClick={() => {
                    setUserInput(example.user);
                    setBuilderInput(example.builder);
                  }}
                  type="button"
                  variant="outline"
                >
                  {example.label}
                </Button>
              ))}
            </div>
          </div>
          <div
            className={`${DEMO_CARD_STATUS_CLASS_NAME} flex items-center justify-between gap-4`}
          >
            <span>
              {user && builder
                ? "Checking approved max builder fee for this wallet pair."
                : "Enter valid 42-character hex addresses for both user and builder wallets."}
            </span>
            <span>
              {isPending ? "Loading..." : isFetched ? "Fetched" : "Idle"}
            </span>
          </div>
        </CardHeader>

        <CardContent className="grid gap-4 p-6 md:grid-cols-3">
          <div className="rounded-[24px] border border-stone-200 bg-stone-50/80 p-4">
            <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-stone-400">
              User
            </div>
            <div className="mt-2 break-all font-mono text-sm text-stone-900">
              {userInput || "--"}
            </div>
          </div>
          <div className="rounded-[24px] border border-stone-200 bg-stone-50/80 p-4">
            <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-stone-400">
              Builder
            </div>
            <div className="mt-2 break-all font-mono text-sm text-stone-900">
              {builderInput || "--"}
            </div>
          </div>
          <div className="rounded-[24px] border border-stone-200 bg-stone-50/80 p-4">
            <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-stone-400">
              Max Fee
            </div>
            <div className="mt-2 font-mono text-xl text-stone-900">
              {isPending ? <Skeleton className="h-7 w-24" /> : formatFee(data)}
            </div>
          </div>

          {error ? (
            <div className="md:col-span-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error.message}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </section>
  );
}
