import { Switch } from '@codefast/ui/switch';
import { Label } from '@codefast/ui/label';
import { useId } from 'react';
import { type SubmitHandler, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast, Toaster } from '@codefast/ui/sonner';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from '@codefast/ui/form';
import { Button } from '@codefast/ui/button';
import { Box } from '@codefast/ui/box';
import { Pre } from '@codefast/ui/pre';
import { Code } from '@codefast/ui/code';
import { Heading } from '@codefast/ui/heading';
import { type Meta, type StoryObj } from '@storybook/react';

const meta = {
  component: Switch,
  tags: ['autodocs'],
  title: 'Components/Inputs/Switch',
} satisfies Meta<typeof Switch>;

export default meta;

type Story = StoryObj<typeof meta>;

/* -----------------------------------------------------------------------------
 * Story: Default
 * -------------------------------------------------------------------------- */

export const Default: Story = {
  render: (args) => {
    const id = useId();

    return (
      <Box className="flex items-center space-x-2">
        <Switch id={`airplane-mode-${id}`} {...args} />
        <Label htmlFor={`airplane-mode-${id}`}>Airplane Mode</Label>
      </Box>
    );
  },
};

/* -----------------------------------------------------------------------------
 * Story: React Hook Form
 * -------------------------------------------------------------------------- */

const FormValues = z.object({
  marketing_emails: z.boolean().default(false).optional(),
  security_emails: z.boolean(),
});

type FormValues = z.infer<typeof FormValues>;

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
    const form = useForm<FormValues>({
      resolver: zodResolver(FormValues),
      defaultValues: {
        security_emails: true,
      },
    });

    const onSubmit: SubmitHandler<FormValues> = (values): void => {
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
        <form className="w-full space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
          <Box>
            <Heading as="h3" className="mb-4 text-lg font-medium">
              Email Notifications
            </Heading>
            <Box className="space-y-4">
              <FormField
                control={form.control}
                name="marketing_emails"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <Box className="space-y-0.5">
                      <FormLabel className="text-base">Marketing emails</FormLabel>
                      <FormDescription>Receive emails about new products, features, and more.</FormDescription>
                    </Box>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="security_emails"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <Box className="space-y-0.5">
                      <FormLabel className="text-base">Security emails</FormLabel>
                      <FormDescription>Receive emails about your account security.</FormDescription>
                    </Box>
                    <FormControl>
                      <Switch aria-readonly disabled checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </Box>
          </Box>
          <Button type="submit">Submit</Button>
        </form>
      </Form>
    );
  },
};
