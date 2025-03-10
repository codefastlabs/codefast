import { type Metadata } from 'next';
import { type JSX } from 'react';

import { AccordionDemo } from '@/components/accordion-demo';
import { AlertDemo } from '@/components/alert-demo';
import { AlertDialogDemo } from '@/components/alert-dialog-demo';
import { AspectRatioDemo } from '@/components/aspect-ratio-demo';
import { AvatarDemo } from '@/components/avatar-demo';
import { BadgeDemo } from '@/components/badge-demo';
import { BreadcrumbDemo } from '@/components/breadcrumb-demo';
import { ButtonDemo } from '@/components/button-demo';
import { CalendarDemo } from '@/components/calendar-demo';
import { CardDemo } from '@/components/card-demo';
import { CarouselDemo } from '@/components/carousel-demo';
import { ChartDemo } from '@/components/chart-demo';
import { CheckboxDemo } from '@/components/checkbox-demo';
import { CollapsibleDemo } from '@/components/collapsible-demo';
import { ComboboxDemo } from '@/components/combobox-demo';
import { ComponentWrapper } from '@/components/component-wrapper';
import { ContextMenuDemo } from '@/components/context-menu-demo';
import { DatePickerDemo } from '@/components/date-picker-demo';
import { DialogDemo } from '@/components/dialog-demo';
import { DrawerDemo } from '@/components/drawer-demo';
import { DropdownMenuDemo } from '@/components/dropdown-menu-demo';
import { FormDemo } from '@/components/form-demo';
import { HoverCardDemo } from '@/components/hover-card-demo';
import { InputDemo } from '@/components/input-demo';
import { InputOTPDemo } from '@/components/input-otp-demo';
import { LabelDemo } from '@/components/label-demo';
import { MenubarDemo } from '@/components/menubar-demo';
import { NavigationMenuDemo } from '@/components/navigation-menu-demo';
import { PaginationDemo } from '@/components/pagination-demo';

export const metadata: Metadata = {
  title: 'App',
};

export default function AppPage(): JSX.Element {
  return (
    <div className="@container grid flex-1 gap-4 p-4 sm:pb-[120vh]">
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

      <ComponentWrapper name="avatar">
        <AvatarDemo />
      </ComponentWrapper>

      <ComponentWrapper name="badge">
        <BadgeDemo />
      </ComponentWrapper>

      <ComponentWrapper name="breadcrumb">
        <BreadcrumbDemo />
      </ComponentWrapper>

      <ComponentWrapper name="button">
        <ButtonDemo />
      </ComponentWrapper>

      <ComponentWrapper name="calendar">
        <CalendarDemo />
      </ComponentWrapper>

      <ComponentWrapper name="card">
        <CardDemo />
      </ComponentWrapper>

      <ComponentWrapper name="carousel">
        <CarouselDemo />
      </ComponentWrapper>

      <ComponentWrapper name="checkbox">
        <CheckboxDemo />
      </ComponentWrapper>

      <ComponentWrapper name="collapsible">
        <CollapsibleDemo />
      </ComponentWrapper>

      <ComponentWrapper name="combobox">
        <ComboboxDemo />
      </ComponentWrapper>

      <ComponentWrapper name="context-menu">
        <ContextMenuDemo />
      </ComponentWrapper>

      <ComponentWrapper name="date-picker">
        <DatePickerDemo />
      </ComponentWrapper>

      <ComponentWrapper name="dialog">
        <DialogDemo />
      </ComponentWrapper>

      <ComponentWrapper name="drawer">
        <DrawerDemo />
      </ComponentWrapper>

      <ComponentWrapper name="dropdown-menu">
        <DropdownMenuDemo />
      </ComponentWrapper>

      <ComponentWrapper name="form">
        <FormDemo />
      </ComponentWrapper>

      <ComponentWrapper name="hover-card">
        <HoverCardDemo />
      </ComponentWrapper>

      <ComponentWrapper name="input">
        <InputDemo />
      </ComponentWrapper>

      <ComponentWrapper name="input-otp">
        <InputOTPDemo />
      </ComponentWrapper>

      <ComponentWrapper name="label">
        <LabelDemo />
      </ComponentWrapper>

      <ComponentWrapper name="menubar">
        <MenubarDemo />
      </ComponentWrapper>

      <ComponentWrapper name="navigation-menu">
        <NavigationMenuDemo />
      </ComponentWrapper>

      <ComponentWrapper name="pagination">
        <PaginationDemo />
      </ComponentWrapper>
    </div>
  );
}
