# @bunstack/hooks

React hooks for the local workspace.

## Workspace usage

This package is intended for source-first usage inside the monorepo. Consumers should reference it with `"workspace:*"` and let the app bundler resolve the TypeScript source.

## Tests

```bash
bun run --cwd packages/hooks test
```
