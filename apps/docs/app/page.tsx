import type { JSX } from 'react';

import Image from 'next/image';
import Link from 'next/link';

export default function Home(): JSX.Element {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <header className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
        <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl lg:static lg:w-auto lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:dark:bg-zinc-800/30">
          Get started by editing&nbsp;
          <code className="font-mono font-bold">app/page.tsx</code>
        </p>
        <div className="fixed bottom-0 left-0 flex h-48 w-full items-end justify-center bg-gradient-to-t from-white via-white lg:static lg:h-auto lg:w-auto lg:bg-none dark:from-black dark:via-black">
          <a
            className="text-foreground pointer-events-none flex place-items-center gap-2 p-8 lg:pointer-events-auto lg:p-0"
            href="https://vercel.com?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
            rel="noopener noreferrer"
            target="_blank"
          >
            By{' '}
            <Image
              priority
              alt="Vercel Logo"
              className="dark:invert"
              height={24}
              src="/vercel.svg"
              width={100}
            />
          </a>
        </div>
      </header>

      <main className="grid place-items-center gap-4">
        <div className="before:bg-gradient-radial after:bg-gradient-conic relative z-[-1] flex place-items-center before:absolute before:h-[18.75rem] before:w-full before:-translate-x-1/2 before:rounded-full before:from-white before:to-transparent before:blur-2xl before:content-[''] after:absolute after:-z-20 after:h-[11.25rem] after:w-full after:translate-x-1/3 after:from-sky-200 after:via-blue-200 after:blur-2xl after:content-[''] sm:before:w-[30rem] sm:after:w-[15rem] before:lg:h-[22.5rem] before:dark:bg-gradient-to-br before:dark:from-transparent before:dark:to-blue-700 before:dark:opacity-10 after:dark:from-sky-900 after:dark:via-[#0141ff] after:dark:opacity-40">
          <Image
            priority
            alt="Next.js Logo"
            className="relative dark:drop-shadow-[0_0_0.3rem_#ffffff70] dark:invert"
            height={37}
            src="/next.svg"
            width={180}
          />
        </div>
      </main>

      <footer className="mb-32 grid text-center lg:mb-0 lg:w-full lg:max-w-5xl lg:grid-cols-4 lg:text-left">
        <Link
          className="text-foreground group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
          href="/examples/authentication"
        >
          <h2 className="mb-3 text-2xl font-semibold">
            Examples{' '}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p className="m-0 max-w-[30ch] text-sm opacity-50">
            Explore a list of examples to help you get started with your project.
          </p>
        </Link>
        <Link
          className="text-foreground group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
          href="/examples/mail"
        >
          <h2 className="mb-3 text-2xl font-semibold">
            Mail{' '}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p className="m-0 max-w-[30ch] text-sm opacity-50">
            Send emails with ease using the Mail example.
          </p>
        </Link>
        <Link
          className="text-foreground group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
          href="/examples/dashboard"
        >
          <h2 className="mb-3 text-2xl font-semibold">
            Dashboard{' '}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p className="m-0 max-w-[30ch] text-sm opacity-50">
            Build a dashboard for your project with the Dashboard example.
          </p>
        </Link>
        <Link
          className="text-foreground group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
          href="/examples/forms"
        >
          <h2 className="mb-3 text-2xl font-semibold">
            Forms{' '}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p className="m-0 max-w-[30ch] text-sm opacity-50">
            Learn how to create forms with the Forms example
          </p>
        </Link>
      </footer>
    </main>
  );
}
