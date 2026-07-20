import type { ConsentDecision } from "#/core/consent";
import { isConsentDecision } from "#/core/consent";

/**
 * Which consent event a receipt records. Receipts are append-only: an `update` or
 * `withdraw` is a new receipt referencing the prior one, never a mutation.
 *
 * @since 1.0.0-canary.7
 */
export type ConsentReceiptEventType = "give" | "update" | "withdraw";

/**
 * How the decision was expressed — the "how" dimension a demonstrable-consent record must
 * capture (GDPR Art. 7(1); EDPB 05/2020 §5.1). See spec/spec-consent-receipts.md.
 *
 * @since 1.0.0-canary.7
 */
export type ConsentReceiptMethod = "banner-accept" | "banner-reject" | "granular" | "gpc-signal" | "withdrawal";

/**
 * What kind of identifier links the receipt to a subject. A cookie-only visitor uses a
 * pseudonymous `cookie` id — the receipt is still valid proof.
 *
 * @since 1.0.0-canary.7
 */
export type ConsentReceiptSubjectIdType = "cookie" | "email-hash" | "userId";

/**
 * The caller-supplied fields of a consent receipt. Deliberately carries **no IP** — the
 * server derives a coarsened one from the connection so a full IP never transits the body.
 *
 * @since 1.0.0-canary.7
 */
export interface ConsentReceiptInput {
  decision: ConsentDecision;
  eventType: ConsentReceiptEventType;
  method: ConsentReceiptMethod;
  /** BCP-47 language of the notice the subject was shown. */
  noticeLanguage: string;
  /** Version the stored notice snapshot resolves to — EDPB para 108's "copy of the information presented". */
  noticeVersion: string;
  policyVersion: string;
  subjectId: string;
  subjectIdType: ConsentReceiptSubjectIdType;
  /** The prior receipt this update/withdrawal supersedes — the append-only chain link. */
  supersedesReceiptId?: string | undefined;
}

/**
 * A stored consent receipt: the caller input plus server-derived fields. This is the
 * legally-authoritative record of proof — the client `ConsentRecord` is only a runtime
 * cache (spec-consent-receipts §5).
 *
 * @remarks
 * The record is append-only; never mutate a stored receipt. `ipCoarse` is truncated at
 * write time and MUST NOT be a full IP.
 *
 * @since 1.0.0-canary.7
 */
export interface ConsentReceipt extends ConsentReceiptInput {
  /** Coarsened/pseudonymized IP, or absent — never a full address. */
  ipCoarse?: string | undefined;
  /** Optional tamper-evidence signature, present only when a signer was supplied. */
  integrityKey?: string | undefined;
  receiptId: string;
  schemaVersion: string;
  /** Milliseconds since the Unix epoch, from the server clock. */
  timestamp: number;
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

const RECEIPT_METHODS: ReadonlySet<ConsentReceiptMethod> = new Set([
  "banner-accept",
  "banner-reject",
  "granular",
  "gpc-signal",
  "withdrawal",
]);

const RECEIPT_SUBJECT_ID_TYPES: ReadonlySet<ConsentReceiptSubjectIdType> = new Set(["cookie", "email-hash", "userId"]);

/**
 * Guards a receipt input received from an untrusted client. Rejects a body carrying an
 * `ip`/`ipCoarse` field so a full address can never be persisted from caller input.
 *
 * @since 1.0.0-canary.7
 */
export function isConsentReceiptInput(value: unknown): value is ConsentReceiptInput {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const input = value as Record<string, unknown>;

  // A client MUST NOT supply IP — the server derives it. Presence is an integrity red flag.
  if ("ip" in input || "ipCoarse" in input) {
    return false;
  }

  return (
    isConsentDecision(input.decision) &&
    (input.eventType === "give" || input.eventType === "update" || input.eventType === "withdraw") &&
    isString(input.method) &&
    RECEIPT_METHODS.has(input.method as ConsentReceiptMethod) &&
    isString(input.noticeLanguage) &&
    isString(input.noticeVersion) &&
    isString(input.policyVersion) &&
    isString(input.subjectId) &&
    isString(input.subjectIdType) &&
    RECEIPT_SUBJECT_ID_TYPES.has(input.subjectIdType as ConsentReceiptSubjectIdType)
  );
}
