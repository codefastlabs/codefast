import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function Icon({ ...props }: IconProps) {
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
    />
  );
}

/**
 * Renders a downward chevron icon.
 *
 * @since 0.3.16-canary.3
 */
export function ChevronDownIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m6 9 6 6 6-6" />
    </Icon>
  );
}

/**
 * Renders a clockwise refresh-arrows icon.
 *
 * @since 0.3.16-canary.3
 */
export function RefreshCwIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 0 0 4.582 9m0 0H9" />
      <path d="M20 20v-5h-.581m-15.357-2A8.001 8.001 0 0 0 19.419 15m0 0H15" />
    </Icon>
  );
}

/**
 * Renders a leftward chevron icon.
 */
export function ChevronLeftIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m15 18-6-6 6-6" />
    </Icon>
  );
}

/**
 * Renders a rightward chevron icon.
 */
export function ChevronRightIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m9 18 6-6-6-6" />
    </Icon>
  );
}

/**
 * Renders a download-arrow icon.
 */
export function DownloadIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 15V3" />
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="m7 10 5 5 5-5" />
    </Icon>
  );
}

/**
 * Renders a push-pin icon.
 */
export function PinIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 17v5" />
      <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z" />
    </Icon>
  );
}

/**
 * Renders a magnifying-glass icon.
 */
export function SearchIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </Icon>
  );
}

/**
 * Renders a horizontal-sliders icon, for a filter control.
 */
export function SlidersHorizontalIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M21 4h-7M10 4H3M21 12h-9M8 12H3M21 20h-5M12 20H3M14 2v4M8 10v4M16 18v4" />
    </Icon>
  );
}
