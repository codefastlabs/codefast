import type { JSX } from 'react';

import { InputPassword } from '@codefast/ui';
import { LockIcon } from 'lucide-react';

import { GridWrapper } from '@/components/grid-wrapper';

export function InputPasswordDemo(): JSX.Element {
  return (
    <GridWrapper>
      <div className="">
        <InputPassword placeholder="Enter a number" />
      </div>

      <div className="">
        <InputPassword aria-invalid="true" placeholder="Invalid number" />
      </div>

      <div className="">
        <InputPassword loading placeholder="Loading..." />
      </div>

      <div className="">
        <InputPassword disabled placeholder="Disabled" />
      </div>

      <div className="">
        <InputPassword readOnly defaultValue="password" placeholder="Read only" />
      </div>

      <div className="">
        <InputPassword placeholder="Enter a number" prefix={<LockIcon />} />
      </div>

      <div className="">
        <InputPassword placeholder="Enter a number" suffix={<LockIcon />} />
      </div>
    </GridWrapper>
  );
}
