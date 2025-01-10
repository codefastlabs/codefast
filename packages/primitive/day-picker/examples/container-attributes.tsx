import type { ComponentProps, JSX } from 'react';

import { DayPicker } from '@/components';

type ContainerAttributesProps = ComponentProps<'div'>;

export function ContainerAttributes(props: ContainerAttributesProps): JSX.Element {
  return (
    <div {...props}>
      <DayPicker
        className="testClass"
        data-test="testData"
        id="testId"
        lang="vi"
        nonce="foo_nonce"
        title="foo_title"
      />
    </div>
  );
}
