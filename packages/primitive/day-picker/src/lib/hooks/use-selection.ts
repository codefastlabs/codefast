import { type DateLib } from '@/lib/classes/date-lib';
import { useMulti } from '@/lib/hooks/use-multi';
import { useRange } from '@/lib/hooks/use-range';
import { useSingle } from '@/lib/hooks/use-single';
import { type DayPickerProps, type Selection } from '@/lib/types';

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