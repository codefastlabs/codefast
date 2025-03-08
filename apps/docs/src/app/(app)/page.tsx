import { type Metadata } from 'next';
import { type JSX } from 'react';

export const metadata: Metadata = {
  title: 'App',
};

export default function AppPage(): JSX.Element {
  return <div className="@container grid flex-1 gap-4 p-4">App Page</div>;
}
