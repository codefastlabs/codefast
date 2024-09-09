import { RadioGroup, RadioGroupItem } from '@codefast/ui/radio-group';
import { Label } from '@codefast/ui/label';
import { useId } from 'react';
import { type SubmitHandler, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast, Toaster } from '@codefast/ui/sonner';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@codefast/ui/form';
import { Button } from '@codefast/ui/button';
import { Box } from '@codefast/ui/box';
import { Pre } from '@codefast/ui/pre';
import { Code } from '@codefast/ui/code';
import { type Meta, type StoryObj } from '@storybook/react';

const meta = {
  component: RadioGroup,
  tags: ['autodocs'],
  title: 'Components/Inputs/Radio Group',
} satisfies Meta<typeof RadioGroup>;

export default meta;

type Story = StoryObj<typeof meta>;

/* -----------------------------------------------------------------------------
 * Story: Default
 * -------------------------------------------------------------------------- */

export const Default: Story = {
  render: () => {
    const id = useId();

    return (
      <RadioGroup defaultValue="comfortable">
        <Box className="flex items-center gap-2">
          <RadioGroupItem id={`r1-${id}`} value="default" />
          <Label htmlFor={`r1-${id}`}>Default</Label>
        </Box>
        <Box className="flex items-center gap-2">
          <RadioGroupItem id={`r2-${id}`} value="comfortable" />
          <Label htmlFor={`r2-${id}`}>Comfortable</Label>
        </Box>
        <Box className="flex items-center gap-2">
          <RadioGroupItem id={`r3-${id}`} value="compact" />
          <Label htmlFor={`r3-${id}`}>Compact</Label>
        </Box>
        <Box className="flex items-center gap-2">
          <RadioGroupItem disabled id={`r4-${id}`} value="disabled" />
          <Label htmlFor={`r4-${id}`}>Disabled</Label>
        </Box>
      </RadioGroup>
    );
  },
};

/* -----------------------------------------------------------------------------
 * Story: React Hook Form
 * -------------------------------------------------------------------------- */

const formValues = z.object({
  type: z.enum(['all', 'mentions', 'none'], {
    required_error: 'You need to select a notification type.',
  }),
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
  render: () => {
    const form = useForm<FormValues>({
      resolver: zodResolver(formValues),
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
        <form className="w-2/3 space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Notify me about...</FormLabel>
                <FormControl>
                  <RadioGroup
                    className="flex flex-col space-y-1"
                    defaultValue={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="all" />
                      </FormControl>
                      <FormLabel className="font-normal">All new messages</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="mentions" />
                      </FormControl>
                      <FormLabel className="font-normal">Direct messages and mentions</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="none" />
                      </FormControl>
                      <FormLabel className="font-normal">Nothing</FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
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
