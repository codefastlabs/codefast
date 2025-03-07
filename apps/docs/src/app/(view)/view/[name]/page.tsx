import { type Metadata } from 'next';
import { type JSX } from 'react';

export const metadata: Metadata = {
  title: 'Name',
};

export default function NamePage(): JSX.Element {
  return <main className="">Name Page</main>;
}
