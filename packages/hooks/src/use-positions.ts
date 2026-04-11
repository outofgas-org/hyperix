import type { UseSubscribeState } from "@outofgas/react-stream";
import { useMemo } from "react";
import {
  type AllDexsClearingHouseStateData,
  type UseAllDexsClearingHouseStateOptions,
  useAllDexsClearingHouseState,
} from "./use-all-dexs-clearing-house-state.js";

export type Position =
  AllDexsClearingHouseStateData["clearinghouseStates"][number][1]["assetPositions"][number];

export function usePositions(
  user: `0x${string}`,
  options: UseAllDexsClearingHouseStateOptions = {},
): UseSubscribeState<Position[]> {
  const positionsState = useAllDexsClearingHouseState(user, options);

  const data = useMemo<Position[] | undefined>(() => {
    return positionsState.data?.clearinghouseStates
      .flatMap(([, state]) => state.assetPositions)
      .sort((left, right) =>
        Number(left.position.positionValue) <
        Number(right.position.positionValue)
          ? 1
          : -1,
      );
  }, [positionsState.data]);

  return {
    ...positionsState,
    data,
  };
}
