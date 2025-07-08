import { CardsActivityGoal } from "@/app/(app)/(home)/_components/cards-activity-goal";
import { CardsChat } from "@/app/(app)/(home)/_components/cards-chat";
import { CardsCookieSettings } from "@/app/(app)/(home)/_components/cards-cookie-settings";
import { CardsCreateAccount } from "@/app/(app)/(home)/_components/cards-create-account";
import { CardsDataTable } from "@/app/(app)/(home)/_components/cards-data-table";
import { CardsMetric } from "@/app/(app)/(home)/_components/cards-metric";
import { CardsPaymentMethod } from "@/app/(app)/(home)/_components/cards-payment-method";
import { CardsReportIssue } from "@/app/(app)/(home)/_components/cards-report-issue";
import { CardsShare } from "@/app/(app)/(home)/_components/cards-share";
import { CardsStats } from "@/app/(app)/(home)/_components/cards-stats";
import { CardsTeamMembers } from "@/app/(app)/(home)/_components/cards-team-members";

import type { Metadata } from "next";
import type { JSX } from "react";

const title = "Building a powerful component library";
const description =
  "A suite of elegantly designed, accessible components and a code distribution platform. Works seamlessly with your favorite frameworks. Open Source. Open Code.";

export const metadata: Metadata = {
  title,
  description,
};

export default function AppPage(): JSX.Element {
  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col items-start gap-1 py-8 md:py-10 lg:py-12">
        <h1 className="text-2xl font-bold leading-tight tracking-tighter sm:text-3xl md:text-4xl">{title}</h1>
        <p className="text-foreground max-w-2xl text-base font-light sm:text-lg">{description}</p>
      </div>
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
