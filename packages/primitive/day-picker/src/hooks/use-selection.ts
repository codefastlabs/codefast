import { type DateLib } from '@/classes/date-lib';
import { useMulti } from '@/hooks/use-multi';
import { useRange } from '@/hooks/use-range';
import { useSingle } from '@/hooks/use-single';
import { type Selection, type DayPickerProps } from '@/types';

export function useSelection<T extends DayPickerProps>(props: T, dateLib: DateLib): Selection<T> | undefined {
  const single = useSingle(props, dateLib);
  const multi = useMulti(props, dateLib);
  const range = useRange(props, dateLib);

  switch (props.mode) {
    case 'single':
      return single;

    case 'multiple':
      return multi;

    case 'range':
      return range;

    default:
      return undefined;
  }
}
