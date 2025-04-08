import type { Metadata } from 'next';
import type { JSX } from 'react';

export const metadata: Metadata = {
  title: 'Orders',
};

export default function OrdersPage(): JSX.Element {
  return <div className="p-6">Orders Page</div>;
}
