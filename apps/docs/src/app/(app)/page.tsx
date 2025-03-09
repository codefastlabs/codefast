import { type Metadata } from 'next';
import { type JSX } from 'react';

import { AccordionDemo } from '@/components/accordion-demo';
import { AlertDemo } from '@/components/alert-demo';
import { AlertDialogDemo } from '@/components/alert-dialog-demo';
import { AspectRatioDemo } from '@/components/aspect-ratio-demo';
import { ChartDemo } from '@/components/chart-demo';
import { ComponentWrapper } from '@/components/component-wrapper';

export const metadata: Metadata = {
  title: 'App',
};

export default function AppPage(): JSX.Element {
  return (
    <div className="@container grid flex-1 gap-4 p-4">
      <ComponentWrapper className="w-full" name="chart">
        <ChartDemo />
      </ComponentWrapper>

      <ComponentWrapper name="accordion">
        <AccordionDemo />
      </ComponentWrapper>

      <ComponentWrapper name="alert">
        <AlertDemo />
      </ComponentWrapper>

      <ComponentWrapper name="alert-dialog">
        <AlertDialogDemo />
      </ComponentWrapper>

      <ComponentWrapper name="aspect-ratio">
        <AspectRatioDemo />
      </ComponentWrapper>
    </div>
  );
}
