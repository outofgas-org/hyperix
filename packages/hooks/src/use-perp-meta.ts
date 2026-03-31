import { useMemo } from "react";
import type { AllPerpMetasData } from "./use-all-perp-metas.js";
import {
  useAllPerpMetas,
  type UseAllPerpMetasOptions,
} from "./use-all-perp-metas.js";

export type PerpMeta = AllPerpMetasData[number]["universe"][number];

export function usePerpMeta(coin: string, options: UseAllPerpMetasOptions = {}) {
  const allPerpMetasState = useAllPerpMetas(options);

  const data = useMemo<PerpMeta | undefined>(() => {
    const universes = allPerpMetasState.data?.flatMap((perpMeta) => perpMeta.universe) ?? [];
    return universes.find((universe) => universe.name === coin);
  }, [coin, allPerpMetasState.data]);

  return {
    ...allPerpMetasState,
    data,
  };
}
