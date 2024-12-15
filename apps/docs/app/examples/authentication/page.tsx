import type { Metadata } from 'next';
import type { JSX } from 'react';

import { buttonVariants, cn } from '@codefast/ui';
import Image from 'next/image';
import Link from 'next/link';

import { UserAuthForm } from '@/app/examples/authentication/_components/user-auth-form';

export const metadata: Metadata = {
  description: 'Authentication forms built using the components.',
  title: 'Authentication',
};

export default function AuthenticationPage(): JSX.Element {
  return (
    <>
      <div className="md:hidden">
        <Image
          alt="Authentication"
          className="block dark:hidden"
          height={843}
          src="/examples/authentication-light.png"
          width={1280}
        />
        <Image
          alt="Authentication"
          className="hidden dark:block"
          height={843}
          src="/examples/authentication-dark.png"
          width={1280}
        />
      </div>
      <div className="container relative mx-auto hidden h-dvh flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
        <Link
          className={cn(buttonVariants({ variant: 'ghost' }), 'absolute right-4 top-4 md:right-8 md:top-8')}
          href="/examples/authentication"
        >
          Login
        </Link>
        <div className="bg-muted relative hidden h-full flex-col p-10 text-white lg:flex dark:border-r">
          <div className="absolute inset-0 bg-zinc-900" />
          <div className="relative z-20 flex items-center text-lg font-medium">
            <svg
              className="mr-2 size-6"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
            </svg>
            Acme Inc
          </div>
          <div className="relative z-20 mt-auto">
            <blockquote className="space-y-2">
              <p className="text-lg">
                &ldquo;This library has saved me countless hours of work and helped me deliver stunning designs to my
                clients faster than ever before.&rdquo;
              </p>
              <footer className="text-sm">Sofia Davis</footer>
            </blockquote>
          </div>
        </div>
        <div className="lg:p-8">
          <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
            <div className="flex flex-col space-y-2 text-center">
              <h1 className="text-2xl font-semibold tracking-tight">Create an account</h1>
              <p className="text-muted-foreground text-sm">Enter your email below to create your account</p>
            </div>
            <UserAuthForm />
            <p className="text-muted-foreground px-8 text-center text-sm">
              By clicking continue, you agree to our{' '}
              <Link className="hover:text-primary underline underline-offset-4" href="/terms">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link className="hover:text-primary underline underline-offset-4" href="/privacy">
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
