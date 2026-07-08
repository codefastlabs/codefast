import type { ComponentProps } from "react";

export interface PrivacyChoicesIconProps extends ComponentProps<"svg"> {}

/**
 * The CPRA/DAA "privacy options" mark that California regulations pair with the
 * "Do Not Sell or Share" link — kept in its official blue in both themes so it stays
 * recognizable as the standard opt-out icon rather than reading as site chrome.
 */
export function PrivacyChoicesIcon(props: PrivacyChoicesIconProps) {
  return (
    <svg fill="none" viewBox="0 0 30 14" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M7 .5h16a6.5 6.5 0 0 1 0 13H7a6.5 6.5 0 0 1 0-13Z" fill="#fff" stroke="#06f" />
      <path d="M15 .5h8a6.5 6.5 0 0 1 0 13h-8Z" fill="#06f" />
      <path d="m5.5 7.2 1.8 1.8 3.2-3.8" stroke="#06f" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
      <path d="m19.7 4.9 4.2 4.2m0-4.2-4.2 4.2" stroke="#fff" strokeLinecap="round" strokeWidth="1.5" />
    </svg>
  );
}
