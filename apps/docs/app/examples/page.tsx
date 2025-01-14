import { type Metadata } from 'next';
import { type JSX } from 'react';

export const metadata: Metadata = {
  title: 'Examples',
};

export default function ExamplesPage(): JSX.Element {
  return <main className="p-8">Examples Page</main>;
}
