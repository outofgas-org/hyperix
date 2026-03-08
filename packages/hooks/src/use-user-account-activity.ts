import { useMemo } from "react";
import {
  type UseUserNonFundingLedgerUpdatesOptions,
  type UserNonFundingLedgerUpdate,
  useUserNonFundingLedgerUpdates,
} from "./use-user-non-funding-ledger-updates.js";

export type UserAccountActivityStatus = "Completed" | "Triggered";
export type UserAccountActivityDirection = "in" | "out" | "neutral";

export type UserAccountActivityAmount = {
  value: string | null;
  numericValue: number | null;
  token: string | null;
  displayValue: string;
  direction: UserAccountActivityDirection;
};

export type UserAccountActivityFee = {
  value: string | null;
  numericValue: number | null;
  token: string | null;
  displayValue: string;
};

export type UserAccountActivity = UserNonFundingLedgerUpdate & {
  status: UserAccountActivityStatus;
  action: string;
  source: string;
  destination: string;
  explorerUrl: string;
  amount: UserAccountActivityAmount;
  fee: UserAccountActivityFee;
};

export type UserAccountActivityData = {
  user: `0x${string}`;
  activity: UserAccountActivity[];
  nonFundingLedgerUpdates: UserNonFundingLedgerUpdate[];
};

function isSameAddress(
  left: `0x${string}` | undefined,
  right: `0x${string}` | undefined
): boolean {
  return Boolean(left && right && left.toLowerCase() === right.toLowerCase());
}

function isSystemAddress(address: string): boolean {
  const normalized = address.toLowerCase();
  const hypeAddress = "0x2222222222222222222222222222222222222222";

  if (normalized === hypeAddress) {
    return true;
  }

  if (!/^0x[0-9a-f]{40}$/.test(normalized)) {
    return false;
  }

  const bytes = normalized.slice(2);
  if (!bytes.startsWith("20")) {
    return false;
  }

  return bytes.slice(2, 38) === "0".repeat(36);
}

function formatDisplayValue(
  value: string | null,
  token: string | null,
  direction: UserAccountActivityDirection = "neutral"
): string {
  if (!value || Number(value) === 0) {
    return "--";
  }

  const prefix = direction === "in" ? "+" : direction === "out" ? "-" : "";
  return `${prefix}${value} ${token ?? ""}`.trim();
}

function getExplorerUrl(entry: UserNonFundingLedgerUpdate): string {
  return entry.delta.type === "deposit" || entry.delta.type === "withdraw"
    ? `https://arbiscan.io/tx/${entry.hash}`
    : `https://app.hyperliquid.xyz/explorer/tx/${entry.hash}`;
}

function getStatus(
  entry: UserNonFundingLedgerUpdate
): UserAccountActivityStatus {
  return entry.delta.type === "liquidation" ? "Triggered" : "Completed";
}

function getAction(entry: UserNonFundingLedgerUpdate): string {
  switch (entry.delta.type) {
    case "deposit":
      return "Deposit";
    case "withdraw":
      return "Withdrawal";
    case "internalTransfer":
      return "Send";
    case "spotTransfer":
      return isSystemAddress(entry.delta.destination) || isSystemAddress(entry.delta.user)
        ? "Transfer"
        : "Send";
    case "send":
      if (isSystemAddress(entry.delta.destination) || isSystemAddress(entry.delta.user)) {
        return "Transfer";
      }
      if (entry.delta.sourceDex === "spot" && entry.delta.destinationDex === "spot") {
        return "Send";
      }
      if (entry.delta.sourceDex === "spot" || entry.delta.destinationDex === "spot") {
        return "Transfer";
      }
      return "Send";
    case "accountClassTransfer":
    case "subAccountTransfer":
    case "cStakingTransfer":
      return "Transfer";
    case "vaultCreate":
      return "Vault Create";
    case "vaultDeposit":
      return "Vault Deposit";
    case "vaultDistribution":
      return "Vault Distribution";
    case "vaultWithdraw":
      return "Vault Withdraw";
    case "liquidation":
      return "Liquidation";
    case "rewardsClaim":
      return "Claim";
    case "deployGasAuction":
      return "Gas Auction";
    case "borrowLend":
      return entry.delta.operation === "supply"
        ? "Supply"
        : entry.delta.operation === "withdraw"
        ? "Withdraw"
        : entry.delta.operation === "borrow"
        ? "Borrow"
        : "Repay";
    case "spotGenesis":
      return "Genesis";
    case "activateDexAbstraction":
      return "Activate";
  }
}

function formatDexLabel(dex: string): string {
  if (dex === "spot") return "Spot";
  if (dex === "" || dex === "perp") return "Perps";
  return `Perps (${dex})`;
}

function getSource(entry: UserNonFundingLedgerUpdate): string {
  switch (entry.delta.type) {
    case "deposit":
      return "Arbitrum";
    case "withdraw":
      return "Perps";
    case "accountClassTransfer":
      return entry.delta.toPerp ? "Spot" : "Perps";
    case "spotTransfer":
      return isSystemAddress(entry.delta.user) ? "HyperEVM" : "Spot";
    case "subAccountTransfer":
      return "Perps";
    case "send":
      return isSystemAddress(entry.delta.user)
        ? "HyperEVM"
        : formatDexLabel(entry.delta.sourceDex);
    case "internalTransfer":
      return "Perps";
    case "cStakingTransfer":
      return entry.delta.isDeposit ? "Spot" : "Staking";
    case "vaultCreate":
      return "Perps";
    case "vaultDeposit":
      return "Wallet";
    case "vaultDistribution":
      return "Vault";
    case "vaultWithdraw":
      return "Vault";
    case "rewardsClaim":
      return "Rewards";
    case "liquidation":
      return entry.delta.leverageType;
    case "deployGasAuction":
      return "Wallet";
    case "borrowLend":
      return "Borrow/Lend";
    case "spotGenesis":
      return "Genesis";
    case "activateDexAbstraction":
      return "Wallet";
  }
}

function getDestination(entry: UserNonFundingLedgerUpdate): string {
  switch (entry.delta.type) {
    case "deposit":
      return "Perps";
    case "withdraw":
      return "Arbitrum";
    case "accountClassTransfer":
      return entry.delta.toPerp ? "Perps" : "Spot";
    case "spotTransfer":
      return isSystemAddress(entry.delta.destination) ? "HyperEVM" : "Spot";
    case "subAccountTransfer":
      return "Perps";
    case "send":
      return isSystemAddress(entry.delta.destination) ? "HyperEVM" : formatDexLabel(entry.delta.destinationDex);
    case "internalTransfer":
      return "Perps";
    case "cStakingTransfer":
      return entry.delta.isDeposit ? "Staking" : "Spot";
    case "vaultCreate":
      return "Vault";
    case "vaultDeposit":
      return "Vault";
    case "vaultDistribution":
      return "Wallet";
    case "vaultWithdraw":
      return "Wallet";
    case "rewardsClaim":
      return entry.delta.token;
    case "liquidation":
      return "System";
    case "deployGasAuction":
      return entry.delta.token;
    case "borrowLend":
      return entry.delta.token;
    case "spotGenesis":
      return entry.delta.token;
    case "activateDexAbstraction":
      return entry.delta.dex;
  }
}

function getAmount(
  entry: UserNonFundingLedgerUpdate,
  user: `0x${string}`
): UserAccountActivityAmount {
  switch (entry.delta.type) {
    case "deposit":
      return {
        value: entry.delta.usdc,
        numericValue: Number(entry.delta.usdc),
        token: "USDC",
        direction: "in",
        displayValue: formatDisplayValue(entry.delta.usdc, "USDC", "in"),
      };
    case "withdraw":
      return {
        value: entry.delta.usdc,
        numericValue: -Number(entry.delta.usdc),
        token: "USDC",
        direction: "out",
        displayValue: formatDisplayValue(entry.delta.usdc, "USDC", "out"),
      };
    case "accountClassTransfer": {
      const direction = entry.delta.toPerp ? "in" : "out";
      const numericValue =
        Number(entry.delta.usdc) * (direction === "in" ? 1 : -1);
      return {
        value: entry.delta.usdc,
        numericValue,
        token: "USDC",
        direction,
        displayValue: formatDisplayValue(entry.delta.usdc, "USDC", direction),
      };
    }
    case "internalTransfer": {
      const isInbound = isSameAddress(entry.delta.destination, user);
      const direction = isInbound ? "in" : "out";
      const gross = Number(entry.delta.usdc);
      const numericValue = isInbound
        ? gross
        : -(gross - Number(entry.delta.fee || "0"));
      return {
        value: isInbound
          ? entry.delta.usdc
          : (gross - Number(entry.delta.fee || "0")).toString(),
        numericValue,
        token: "USDC",
        direction,
        displayValue: formatDisplayValue(
          isInbound
            ? entry.delta.usdc
            : (gross - Number(entry.delta.fee || "0")).toString(),
          "USDC",
          direction
        ),
      };
    }
    case "spotTransfer": {
      const isInbound = isSameAddress(entry.delta.destination, user);
      const direction = isInbound ? "in" : "out";
      const value = entry.delta.usdcValue;
      return {
        value,
        numericValue: Number(value) * (isInbound ? 1 : -1),
        token: "USDC",
        direction,
        displayValue: formatDisplayValue(value, "USDC", direction),
      };
    }
    case "subAccountTransfer": {
      const isInbound = isSameAddress(entry.delta.destination, user);
      const direction = isInbound ? "in" : "out";
      return {
        value: entry.delta.usdc,
        numericValue: Number(entry.delta.usdc) * (isInbound ? 1 : -1),
        token: "USDC",
        direction,
        displayValue: formatDisplayValue(entry.delta.usdc, "USDC", direction),
      };
    }
    case "send": {
      const isInbound = isSameAddress(entry.delta.destination, user);
      const direction = isInbound ? "in" : "out";
      return {
        value: entry.delta.usdcValue,
        numericValue: Number(entry.delta.usdcValue) * (isInbound ? 1 : -1),
        token: "USDC",
        direction,
        displayValue: formatDisplayValue(
          entry.delta.usdcValue,
          "USDC",
          direction
        ),
      };
    }
    case "cStakingTransfer": {
      const direction = entry.delta.isDeposit ? "out" : "in";
      return {
        value: entry.delta.amount,
        numericValue:
          Number(entry.delta.amount) * (direction === "in" ? 1 : -1),
        token: entry.delta.token,
        direction,
        displayValue: formatDisplayValue(
          entry.delta.amount,
          entry.delta.token,
          direction
        ),
      };
    }
    case "vaultCreate": {
      const netValue =
        Number(entry.delta.usdc) - Number(entry.delta.fee || "0");
      return {
        value: netValue.toString(),
        numericValue: -netValue,
        token: "USDC",
        direction: "out",
        displayValue: formatDisplayValue(netValue.toString(), "USDC", "out"),
      };
    }
    case "vaultDeposit":
      return {
        value: entry.delta.usdc,
        numericValue: -Number(entry.delta.usdc),
        token: "USDC",
        direction: "out",
        displayValue: formatDisplayValue(entry.delta.usdc, "USDC", "out"),
      };
    case "vaultDistribution":
      return {
        value: entry.delta.usdc,
        numericValue: Number(entry.delta.usdc),
        token: "USDC",
        direction: "in",
        displayValue: formatDisplayValue(entry.delta.usdc, "USDC", "in"),
      };
    case "vaultWithdraw":
      return {
        value: entry.delta.netWithdrawnUsd,
        numericValue: Number(entry.delta.netWithdrawnUsd),
        token: "USDC",
        direction: "in",
        displayValue: formatDisplayValue(
          entry.delta.netWithdrawnUsd,
          "USDC",
          "in"
        ),
      };
    case "rewardsClaim":
      return {
        value: entry.delta.amount,
        numericValue: Number(entry.delta.amount),
        token: entry.delta.token,
        direction: "in",
        displayValue: formatDisplayValue(
          entry.delta.amount,
          entry.delta.token,
          "in"
        ),
      };
    case "liquidation":
      return {
        value: entry.delta.accountValue,
        numericValue: Number(entry.delta.accountValue),
        token: "USDC",
        direction: "neutral",
        displayValue: formatDisplayValue(
          entry.delta.accountValue,
          "USDC",
          "neutral"
        ),
      };
    case "deployGasAuction":
      return {
        value: entry.delta.amount,
        numericValue: -Number(entry.delta.amount),
        token: entry.delta.token,
        direction: "out",
        displayValue: formatDisplayValue(
          entry.delta.amount,
          entry.delta.token,
          "out"
        ),
      };
    case "borrowLend": {
      const direction =
        entry.delta.operation === "supply" || entry.delta.operation === "repay"
          ? "out"
          : "in";
      return {
        value: entry.delta.amount,
        numericValue:
          Number(entry.delta.amount) * (direction === "in" ? 1 : -1),
        token: entry.delta.token,
        direction,
        displayValue: formatDisplayValue(
          entry.delta.amount,
          entry.delta.token,
          direction
        ),
      };
    }
    case "spotGenesis": {
      const numericValue = Number(entry.delta.amount);
      const direction = numericValue >= 0 ? "in" : "out";
      return {
        value: entry.delta.amount.replace(/^-/, ""),
        numericValue,
        token: entry.delta.token,
        direction,
        displayValue: formatDisplayValue(
          entry.delta.amount.replace(/^-/, ""),
          entry.delta.token,
          direction
        ),
      };
    }
    case "activateDexAbstraction":
      return {
        value: entry.delta.amount,
        numericValue: -Number(entry.delta.amount),
        token: entry.delta.token,
        direction: "out",
        displayValue: formatDisplayValue(
          entry.delta.amount,
          entry.delta.token,
          "out"
        ),
      };
  }
}

function getFee(entry: UserNonFundingLedgerUpdate): UserAccountActivityFee {
  switch (entry.delta.type) {
    case "internalTransfer":
      return {
        value: entry.delta.fee,
        numericValue: Number(entry.delta.fee),
        token: "USDC",
        displayValue: formatDisplayValue(entry.delta.fee, "USDC"),
      };
    case "spotTransfer":
      if (Number(entry.delta.fee) !== 0) {
        return {
          value: entry.delta.fee,
          numericValue: Number(entry.delta.fee),
          token: entry.delta.feeToken,
          displayValue: formatDisplayValue(
            entry.delta.fee,
            entry.delta.feeToken
          ),
        };
      }

      if (Number(entry.delta.nativeTokenFee) !== 0) {
        return {
          value: entry.delta.nativeTokenFee,
          numericValue: Number(entry.delta.nativeTokenFee),
          token: "HYPE",
          displayValue: formatDisplayValue(entry.delta.nativeTokenFee, "HYPE"),
        };
      }

      return {
        value: null,
        numericValue: null,
        token: null,
        displayValue: "--",
      };
    case "send":
      if (Number(entry.delta.fee) !== 0) {
        return {
          value: entry.delta.fee,
          numericValue: Number(entry.delta.fee),
          token: entry.delta.feeToken,
          displayValue: formatDisplayValue(
            entry.delta.fee,
            entry.delta.feeToken
          ),
        };
      }

      if (Number(entry.delta.nativeTokenFee) !== 0) {
        return {
          value: entry.delta.nativeTokenFee,
          numericValue: Number(entry.delta.nativeTokenFee),
          token: "HYPE",
          displayValue: formatDisplayValue(entry.delta.nativeTokenFee, "HYPE"),
        };
      }

      return {
        value: null,
        numericValue: null,
        token: null,
        displayValue: "--",
      };
    case "vaultCreate":
      return {
        value: entry.delta.fee,
        numericValue: Number(entry.delta.fee),
        token: "USDC",
        displayValue: formatDisplayValue(entry.delta.fee, "USDC"),
      };
    case "vaultWithdraw": {
      const totalFee =
        Number(entry.delta.commission) +
        Number(entry.delta.closingCost) +
        Number(entry.delta.basis);
      if (totalFee === 0) {
        return {
          value: null,
          numericValue: null,
          token: null,
          displayValue: "--",
        };
      }

      return {
        value: totalFee.toString(),
        numericValue: totalFee,
        token: "USDC",
        displayValue: formatDisplayValue(totalFee.toString(), "USDC"),
      };
    }
    case "withdraw":
      return {
        value: entry.delta.fee,
        numericValue: Number(entry.delta.fee),
        token: "USDC",
        displayValue:
          Number(entry.delta.fee) === 0
            ? "--"
            : formatDisplayValue(entry.delta.fee, "USDC"),
      };
    default:
      return {
        value: null,
        numericValue: null,
        token: null,
        displayValue: "--",
      };
  }
}

function formatUserAccountActivity(
  entry: UserNonFundingLedgerUpdate,
  user: `0x${string}`
): UserAccountActivity {
  return {
    ...entry,
    status: getStatus(entry),
    action: getAction(entry),
    source: getSource(entry),
    destination: getDestination(entry),
    explorerUrl: getExplorerUrl(entry),
    amount: getAmount(entry, user),
    fee: getFee(entry),
  };
}

export function useUserAccountActivity(
  user: `0x${string}`,
  options: UseUserNonFundingLedgerUpdatesOptions = {}
) {
  const userNonFundingLedgerUpdatesState = useUserNonFundingLedgerUpdates(
    user,
    options
  );

  const data = useMemo<UserAccountActivityData | undefined>(() => {
    if (!userNonFundingLedgerUpdatesState.data) {
      return undefined;
    }

    return {
      user: userNonFundingLedgerUpdatesState.data.user,
      nonFundingLedgerUpdates:
        userNonFundingLedgerUpdatesState.data.nonFundingLedgerUpdates,
      activity:
        userNonFundingLedgerUpdatesState.data.nonFundingLedgerUpdates.map(
          (entry) => formatUserAccountActivity(entry, user)
        ),
    };
  }, [user, userNonFundingLedgerUpdatesState.data]);

  return {
    ...userNonFundingLedgerUpdatesState,
    data,
  };
}
