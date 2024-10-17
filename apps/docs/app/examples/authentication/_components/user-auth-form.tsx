'use client';

import { Button, cn, Label, TextInput } from '@codefast/ui';
import {
  type HTMLAttributes,
  type JSX,
  type SyntheticEvent,
  useState,
} from 'react';
import { type SubmitHandler } from 'react-hook-form';

import { Icons } from '@/components/icons';

type UserAuthFormProps = HTMLAttributes<HTMLDivElement>;

export function UserAuthForm({
  className,
  ...props
}: UserAuthFormProps): JSX.Element {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const onSubmit: SubmitHandler<SyntheticEvent> = (event): void => {
    event.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
    }, 3000);
  };

  return (
    <div className={cn('grid gap-6', className)} {...props}>
      <form onSubmit={onSubmit}>
        <div className="grid gap-2">
          <div className="grid gap-1">
            <Label className="sr-only" htmlFor="email">
              Email
            </Label>
            <TextInput
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              disabled={isLoading}
              id="email"
              placeholder="name@example.com"
              type="email"
            />
          </div>
          <Button loading={isLoading} type="submit">
            Sign In with Email
          </Button>
        </div>
      </form>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background text-muted-foreground px-2">
            Or continue with
          </span>
        </div>
      </div>
      <Button
        loading={isLoading}
        prefix={<Icons.GitHub />}
        type="button"
        variant="outline"
      >
        GitHub
      </Button>
    </div>
  );
}
