# @hyperix/core

Shared Hyperliquid core helpers used by the local workspace.

## Workspace usage

This package is wired for source-first development inside the monorepo:

- `main` and `types` point to `src/index.ts`
- consuming apps should depend on it with `"workspace:*"`
- no local build step is required during development

## Example

```ts
import { getPortfolio } from "@hyperix/core";

const data = await getPortfolio({
  user: "0x0000000000000000000000000000000000000000",
});
```

## Tests

```bash
bun run --cwd packages/core test
```
