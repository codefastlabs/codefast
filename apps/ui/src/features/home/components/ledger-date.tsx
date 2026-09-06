import type { ComponentProps } from "react";

// A fixed locale and zone, so the server render and the client agree on the label.
const LEDGER_DATE = new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "UTC" });

interface LedgerDateProps extends Omit<ComponentProps<"time">, "children" | "dateTime"> {
  /** An ISO day, `2026-09-01`. */
  readonly date: string;
}

/** A ledger day as a readable label, kept machine-readable on the element. */
export function LedgerDate({ date, ...props }: LedgerDateProps) {
  return (
    <time dateTime={date} {...props}>
      {LEDGER_DATE.format(new Date(`${date}T00:00:00Z`))}
    </time>
  );
}
