import { Checkbox } from '@codefast/ui/checkbox';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@codefast/ui/form';
import { toast, Toaster } from '@codefast/ui/sonner';
import Link from 'next/link';
import { Button } from '@codefast/ui/button';
import { useId } from 'react';
import { Box } from '@codefast/ui/box';
import { Label } from '@codefast/ui/label';
import { Pre } from '@codefast/ui/pre';
import { Code } from '@codefast/ui/code';
import { Text } from '@codefast/ui/text';
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
      <Box className="items-top flex space-x-2">
        <Checkbox id={id} {...args} />
        <Box className="grid gap-1.5 leading-none">
          <Label htmlFor={id}>Accept terms and conditions</Label>
          <Text className="text-muted-foreground text-sm">You agree to our Terms of Service and Privacy Policy.</Text>
        </Box>
      </Box>
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
      <Box className="flex items-center space-x-2">
        <Checkbox disabled id={id} {...args} />
        <Label htmlFor={id}>Accept terms and conditions</Label>
      </Box>
    );
  },
};

/* -----------------------------------------------------------------------------
 * Story: React Hook Form
 * -------------------------------------------------------------------------- */

const FormSchema = z.object({
  mobile: z.boolean().default(false).optional(),
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
  render: (args) => {
    const form = useForm<z.infer<typeof FormSchema>>({
      resolver: zodResolver(FormSchema),
      defaultValues: {
        mobile: true,
      },
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
        <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
          <FormField
            control={form.control}
            name="mobile"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} {...args} />
                </FormControl>
                <Box className="space-y-1 leading-none">
                  <FormLabel>Use different settings for my mobile devices</FormLabel>
                  <FormDescription>
                    You can manage your mobile notifications in the{' '}
                    <Link href="/apps/docs/public">mobile settings</Link> page.
                  </FormDescription>
                </Box>
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

const FormSchema2 = z.object({
  items: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: 'You have to select at least one item.',
  }),
});

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
    const form = useForm<z.infer<typeof FormSchema2>>({
      resolver: zodResolver(FormSchema2),
      defaultValues: {
        items: ['recents', 'home'],
      },
    });

    function onSubmit(data: z.infer<typeof FormSchema2>): void {
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
            name="items"
            render={() => (
              <FormItem>
                <Box className="mb-4">
                  <FormLabel className="text-base">Sidebar</FormLabel>
                  <FormDescription>Select the items you want to display in the sidebar.</FormDescription>
                </Box>
                {items2.map((item) => (
                  <FormField
                    key={item.id}
                    control={form.control}
                    name="items"
                    render={({ field }) => (
                      <FormItem key={item.id} className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value.includes(item.id)}
                            onCheckedChange={(checked) => {
                              checked
                                ? field.onChange([...field.value, item.id])
                                : field.onChange(field.value.filter((value) => value !== item.id));
                            }}
                            {...args}
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal">{item.label}</FormLabel>
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
