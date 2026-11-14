import type { AuditScan, Detection } from "#audit/domain/types";
import type { Finding } from "#core/report";

/**
 * Places a file's detections in that file, as findings.
 */
export function findingsIn(file: string, detections: ReadonlyArray<Detection>): Array<Finding> {
  return detections.map(({ line, raw, reason }) => ({ file, line, text: raw, message: reason }));
}

/**
 * Returns the scan of an audit that reads files and fixes nothing.
 */
export function fileScan(findings: ReadonlyArray<Finding>, scannedFiles: number): AuditScan {
  return { findings, scannedFiles, scannedPackages: 0, fixedFiles: [] };
}

/**
 * Applies an allowlist to a scan: an entry is a finding's text as written, or `file:text` for one file.
 */
export function applyAllowlist<Scan extends AuditScan>(
  scan: Scan,
  allowlist: ReadonlyArray<string>,
): Scan & { readonly allowlisted: number } {
  const accepted = new Set(allowlist);
  const findings = scan.findings.filter(
    (finding) => !accepted.has(finding.text) && !accepted.has(`${finding.file}:${finding.text}`),
  );
  return {
    ...scan,
    findings: findings.toSorted((left, right) => left.file.localeCompare(right.file) || left.line - right.line),
    allowlisted: scan.findings.length - findings.length,
  };
}
