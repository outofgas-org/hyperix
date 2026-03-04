# @bunstack/hooks

React hooks for the local workspace.

## Workspace usage

This package is intended for source-first usage inside the monorepo. Consumers should reference it with `"workspace:*"` and let the app bundler resolve the TypeScript source.

## Example

```tsx
import { useState } from "react";
import { useDebouncedValue } from "@bunstack/hooks";

function Search() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 300);

  return <input value={query} onChange={(e) => setQuery(e.target.value)} />;
}
```

## Tests

```bash
bun run --cwd packages/hooks test
```
