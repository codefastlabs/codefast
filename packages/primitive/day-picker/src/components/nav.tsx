import { type ComponentProps, type JSX, type MouseEventHandler } from 'react';

import { useDayPicker } from '@/hooks/use-day-picker';
import { UI } from '@/ui';

export type NavProps = ComponentProps<'nav'> & {
  nextMonth?: Date | undefined;
  onNextClick?: MouseEventHandler<HTMLButtonElement>;
  onPreviousClick?: MouseEventHandler<HTMLButtonElement>;
  previousMonth?: Date | undefined;
};

/**
 * Render the toolbar with the navigation button.
 */
export function Nav(props: NavProps): JSX.Element {
  const { onPreviousClick, onNextClick, previousMonth, nextMonth, ...navProps } = props;

  const {
    components,
    classNames,
    labels: { labelPrevious, labelNext },
  } = useDayPicker();

  return (
    <nav {...navProps}>
      <components.PreviousMonthButton
        aria-label={labelPrevious(previousMonth)}
        className={classNames[UI.PreviousMonthButton]}
        disabled={previousMonth ? undefined : true}
        tabIndex={previousMonth ? undefined : -1}
        type="button"
        onClick={props.onPreviousClick}
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
        onClick={props.onNextClick}
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
