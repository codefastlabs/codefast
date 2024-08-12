import { Calendar } from '@codefast/ui/calendar';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@codefast/ui/form';
import { cn } from '@codefast/ui/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@codefast/ui/popover';
import { Button } from '@codefast/ui/button';
import { CalendarIcon } from '@radix-ui/react-icons';
import { toast, Toaster } from '@codefast/ui/sonner';
import { Box } from '@codefast/ui/box';
import { Pre } from '@codefast/ui/pre';
import { Code } from '@codefast/ui/code';
import { type Meta, type StoryObj } from '@storybook/react';

const meta = {
  tags: ['autodocs'],
  title: 'Components/Dates/Calendar',
  argTypes: {
    mode: {
      control: 'inline-radio',
      description: 'Choose the selection mode.',
      type: {
        name: 'enum',
        value: ['single', 'multiple', 'range'],
      },
      table: {
        defaultValue: {
          summary: 'single',
        },
      },
    },
    captionLayout: {
      control: 'inline-radio',
      description: 'Choose the layout of the month caption.',
      type: {
        name: 'enum',
        value: ['label', 'dropdown', 'dropdown-months', 'dropdown-years'],
      },
      table: {
        defaultValue: {
          summary: 'label',
        },
      },
    },
    fixedWeeks: {
      control: 'boolean',
      description: 'Display 6 weeks per months.',
    },
    hideWeekdays: {
      control: 'boolean',
      description: 'Hide the row displaying the weekday names.',
    },
    numberOfMonths: {
      control: 'number',
      description: 'The number of displayed months.',
      table: {
        defaultValue: {
          summary: '1',
        },
      },
    },
    showOutsideDays: {
      control: 'boolean',
      description: 'Display the days falling into the other months.',
    },
    showWeekNumber: {
      control: 'boolean',
      description: 'Display the column with the week numbers.',
    },
    pagedNavigation: {
      control: 'boolean',
      description: 'Paginate the navigation.',
    },
    reverseMonths: {
      control: 'boolean',
      description: 'Render multiple months in reversed order.',
    },
  },
  args: {
    mode: 'single',
    captionLayout: 'label',
    fixedWeeks: false,
    hideWeekdays: false,
    numberOfMonths: 1,
    showOutsideDays: true,
    showWeekNumber: false,
    pagedNavigation: true,
    reverseMonths: false,
  },
} satisfies Meta<typeof Calendar>;

export default meta;

type Story = StoryObj<typeof meta>;

/* -----------------------------------------------------------------------------
 * Story: Default
 * -------------------------------------------------------------------------- */

export const Default: Story = {
  render: (args) => {
    return <Calendar {...args} />;
  },
};

/* -----------------------------------------------------------------------------
 * Story: React Hook Form
 * -------------------------------------------------------------------------- */

const FormSchema = z.object({
  dob: z.date({
    required_error: 'A date of birth is required.',
  }),
});

export const ReactHookForm: Story = {
  decorators: [
    (Story) => (
      <>
        <Story />
        <Toaster />
      </>
    ),
  ],
  render: () => {
    const form = useForm<z.infer<typeof FormSchema>>({
      resolver: zodResolver(FormSchema),
    });

    function onSubmit(data: z.infer<typeof FormSchema>): void {
      toast.message('You submitted the following values:', {
        description: (
          <Pre className="w-full rounded-md bg-slate-950 p-4">
            <Code className="text-white">{JSON.stringify(data, null, 2)}</Code>
          </Pre>
        ),
      });
    }

    return (
      <Form {...form}>
        <form className="space-y-8" onSubmit={form.handleSubmit(onSubmit)}>
          <FormField
            control={form.control}
            name="dob"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date of birth</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        className={cn('w-[240px] pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}
                        variant="outline"
                      >
                        {field.value ? format(field.value, 'PPP') : <Box as="span">Pick a date</Box>}
                        <CalendarIcon className="ml-auto size-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-auto p-0">
                    <Calendar
                      disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
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
