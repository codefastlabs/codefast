import { type JSX } from 'react';

export interface ChevronProps {
  className?: string;
  /** Set to `true` to disable the chevron. */
  disabled?: boolean;
  /** The orientation of the chevron. */
  orientation?: 'up' | 'down' | 'left' | 'right';
  /**
   * The size of the chevron.
   *
   * @defaultValue 24
   */
  size?: number;
}

/**
 * Render the chevron icon used in the navigation buttons and dropdowns.
 */
export function Chevron({ size = 24, orientation = 'left', className }: ChevronProps): JSX.Element {
  return (
    <svg className={className} height={size} viewBox="0 0 24 24" width={size}>
      {orientation === 'up' && <polygon points="6.77 17 12.5 11.43 18.24 17 20 15.28 12.5 8 5 15.28" />}
      {orientation === 'down' && <polygon points="6.77 8 12.5 13.57 18.24 8 20 9.72 12.5 17 5 9.72" />}
      {orientation === 'left' && (
        <polygon points="16 18.112 9.81111111 12 16 5.87733333 14.0888889 4 6 12 14.0888889 20" />
      )}
      {orientation === 'right' && (
        <polygon points="8 18.612 14.1888889 12.5 8 6.37733333 9.91111111 4.5 18 12.5 9.91111111 20.5" />
      )}
    </svg>
  );
}