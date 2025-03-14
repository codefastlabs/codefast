import { type Metadata } from 'next';
import { type JSX } from 'react';

import { ComponentWrapper } from '@/components/component-wrapper';
import { AccordionDemo } from '@/registry/demos/accordion-demo';
import { AlertDemo } from '@/registry/demos/alert-demo';
import { AlertDialogDemo } from '@/registry/demos/alert-dialog-demo';
import { AspectRatioDemo } from '@/registry/demos/aspect-ratio-demo';
import { AvatarDemo } from '@/registry/demos/avatar-demo';
import { BadgeDemo } from '@/registry/demos/badge-demo';
import { BreadcrumbDemo } from '@/registry/demos/breadcrumb-demo';
import { ButtonDemo } from '@/registry/demos/button-demo';
import { CalendarDemo } from '@/registry/demos/calendar-demo';
import { CardDemo } from '@/registry/demos/card-demo';
import { CarouselDemo } from '@/registry/demos/carousel-demo';
import { ChartDemo } from '@/registry/demos/chart-demo';
import { CheckboxCardsDemo } from '@/registry/demos/checkbox-cards-demo';
import { CheckboxDemo } from '@/registry/demos/checkbox-demo';
import { CheckboxGroupDemo } from '@/registry/demos/checkbox-group-demo';
import { CollapsibleDemo } from '@/registry/demos/collapsible-demo';
import { ComboboxDemo } from '@/registry/demos/combobox-demo';
import { CommandDemo } from '@/registry/demos/command-demo';
import { ContextMenuDemo } from '@/registry/demos/context-menu-demo';
import { DatePickerDemo } from '@/registry/demos/date-picker-demo';
import { DialogDemo } from '@/registry/demos/dialog-demo';
import { DrawerDemo } from '@/registry/demos/drawer-demo';
import { DropdownMenuDemo } from '@/registry/demos/dropdown-menu-demo';
import { FormDemo } from '@/registry/demos/form-demo';
import { HoverCardDemo } from '@/registry/demos/hover-card-demo';
import { InputDateDemo } from '@/registry/demos/input-date-demo';
import { InputDemo } from '@/registry/demos/input-demo';
import { InputNumberDemo } from '@/registry/demos/input-number-demo';
import { InputOTPDemo } from '@/registry/demos/input-otp-demo';
import { InputPasswordDemo } from '@/registry/demos/input-password-demo';
import { InputSearchDemo } from '@/registry/demos/input-search-demo';
import { InputTimeDemo } from '@/registry/demos/input-time-demo';
import { KbdDemo } from '@/registry/demos/kbd-demo';
import { LabelDemo } from '@/registry/demos/label-demo';
import { MenubarDemo } from '@/registry/demos/menubar-demo';
import { NavigationMenuDemo } from '@/registry/demos/navigation-menu-demo';
import { PaginationDemo } from '@/registry/demos/pagination-demo';
import { PopoverDemo } from '@/registry/demos/popover-demo';
import { ProgressDemo } from '@/registry/demos/progress-demo';
import { RadioCardsDemo } from '@/registry/demos/radio-cards-demo';
import { RadioDemo } from '@/registry/demos/radio-demo';
import { RadioGroupDemo } from '@/registry/demos/radio-group-demo';
import { ResizableDemo } from '@/registry/demos/resizable-demo';
import { ScrollAreaDemo } from '@/registry/demos/scroll-area-demo';
import { SelectDemo } from '@/registry/demos/select-demo';
import { SeparatorDemo } from '@/registry/demos/separator-demo';
import { SheetDemo } from '@/registry/demos/sheet-demo';
import { SkeletonDemo } from '@/registry/demos/skeleton-demo';
import { SliderDemo } from '@/registry/demos/slider-demo';
import { SonnerDemo } from '@/registry/demos/sonner-demo';
import { SwitchDemo } from '@/registry/demos/switch-demo';
import { TableDemo } from '@/registry/demos/table-demo';
import { TabsDemo } from '@/registry/demos/tabs-demo';
import { TextareaDemo } from '@/registry/demos/textarea-demo';
import { ToggleDemo } from '@/registry/demos/toggle-demo';
import { ToggleGroupDemo } from '@/registry/demos/toggle-group-demo';
import { TooltipDemo } from '@/registry/demos/tooltip-demo';

export const metadata: Metadata = {
  title: 'App',
};

export default function AppPage(): JSX.Element {
  return (
    <div className="@container grid gap-4 p-4 2xl:container 2xl:mx-auto">
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

      <ComponentWrapper classNames={{ body: 'overflow-auto' }} name="calendar">
        <CalendarDemo />
      </ComponentWrapper>

      <ComponentWrapper name="card">
        <CardDemo />
      </ComponentWrapper>

      <ComponentWrapper classNames={{ body: 'overflow-auto' }} name="carousel">
        <CarouselDemo />
      </ComponentWrapper>

      <ComponentWrapper name="chart">
        <ChartDemo />
      </ComponentWrapper>

      <ComponentWrapper name="checkbox">
        <CheckboxDemo />
      </ComponentWrapper>

      <ComponentWrapper name="checkbox-cards">
        <CheckboxCardsDemo />
      </ComponentWrapper>

      <ComponentWrapper name="checkbox-group">
        <CheckboxGroupDemo />
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

      <ComponentWrapper name="command">
        <CommandDemo />
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

      <ComponentWrapper name="input-date">
        <InputDateDemo />
      </ComponentWrapper>

      <ComponentWrapper name="input-number">
        <InputNumberDemo />
      </ComponentWrapper>

      <ComponentWrapper name="input-otp">
        <InputOTPDemo />
      </ComponentWrapper>

      <ComponentWrapper name="input-password">
        <InputPasswordDemo />
      </ComponentWrapper>

      <ComponentWrapper name="input-search">
        <InputSearchDemo />
      </ComponentWrapper>

      <ComponentWrapper name="input-time">
        <InputTimeDemo />
      </ComponentWrapper>

      <ComponentWrapper name="kbd">
        <KbdDemo />
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

      <ComponentWrapper name="popover">
        <PopoverDemo />
      </ComponentWrapper>

      <ComponentWrapper name="progress">
        <ProgressDemo />
      </ComponentWrapper>

      <ComponentWrapper name="radio">
        <RadioDemo />
      </ComponentWrapper>

      <ComponentWrapper name="radio-cards">
        <RadioCardsDemo />
      </ComponentWrapper>

      <ComponentWrapper name="radio-group">
        <RadioGroupDemo />
      </ComponentWrapper>

      <ComponentWrapper name="resizable">
        <ResizableDemo />
      </ComponentWrapper>

      <ComponentWrapper name="scroll-area">
        <ScrollAreaDemo />
      </ComponentWrapper>

      <ComponentWrapper name="select">
        <SelectDemo />
      </ComponentWrapper>

      <ComponentWrapper name="separator">
        <SeparatorDemo />
      </ComponentWrapper>

      <ComponentWrapper name="sheet">
        <SheetDemo />
      </ComponentWrapper>

      <ComponentWrapper name="skeleton">
        <SkeletonDemo />
      </ComponentWrapper>

      <ComponentWrapper name="slider">
        <SliderDemo />
      </ComponentWrapper>

      <ComponentWrapper name="sonner">
        <SonnerDemo />
      </ComponentWrapper>

      <ComponentWrapper name="switch">
        <SwitchDemo />
      </ComponentWrapper>

      <ComponentWrapper name="table">
        <TableDemo />
      </ComponentWrapper>

      <ComponentWrapper name="tabs">
        <TabsDemo />
      </ComponentWrapper>

      <ComponentWrapper name="textarea">
        <TextareaDemo />
      </ComponentWrapper>

      <ComponentWrapper name="toggle">
        <ToggleDemo />
      </ComponentWrapper>

      <ComponentWrapper name="toggle-group">
        <ToggleGroupDemo />
      </ComponentWrapper>

      <ComponentWrapper name="tooltip">
        <TooltipDemo />
      </ComponentWrapper>
    </div>
  );
}
