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
