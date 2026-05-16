import { useId } from "react";
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function Icon({ children, ...props }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {children}
    </svg>
  );
}

// ─── Brand ────────────────────────────────────────────────────────────────────

export function AppLogoIcon(props: IconProps) {
  const uid = useId();
  const g1 = `${uid}-g1`;
  const g2 = `${uid}-g2`;
  const g3 = `${uid}-g3`;
  return (
    <svg
      aria-hidden="true"
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <defs>
        <linearGradient gradientUnits="userSpaceOnUse" id={g1} x1="17.5" x2="17.5" y1="22" y2="5">
          <stop offset="0" stopColor="#0055d4" />
          <stop offset="1" stopColor="#60c8ff" />
        </linearGradient>
        <linearGradient gradientUnits="userSpaceOnUse" id={g2} x1="9.75" x2="9.75" y1="22" y2="11">
          <stop offset="0" stopColor="#0044bb" stopOpacity={0.6} />
          <stop offset="1" stopColor="#5ab8ff" stopOpacity={0.85} />
        </linearGradient>
        <linearGradient gradientUnits="userSpaceOnUse" id={g3} x1="2" x2="2" y1="22" y2="16">
          <stop offset="0" stopColor="#003da0" stopOpacity={0.38} />
          <stop offset="1" stopColor="#4d99ff" stopOpacity={0.55} />
        </linearGradient>
      </defs>
      <rect fill={`url(#${g3})`} height="6" rx="1.2" width="4.5" x="0" y="16" />
      <rect fill={`url(#${g2})`} height="11" rx="1.2" width="4.5" x="7.5" y="11" />
      <rect fill={`url(#${g1})`} height="17" rx="1.2" width="4.5" x="15" y="5" />
      <circle cx="17.25" cy="4" fill="white" fillOpacity={0.18} r="3.2" stroke="none" />
      <circle cx="17.25" cy="4" fill="white" fillOpacity={0.92} r="1.6" stroke="none" />
    </svg>
  );
}

// ─── Navigation ───────────────────────────────────────────────────────────────

export function ChevronDownIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m6 9 6 6 6-6" />
    </Icon>
  );
}

export function ChevronUpIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m18 15-6-6-6 6" />
    </Icon>
  );
}

export function ChevronLeftIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m15 18-6-6 6-6" />
    </Icon>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m9 18 6-6-6-6" />
    </Icon>
  );
}

// ─── Actions ──────────────────────────────────────────────────────────────────

export function RefreshCwIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 0 0 4.582 9m0 0H9" />
      <path d="M20 20v-5h-.581m-15.357-2A8.001 8.001 0 0 0 19.419 15m0 0H15" />
    </Icon>
  );
}

export function DownloadIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="M7 10l5 5 5-5" />
      <path d="M12 15V3" />
    </Icon>
  );
}

export function LinkIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </Icon>
  );
}

export function XIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </Icon>
  );
}

export function ZoomResetIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
      <path d="M8 11h6" />
    </Icon>
  );
}

// ─── Search & filter ──────────────────────────────────────────────────────────

export function SearchIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </Icon>
  );
}

export function FunnelIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M22 3H2l8 9.46V19l4 2v-8.54z" />
    </Icon>
  );
}

// ─── Data & metrics ───────────────────────────────────────────────────────────

export function BarChartIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M18 20V10" />
      <path d="M12 20V4" />
      <path d="M6 20v-6" />
      <circle cx="6" cy="14" fill="currentColor" r="1" stroke="none" />
      <circle cx="12" cy="4" fill="currentColor" r="1" stroke="none" />
      <circle cx="18" cy="10" fill="currentColor" r="1" stroke="none" />
    </Icon>
  );
}

export function GaugeIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 12a7 7 0 0 1 14 0" />
      <path d="M5 12H3" />
      <path d="M21 12h-2" />
      <path d="M12 5V3" />
      <path d="M12 12l3-5" />
      <circle cx="12" cy="12" fill="currentColor" r="1.5" stroke="none" />
    </Icon>
  );
}

export function BoltIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
    </Icon>
  );
}

export function TrendingUpIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M22 7l-8.5 8.5-5-5L1 18" />
      <path d="M16 7h6v6" />
    </Icon>
  );
}

export function Grid2x2Icon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect height="7" rx="1" width="7" x="3" y="3" />
      <rect height="7" rx="1" width="7" x="14" y="3" />
      <rect height="7" rx="1" width="7" x="14" y="14" />
      <rect height="7" rx="1" width="7" x="3" y="14" />
    </Icon>
  );
}

export function TableIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect height="18" rx="2" width="18" x="3" y="3" />
      <path d="M3 9h18" />
      <path d="M3 15h18" />
      <path d="M9 3v18" />
    </Icon>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </Icon>
  );
}

// ─── Status & feedback ────────────────────────────────────────────────────────

export function TriangleAlertIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </Icon>
  );
}

export function CircleCheckIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </Icon>
  );
}

export function InfoIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </Icon>
  );
}

// ─── UI chrome ────────────────────────────────────────────────────────────────

export function KeyboardIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect height="14" rx="2" width="20" x="2" y="5" />
      <path d="M6 9h.01" />
      <path d="M10 9h.01" />
      <path d="M14 9h.01" />
      <path d="M18 9h.01" />
      <path d="M8 13h.01" />
      <path d="M12 13h.01" />
      <path d="M16 13h.01" />
      <path d="M7 17h10" />
    </Icon>
  );
}

export function CommandIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9 9H5a2 2 0 0 0 0 4h4v4a2 2 0 0 0 4 0v-4h4a2 2 0 0 0 0-4h-4V5a2 2 0 0 0-4 0v4z" />
    </Icon>
  );
}
