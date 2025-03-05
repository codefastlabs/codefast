'use client';

import type { JSX } from 'react';

import { useStateParams } from '@codefast/hooks';
import { InputSearch } from '@codefast/ui';
import { SearchIcon } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useCallback, useTransition } from 'react';

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
      <InputSearch
        className="md:w-[6.25rem] lg:w-[18.75rem]"
        defaultValue={searchParams.get('search') ?? ''}
        placeholder="Search..."
        prefix={<SearchIcon />}
        onChange={handleChange}
      />
    </div>
  );
}
