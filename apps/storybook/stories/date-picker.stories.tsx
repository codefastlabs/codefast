import type { DateRange } from '@codefast/ui';
import type { Meta, StoryObj } from '@storybook/react';
import type { SubmitHandler } from 'react-hook-form';

import {
  Button,
  Calendar,
  CalendarLabel,
  CalendarRangeLabel,
  cn,
  Code,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Pre,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  toast,
  Toaster,
} from '@codefast/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarIcon } from '@radix-ui/react-icons';
import { addDays } from 'date-fns';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const meta = {
  component: Popover,
  tags: ['autodocs'],
  title: 'UI/Date Picker',
} satisfies Meta<typeof Popover>;

export default meta;

type Story = StoryObj<typeof Popover>;

/* -----------------------------------------------------------------------------
 * Story: Default
 * -------------------------------------------------------------------------- */

export const Default: Story = {
  render: (args) => {
    const [date, setDate] = useState<Date>();

    return (
      <Popover {...args}>
        <PopoverTrigger asChild>
          <Button
            className={cn('w-[17.5rem] justify-start px-3 text-left font-normal', !date && 'text-muted-foreground')}
            prefix={<CalendarIcon className="opacity-50" />}
            variant="outline"
          >
            <CalendarLabel date={date} />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-3">
          <Calendar mode="single" selected={date} onSelect={setDate} />
        </PopoverContent>
      </Popover>
    );
  },
};

/* -----------------------------------------------------------------------------
 * Story: Date Range Picker
 * -------------------------------------------------------------------------- */

export const DateRangePicker: Story = {
  render: (args) => {
    const [date, setDate] = useState<DateRange | undefined>({
      from: new Date(),
      to: addDays(new Date(), 20),
    });

    return (
      <div className="space-y-2">
        <Popover {...args}>
          <PopoverTrigger asChild>
            <Button
              className={cn('w-[18.75rem] justify-start px-3 text-left font-normal', !date && 'text-muted-foreground')}
              id="date"
              prefix={<CalendarIcon className="opacity-50" />}
              variant="outline"
            >
              <CalendarRangeLabel date={date} />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-auto p-3">
            <Calendar defaultMonth={date?.from} mode="range" numberOfMonths={2} selected={date} onSelect={setDate} />
          </PopoverContent>
        </Popover>
      </div>
    );
  },
};

/* -----------------------------------------------------------------------------
 * Story: With Presets
 * -------------------------------------------------------------------------- */

export const WithPresets: Story = {
  render: (args) => {
    const [date, setDate] = useState<Date>();

    return (
      <Popover {...args}>
        <PopoverTrigger asChild>
          <Button
            className={cn('w-[17.5rem] justify-start px-3 text-left font-normal', !date && 'text-muted-foreground')}
            prefix={<CalendarIcon className="opacity-50" />}
            variant="outline"
          >
            <CalendarLabel date={date} />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="flex w-auto flex-col space-y-2 p-2">
          <Select
            onValueChange={(value) => {
              setDate(addDays(new Date(), Number.parseInt(value)));
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Today</SelectItem>
              <SelectItem value="1">Tomorrow</SelectItem>
              <SelectItem value="3">In 3 days</SelectItem>
              <SelectItem value="7">In a week</SelectItem>
            </SelectContent>
          </Select>
          <div className="rounded-md border p-3">
            <Calendar mode="single" selected={date} onSelect={setDate} />
          </div>
        </PopoverContent>
      </Popover>
    );
  },
};

/* -----------------------------------------------------------------------------
 * Story: React Hook Form
 * -------------------------------------------------------------------------- */

export const ReactHookForm: Story = {
  decorators: [
    (Story) => (
      <>
        <Story />
        <Toaster />
      </>
    ),
  ],
  render: (args) => {
    const formValues = z.object({
      dob: z.date({
        required_error: 'A date of birth is required.',
      }),
    });

    const form = useForm<z.infer<typeof formValues>>({
      resolver: zodResolver(formValues),
    });

    const onSubmit: SubmitHandler<z.infer<typeof formValues>> = (values): void => {
      toast.message('You submitted the following values:', {
        description: (
          <Pre className="w-full rounded-md bg-slate-950 p-4">
            <Code className="text-white">{JSON.stringify(values, null, 2)}</Code>
          </Pre>
        ),
      });
    };

    return (
      <Form {...form}>
        <form className="space-y-8" onSubmit={form.handleSubmit(onSubmit)}>
          <FormField
            control={form.control}
            name="dob"
            render={({ field: { onChange, value } }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date of birth</FormLabel>
                <Popover {...args}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        className={cn(
                          'w-[15rem] justify-between px-3 text-left font-normal',
                          !value && 'text-muted-foreground',
                        )}
                        suffix={<CalendarIcon className="opacity-50" />}
                        variant="outline"
                      >
                        <CalendarLabel date={value} />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-auto p-3">
                    <Calendar
                      disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
                      mode="single"
                      selected={value}
                      onSelect={onChange}
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>Your date of birth is used to calculate your age.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit">Submit</Button>
        </form>
      </Form>
    );
  },
};
