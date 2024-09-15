import { CheckboxGroup, CheckboxGroupItem } from '@codefast/ui/checkbox-group';
import { useId } from 'react';
import { Label } from '@codefast/ui/label';
import { z } from 'zod';
import { toast, Toaster } from '@codefast/ui/sonner';
import { zodResolver } from '@hookform/resolvers/zod';
import { type SubmitHandler, useForm } from 'react-hook-form';
import { Pre } from '@codefast/ui/pre';
import { Code } from '@codefast/ui/code';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@codefast/ui/form';
import { Button } from '@codefast/ui/button';
import { type Meta, type StoryObj } from '@storybook/react';

const meta = {
  component: CheckboxGroup,
  tags: ['autodocs'],
  title: 'Components/Inputs/Checkbox Group',
} satisfies Meta<typeof CheckboxGroup>;

export default meta;

type Story = StoryObj<typeof meta>;

/* -----------------------------------------------------------------------------
 * Story: Default
 * -------------------------------------------------------------------------- */

export const Default: Story = {
  render: () => {
    const id = useId();

    return (
      <CheckboxGroup defaultValue={['comfortable']}>
        <div className="flex items-center gap-2">
          <CheckboxGroupItem id={`r1-${id}`} value="default" />
          <Label htmlFor={`r1-${id}`}>Default</Label>
        </div>
        <div className="flex items-center gap-2">
          <CheckboxGroupItem id={`r2-${id}`} value="comfortable" />
          <Label htmlFor={`r2-${id}`}>Comfortable</Label>
        </div>
        <div className="flex items-center gap-2">
          <CheckboxGroupItem id={`r3-${id}`} value="compact" />
          <Label htmlFor={`r3-${id}`}>Compact</Label>
        </div>
        <div className="flex items-center gap-2">
          <CheckboxGroupItem disabled id={`r4-${id}`} value="disabled" />
          <Label htmlFor={`r4-${id}`}>Disabled</Label>
        </div>
      </CheckboxGroup>
    );
  },
};

/* -----------------------------------------------------------------------------
 * Story: React Hook Form
 * -------------------------------------------------------------------------- */

const formValues = z.object({
  type: z.array(z.enum(['all', 'mentions', 'none']), {
    required_error: 'Please select at least one option',
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
                  <CheckboxGroup
                    className="flex flex-col space-y-1"
                    defaultValue={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <CheckboxGroupItem value="all" />
                      </FormControl>
                      <FormLabel className="font-normal">All new messages</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <CheckboxGroupItem value="mentions" />
                      </FormControl>
                      <FormLabel className="font-normal">Direct messages and mentions</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <CheckboxGroupItem value="none" />
                      </FormControl>
                      <FormLabel className="font-normal">Nothing</FormLabel>
                    </FormItem>
                  </CheckboxGroup>
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
