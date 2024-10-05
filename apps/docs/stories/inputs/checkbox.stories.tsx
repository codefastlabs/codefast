import {
  Button,
  Checkbox,
  Code,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Label,
  Pre,
  Text,
  toast,
  Toaster,
} from '@codefast/ui';
import { type SubmitHandler, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useId } from 'react';
import { type Meta, type StoryObj } from '@storybook/react';

const meta = {
  component: Checkbox,
  tags: ['autodocs'],
  title: 'Components/Inputs/Checkbox',
} satisfies Meta<typeof Checkbox>;

export default meta;

type Story = StoryObj<typeof meta>;

/* -----------------------------------------------------------------------------
 * Story: Default
 * -------------------------------------------------------------------------- */

export const Default: Story = {
  render: (args) => {
    const id = useId();

    return (
      <div className="items-top flex space-x-2">
        <Checkbox id={id} {...args} />
        <div className="grid gap-1.5 leading-none">
          <Label htmlFor={id}>Accept terms and conditions</Label>
          <Text className="text-muted-foreground text-sm">
            You agree to our Terms of Service and Privacy Policy.
          </Text>
        </div>
      </div>
    );
  },
};

/* -----------------------------------------------------------------------------
 * Story: Disabled
 * -------------------------------------------------------------------------- */

export const Disabled: Story = {
  render: (args) => {
    const id = useId();

    return (
      <div className="flex items-center space-x-2">
        <Checkbox disabled id={id} {...args} />
        <Label htmlFor={id}>Accept terms and conditions</Label>
      </div>
    );
  },
};

/* -----------------------------------------------------------------------------
 * Story: React Hook Form
 * -------------------------------------------------------------------------- */

const formValues = z.object({
  mobile: z.boolean().default(false).optional(),
});

type FormValues = z.infer<typeof formValues>;

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
    const form = useForm<FormValues>({
      resolver: zodResolver(formValues),
      defaultValues: {
        mobile: true,
      },
    });

    const onSubmit: SubmitHandler<FormValues> = (values): void => {
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
        <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
          <FormField
            control={form.control}
            name="mobile"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    {...args}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    Use different settings for my mobile devices
                  </FormLabel>
                  <FormDescription>
                    You can manage your mobile notifications in the{' '}
                    <Link href="/apps/docs/public">mobile settings</Link> page.
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
          <Button type="submit">Submit</Button>
        </form>
      </Form>
    );
  },
};

/* -----------------------------------------------------------------------------
 * Story: React Hook Form 2
 * -------------------------------------------------------------------------- */

const items2 = [
  {
    id: 'recents',
    label: 'Recents',
  },
  {
    id: 'home',
    label: 'Home',
  },
  {
    id: 'applications',
    label: 'Applications',
  },
  {
    id: 'desktop',
    label: 'Desktop',
  },
  {
    id: 'downloads',
    label: 'Downloads',
  },
  {
    id: 'documents',
    label: 'Documents',
  },
] as const;

const FormValues2 = z.object({
  items: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: 'You have to select at least one item.',
  }),
});

type FormValues2 = z.infer<typeof FormValues2>;

export const ReactHookForm2: Story = {
  decorators: [
    (Story) => (
      <>
        <Story />
        <Toaster />
      </>
    ),
  ],
  render: (args) => {
    const form = useForm<FormValues2>({
      resolver: zodResolver(FormValues2),
      defaultValues: {
        items: ['recents', 'home'],
      },
    });

    const onSubmit: SubmitHandler<FormValues2> = (values): void => {
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
            name="items"
            render={() => (
              <FormItem>
                <div className="mb-4">
                  <FormLabel className="text-base">Sidebar</FormLabel>
                  <FormDescription>
                    Select the items you want to display in the sidebar.
                  </FormDescription>
                </div>
                {items2.map((item) => (
                  <FormField
                    key={item.id}
                    control={form.control}
                    name="items"
                    render={({ field }) => (
                      <FormItem
                        key={item.id}
                        className="flex flex-row items-center space-x-3 space-y-0"
                      >
                        <FormControl>
                          <Checkbox
                            checked={field.value.includes(item.id)}
                            onCheckedChange={(checked) => {
                              checked
                                ? field.onChange([...field.value, item.id])
                                : field.onChange(
                                    field.value.filter(
                                      (value) => value !== item.id,
                                    ),
                                  );
                            }}
                            {...args}
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal">
                          {item.label}
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                ))}
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
