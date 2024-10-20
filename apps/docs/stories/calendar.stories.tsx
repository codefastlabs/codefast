import {
  Button,
  Calendar,
  CalendarLabel,
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
  toast,
  Toaster,
} from '@codefast/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarIcon } from '@radix-ui/react-icons';
import { type Meta, type StoryObj } from '@storybook/react';
import { type SubmitHandler, useForm } from 'react-hook-form';
import { z } from 'zod';

const meta = {
  argTypes: {
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
    disableNavigation: {
      control: 'boolean',
      description: 'Disable the navigation buttons.',
    },
    fixedWeeks: {
      control: 'boolean',
      description: 'Display 6 weeks per months.',
    },
    hideNavigation: {
      control: 'boolean',
      description: 'Hide the navigation buttons.',
    },
    hideWeekdays: {
      control: 'boolean',
      description: 'Hide the row displaying the weekday names.',
    },
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
    numberOfMonths: {
      control: 'number',
      description: 'The number of displayed months.',
      table: {
        defaultValue: {
          summary: '1',
        },
      },
    },
    pagedNavigation: {
      control: 'boolean',
      description: 'Paginate the navigation.',
    },
    reverseMonths: {
      control: 'boolean',
      description: 'Render multiple months in reversed order.',
    },
    showOutsideDays: {
      control: 'boolean',
      description: 'Display the days falling into the other months.',
    },
    showWeekNumber: {
      control: 'boolean',
      description: 'Display the column with the week numbers.',
    },
  },
  args: {
    captionLayout: 'label',
    disableNavigation: false,
    fixedWeeks: false,
    hideNavigation: false,
    hideWeekdays: false,
    mode: 'single',
    numberOfMonths: 1,
    pagedNavigation: false,
    reverseMonths: false,
    showOutsideDays: false,
    showWeekNumber: false,
  },
  tags: ['autodocs'],
  title: 'UI/Calendar',
} satisfies Meta<typeof Calendar>;

export default meta;

type Story = StoryObj<typeof Calendar>;

export const Default: Story = {
  render: (args) => {
    return <Calendar {...args} />;
  },
};

export const NoMode: Story = {
  args: {
    mode: undefined,
  },
  render: (args) => {
    return <Calendar {...args} />;
  },
};

export const Footer: Story = {
  render: (args) => {
    return <Calendar {...args} footer="Please pick a date." />;
  },
};

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
    const formValues = z.object({
      dob: z.date({
        required_error: 'A date of birth is required.',
      }),
    });

    const form = useForm<z.infer<typeof formValues>>({
      resolver: zodResolver(formValues),
    });

    const onSubmit: SubmitHandler<z.infer<typeof formValues>> = (
      values,
    ): void => {
      toast.message('You submitted the following values:', {
        description: (
          <Pre className="w-full rounded-md bg-slate-950 p-4">
            <Code className="text-white">
              {JSON.stringify(values, null, 2)}
            </Code>
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
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date of birth</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        className={cn(
                          'w-[240px] justify-between pl-3 text-left font-normal',
                          !field.value && 'text-muted-foreground',
                        )}
                        suffix={<CalendarIcon className="opacity-50" />}
                        variant="outline"
                      >
                        <CalendarLabel date={field.value} />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-auto p-0">
                    <Calendar
                      disabled={(date) =>
                        date > new Date() || date < new Date('1900-01-01')
                      }
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  Your date of birth is used to calculate your age.
                </FormDescription>
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
