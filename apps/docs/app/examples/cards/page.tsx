import { cn } from '@codefast/ui/utils';
import Image from 'next/image';
import { type HTMLAttributes, type JSX } from 'react';
import { type Metadata } from 'next';
import { DemoCookieSettings } from '@/app/examples/cards/_components/cookie-settings';
import { DemoCreateAccount } from '@/app/examples/cards/_components/create-account';
import { DemoDatePicker } from '@/app/examples/cards/_components/date-picker';
import { DemoGithub } from '@/app/examples/cards/_components/github-card';
import { DemoNotifications } from '@/app/examples/cards/_components/notifications';
import { DemoPaymentMethod } from '@/app/examples/cards/_components/payment-method';
import { DemoReportAnIssue } from '@/app/examples/cards/_components/report-an-issue';
import { DemoShareDocument } from '@/app/examples/cards/_components/share-document';
import { DemoTeamMembers } from '@/app/examples/cards/_components/team-members';

export const metadata: Metadata = {
  title: 'Cards',
  description: 'Examples of cards built using the components.',
};

function DemoContainer({ className, ...props }: HTMLAttributes<HTMLDivElement>): JSX.Element {
  return <div className={cn('flex items-center justify-center [&>div]:w-full', className)} {...props} />;
}

export default function CardsPage(): JSX.Element {
  return (
    <>
      <div className="md:hidden">
        <Image src="/examples/cards-light.png" width={1280} height={1214} alt="Cards" className="block dark:hidden" />
        <Image src="/examples/cards-dark.png" width={1280} height={1214} alt="Cards" className="hidden dark:block" />
      </div>
      <div className="hidden items-start justify-center gap-6 rounded-lg p-8 md:grid lg:grid-cols-2 xl:grid-cols-3">
        <div className="col-span-2 grid items-start gap-6 lg:col-span-1">
          <DemoContainer>
            <DemoCreateAccount />
          </DemoContainer>
          <DemoContainer>
            <DemoPaymentMethod />
          </DemoContainer>
        </div>
        <div className="col-span-2 grid items-start gap-6 lg:col-span-1">
          <DemoContainer>
            <DemoTeamMembers />
          </DemoContainer>
          <DemoContainer>
            <DemoShareDocument />
          </DemoContainer>
          <DemoContainer>
            <DemoDatePicker />
          </DemoContainer>
          <DemoContainer>
            <DemoNotifications />
          </DemoContainer>
        </div>
        <div className="col-span-2 grid items-start gap-6 lg:col-span-2 lg:grid-cols-2 xl:col-span-1 xl:grid-cols-1">
          <DemoContainer>
            <DemoReportAnIssue />
          </DemoContainer>
          <DemoContainer>
            <DemoGithub />
          </DemoContainer>
          <DemoContainer>
            <DemoCookieSettings />
          </DemoContainer>
        </div>
      </div>
    </>
  );
}
