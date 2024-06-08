import { Input } from '@codefast/ui/input';
import type { JSX } from 'react';

export function Search(): JSX.Element {
  return (
    <div>
      <Input type="search" placeholder="Search..." className="md:w-[100px] lg:w-[300px]" />
    </div>
  );
}
