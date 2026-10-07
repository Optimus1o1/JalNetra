import { StorageBalanceResult } from "./types";

export interface StorageBalanceInput {
  previousStorageL: number;
  inflowL: number;
  reuseWithdrawalL: number;
  rechargeInfiltrationL: number;
  lossesL?: number;
  tankCapacityL: number;
}

/**
 * Computes deterministic mass-balance for water storage.
 * Enforces Physical Invariants:
 * 1. Storage >= 0
 * 2. Storage <= Tank Capacity
 * 3. Inflow - Outflows - StorageDelta = Overflow
 */
export function computeStorageMassBalance(input: StorageBalanceInput): StorageBalanceResult {
  const capacity = Math.max(0, input.tankCapacityL);
  const prevStorage = Math.min(capacity, Math.max(0, input.previousStorageL));
  const inflow = Math.max(0, input.inflowL);
  const losses = Math.max(0, input.lossesL ?? 0);

  // Available water prior to withdrawals
  const totalWaterInSystem = prevStorage + inflow;

  // Maximum water available to satisfy demand and recharge
  const waterAvailableForDischarge = Math.max(0, totalWaterInSystem - losses);

  // Actual reuse withdrawal cannot exceed available water
  const actualReuse = Math.min(waterAvailableForDischarge, Math.max(0, input.reuseWithdrawalL));
  const remainingAfterReuse = waterAvailableForDischarge - actualReuse;

  // Actual recharge cannot exceed remaining available water
  const actualRecharge = Math.min(remainingAfterReuse, Math.max(0, input.rechargeInfiltrationL));
  const remainingBeforeCap = remainingAfterReuse - actualRecharge;

  // Storage is bounded by physical tank capacity
  const currentStorage = Math.min(capacity, remainingBeforeCap);

  // Overflow occurs when remaining volume exceeds physical tank capacity
  const overflow = Math.max(0, remainingBeforeCap - capacity);

  const fillPercentage = capacity > 0 ? Number(((currentStorage / capacity) * 100).toFixed(1)) : 0;
  const storageHeadroomL = Math.max(0, capacity - currentStorage);

  return {
    previousStorageL: prevStorage,
    inflowL: inflow,
    reuseWithdrawalL: actualReuse,
    rechargeInfiltrationL: actualRecharge,
    lossesL: losses,
    currentStorageL: currentStorage,
    overflowL: overflow,
    tankCapacityL: capacity,
    fillPercentage,
    storageHeadroomL,
    provenance: "SIMULATED",
  };
}
