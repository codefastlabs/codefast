import type { JSX, ReactNode } from 'react';

export default function ChartsLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>): JSX.Element {
  return (
    <section className="py-10">
      <div className="container mx-auto px-4">{children}</div>
    </section>
  );
}
