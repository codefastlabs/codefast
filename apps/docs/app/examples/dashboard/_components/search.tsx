'use client';

import { useStateParams } from '@codefast/hooks';
import { SearchInput } from '@codefast/ui';
import { SearchIcon } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { type JSX, useCallback, useTransition } from 'react';

export function Search(): JSX.Element {
  const stateParams = useStateParams();
  const searchParams = useSearchParams();
  const [_, startTransition] = useTransition();

  const handleChange = useCallback<(value: string) => void>(
    (value) => {
      startTransition(() => {
        stateParams.replace({ search: value });
      });
    },
    [stateParams],
  );

  return (
    <div>
      <SearchInput
        className="md:w-[100px] lg:w-[300px]"
        defaultValue={searchParams.get('search') ?? ''}
        placeholder="Search..."
        prefix={<SearchIcon />}
        onChange={handleChange}
      />
    </div>
  );
}
