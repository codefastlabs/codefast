import { type Metadata } from 'next';
import { type JSX } from 'react';

import { CardsActivityGoal } from '@/app/(app)/(home)/_components/cards-activity-goal';
import { CardsChat } from '@/app/(app)/(home)/_components/cards-chat';
import { CardsCookieSettings } from '@/app/(app)/(home)/_components/cards-cookie-settings';
import { CardsCreateAccount } from '@/app/(app)/(home)/_components/cards-create-account';
import { CardsDataTable } from '@/app/(app)/(home)/_components/cards-data-table';
import { CardsMetric } from '@/app/(app)/(home)/_components/cards-metric';
import { CardsPaymentMethod } from '@/app/(app)/(home)/_components/cards-payment-method';
import { CardsReportIssue } from '@/app/(app)/(home)/_components/cards-report-issue';
import { CardsShare } from '@/app/(app)/(home)/_components/cards-share';
import { CardsStats } from '@/app/(app)/(home)/_components/cards-stats';
import { CardsTeamMembers } from '@/app/(app)/(home)/_components/cards-team-members';

export const metadata: Metadata = {
  title: 'App',
};

export default function AppPage(): JSX.Element {
  return (
    <div className="container mx-auto p-6">
      <div className="3xl:grid-cols-2 grid gap-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <CardsStats className="col-span-full" />
          <div className="grid gap-6">
            <CardsTeamMembers />
            <CardsCookieSettings />
            <CardsPaymentMethod />
          </div>
          <div className="grid gap-6">
            <CardsChat />
            <CardsCreateAccount />
            <CardsReportIssue />
          </div>
        </div>
        <div className="grid gap-6">
          <CardsActivityGoal />
          <CardsMetric />
          <CardsDataTable />
          <CardsShare />
        </div>
      </div>
    </div>
  );
}
