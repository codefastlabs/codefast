import type { Metadata } from 'next';
import type { ComponentProps, JSX } from 'react';

import { cn } from '@codefast/ui';
import Image from 'next/image';

import { Calendar } from '@/app/examples/cards/_components/calendar';
import { CookieSettings } from '@/app/examples/cards/_components/cookie-settings';
import { CreateAccount } from '@/app/examples/cards/_components/create-account';
import { Github } from '@/app/examples/cards/_components/github-card';
import { Notifications } from '@/app/examples/cards/_components/notifications';
import { PaymentMethod } from '@/app/examples/cards/_components/payment-method';
import { ReportAnIssue } from '@/app/examples/cards/_components/report-an-issue';
import { ShareDocument } from '@/app/examples/cards/_components/share-document';
import { TeamMembers } from '@/app/examples/cards/_components/team-members';

export const metadata: Metadata = {
  description: 'Examples of cards built using the components.',
  title: 'Cards',
};

function Container({ className, ...props }: ComponentProps<'div'>): JSX.Element {
  return (
    <div className={cn('flex items-center justify-center [&>div]:w-full', className)} {...props} />
  );
}

export default function CardsPage(): JSX.Element {
  return (
    <>
      <div className="md:hidden">
        <Image
          alt="Cards"
          className="block dark:hidden"
          height={1214}
          src="/examples/cards-light.png"
          width={1280}
        />
        <Image
          alt="Cards"
          className="hidden dark:block"
          height={1214}
          src="/examples/cards-dark.png"
          width={1280}
        />
      </div>
      <div className="hidden items-start justify-center gap-6 rounded-lg p-8 md:grid lg:grid-cols-2 xl:grid-cols-3">
        <div className="col-span-2 grid items-start gap-6 lg:col-span-1">
          <Container>
            <CreateAccount />
          </Container>

          <Container>
            <PaymentMethod />
          </Container>
        </div>
        <div className="col-span-2 grid items-start gap-6 lg:col-span-1">
          <Container>
            <TeamMembers />
          </Container>

          <Container>
            <ShareDocument />
          </Container>

          <Container>
            <Calendar />
          </Container>

          <Container>
            <Notifications />
          </Container>
        </div>
        <div className="col-span-2 grid items-start gap-6 lg:col-span-2 lg:grid-cols-2 xl:col-span-1 xl:grid-cols-1">
          <Container>
            <ReportAnIssue />
          </Container>

          <Container>
            <Github />
          </Container>

          <Container>
            <CookieSettings />
          </Container>
        </div>
      </div>
    </>
  );
}
