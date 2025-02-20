import type { Meta, StoryObj } from '@storybook/react';
import type { SubmitHandler } from 'react-hook-form';

import {
  Button,
  CheckboxGroup,
  CheckboxGroupItem,
  Code,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Label,
  Pre,
  toast,
  Toaster,
} from '@codefast/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { useId } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const meta = {
  component: CheckboxGroup,
  tags: ['autodocs'],
  title: 'UI/Checkbox Group',
} satisfies Meta<typeof CheckboxGroup>;

export default meta;

type Story = StoryObj<typeof CheckboxGroup>;

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
      type: z.array(z.enum(['all', 'mentions', 'none']), {
        required_error: 'Please select at least one option',
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
                    <FormItem inline className="flex items-center gap-x-2">
                      <FormControl>
                        <CheckboxGroupItem value="all" />
                      </FormControl>
                      <FormLabel className="font-normal">All new messages</FormLabel>
                    </FormItem>
                    <FormItem inline className="flex items-center gap-x-2">
                      <FormControl>
                        <CheckboxGroupItem value="mentions" />
                      </FormControl>
                      <FormLabel className="font-normal">Direct messages and mentions</FormLabel>
                    </FormItem>
                    <FormItem inline className="flex items-center gap-x-2">
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
