import { cookies } from 'next/headers';
import Image from 'next/image';
import { type JSX } from 'react';
import { accounts, mails } from '@/app/examples/mail/_data/data';
import { Mail } from '@/app/examples/mail/_components/mail';

export default function MailPage(): JSX.Element {
  const layout = cookies().get('react-resizable-panels:layout');
  const collapsed = cookies().get('react-resizable-panels:collapsed');

  const defaultLayout = (layout ? JSON.parse(layout.value) : undefined) as number[];
  const defaultCollapsed = (collapsed ? JSON.parse(collapsed.value) : undefined) as boolean;

  return (
    <>
      <div className="md:hidden">
        <Image alt="Mail" className="hidden dark:block" height={727} src="/examples/mail-dark.png" width={1280} />
        <Image alt="Mail" className="block dark:hidden" height={727} src="/examples/mail-light.png" width={1280} />
      </div>
      <div className="hidden flex-col md:flex">
        <Mail
          accounts={accounts}
          defaultCollapsed={defaultCollapsed}
          defaultLayout={defaultLayout}
          mails={mails}
          navCollapsedSize={4}
        />
      </div>
    </>
  );
}
