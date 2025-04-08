import type { Metadata } from 'next';
import type { JSX } from 'react';

export const metadata: Metadata = {
  title: 'Invoices',
};

export default function InvoicesPage(): JSX.Element {
  return <div className="p-6">Invoices Page</div>;
}
