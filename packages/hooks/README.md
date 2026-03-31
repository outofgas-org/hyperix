# @bunstack/hooks

React hooks for the local workspace.

## Workspace usage

This package is intended for source-first usage inside the monorepo. Consumers should reference it with `"workspace:*"` and let the app bundler resolve the TypeScript source.

## Demo

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { usePortfolio } from "@hyperix/hooks";

const queryClient = new QueryClient();

function PortfolioDemo() {
  const { data, isPending, error } = usePortfolio("0x1234567890abcdef1234567890abcdef12345678");

  if (isPending) {
    return <div>Loading portfolio...</div>;
  }

  if (error) {
    return <div>Failed to load portfolio: {error.message}</div>;
  }

  const perpDay = data?.find(([period]) => period === "perpDay")?.[1];
  const latestPnl = Number(perpDay?.pnlHistory.at(-1)?.[1] ?? 0);

  return <pre>{JSON.stringify({ latestPnl, periods: data?.map(([period]) => period) }, null, 2)}</pre>;
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <PortfolioDemo />
    </QueryClientProvider>
  );
}
```

## Tests

```bash
bun run --cwd packages/hooks test
```
