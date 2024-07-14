import { type JSX } from 'react';
import { TextInput } from '@codefast/ui/text-input';
import { SearchIcon } from 'lucide-react';

export function Search(): JSX.Element {
  return (
    <div>
      <TextInput className="md:w-[100px] lg:w-[300px]" placeholder="Search..." prefix={<SearchIcon />} type="search" />
    </div>
  );
}
