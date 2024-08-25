'use client';

import { type FormEventHandler, type JSX, useCallback, useTransition } from 'react';
import { TextInput } from '@codefast/ui/text-input';
import { SearchIcon } from 'lucide-react';
import { useStateParams } from '@codefast/hooks/use-state-params';
import { useSearchParams } from 'next/navigation';

export function Search(): JSX.Element {
  const stateParams = useStateParams();
  const searchParams = useSearchParams();
  const [_, startTransition] = useTransition();

  const handleInput = useCallback<FormEventHandler<HTMLInputElement>>(
    (event) => {
      const target = event.target;

      if (target instanceof HTMLInputElement) {
        startTransition(() => {
          stateParams.replace({ search: target.value });
        });
      }
    },
    [stateParams],
  );

  return (
    <div>
      <TextInput
        className="md:w-[100px] lg:w-[300px]"
        defaultValue={searchParams.get('search') ?? ''}
        loaderPosition="prefix"
        placeholder="Search..."
        prefix={<SearchIcon />}
        type="search"
        onInput={handleInput}
      />
    </div>
  );
}
