export type ConsentRegion = "eu" | "other" | "us" | "vn";

export type ConsentMode = "opt-in" | "opt-out";

/**
 * GDPR (EU) and Nghị định 13/2023 (VN) require explicit opt-in before any non-essential
 * tracking; CCPA/CPRA (US) defaults to opt-out instead. There is no single global default
 * that satisfies both, so the mode is resolved per region.
 */
export function resolveConsentMode(region: ConsentRegion): ConsentMode {
  switch (region) {
    case "eu":
    case "vn": {
      return "opt-in";
    }

    case "other":
    case "us": {
      return "opt-out";
    }
  }
}

/**
 * Under CCPA/CPRA, a Global Privacy Control signal must be honored as an opt-out even
 * though the region default is opt-out. Under opt-in regions, tracking never starts
 * until consent is explicitly granted, GPC signal or not.
 */
export function shouldTrackByDefault(mode: ConsentMode, hasGlobalPrivacyControlSignal: boolean): boolean {
  if (mode === "opt-in") {
    return false;
  }

  return !hasGlobalPrivacyControlSignal;
}

export type ConsentDecision = "denied" | "granted";

/**
 * NĐ 13/2023 and GDPR both expect a record of *when* and *under what policy* consent
 * was given, not just a yes/no flag — `policyVersion` lets a later policy change
 * invalidate stale consent.
 */
export interface ConsentRecord {
  decision: ConsentDecision;
  policyVersion: string;
  timestamp: number;
}

/**
 * Persistence backend for the visitor's consent decision — mirrors `EventQueueStorage`
 * so a non-browser environment can swap in its own implementation.
 */
export interface ConsentStorage {
  clear: () => void;
  load: () => ConsentRecord | undefined;
  save: (record: ConsentRecord) => void;
}
