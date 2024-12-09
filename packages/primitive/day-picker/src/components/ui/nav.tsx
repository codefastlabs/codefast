import { type ComponentProps, type JSX, type MouseEventHandler } from 'react';

import { UI } from '@/lib/constants/ui';
import { useDayPicker } from '@/lib/hooks/use-day-picker';

export type NavProps = ComponentProps<'nav'> & {
  nextMonth?: Date | undefined;
  onNextClick?: MouseEventHandler<HTMLButtonElement>;
  onPreviousClick?: MouseEventHandler<HTMLButtonElement>;
  previousMonth?: Date | undefined;
};

/**
 * Render the toolbar with the navigation button.
 */
export function Nav({ nextMonth, onNextClick, onPreviousClick, previousMonth, ...props }: NavProps): JSX.Element {
  const {
    classNames,
    components,
    labels: { labelNext, labelPrevious },
  } = useDayPicker();

  return (
    <nav {...props}>
      <components.PreviousMonthButton
        aria-label={labelPrevious(previousMonth)}
        className={classNames[UI.PreviousMonthButton]}
        disabled={previousMonth ? undefined : true}
        tabIndex={previousMonth ? undefined : -1}
        type="button"
        onClick={onPreviousClick}
      >
        <components.Chevron
          className={classNames[UI.Chevron]}
          disabled={previousMonth ? undefined : true}
          orientation="left"
        />
      </components.PreviousMonthButton>
      <components.NextMonthButton
        aria-label={labelNext(nextMonth)}
        className={classNames[UI.NextMonthButton]}
        disabled={nextMonth ? undefined : true}
        tabIndex={nextMonth ? undefined : -1}
        type="button"
        onClick={onNextClick}
      >
        <components.Chevron
          className={classNames[UI.Chevron]}
          disabled={nextMonth ? undefined : true}
          orientation="right"
        />
      </components.NextMonthButton>
    </nav>
  );
}
