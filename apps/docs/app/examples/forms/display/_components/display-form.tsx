'use client';

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
  Pre,
  toast,
} from '@codefast/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { type JSX } from 'react';
import { type SubmitHandler, useForm } from 'react-hook-form';
import { z } from 'zod';

const items = [
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

const displayFormValues = z.object({
  items: z.array(z.string().trim()).min(1, 'You have to select at least one item.'),
});

type DisplayFormValues = z.infer<typeof displayFormValues>;

// This can come from your database or API.
const defaultValues: Partial<DisplayFormValues> = {
  items: ['recents', 'home'],
};

export function DisplayForm(): JSX.Element {
  const form = useForm<DisplayFormValues>({
    defaultValues,
    resolver: zodResolver(displayFormValues),
  });

  const onSubmit: SubmitHandler<DisplayFormValues> = (values): void => {
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
          name="items"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel className="text-base">Sidebar</FormLabel>
                <FormDescription>Select the items you want to display in the sidebar.</FormDescription>
              </div>
              {items.map((item) => (
                <FormField
                  key={item.id}
                  control={form.control}
                  name="items"
                  render={({ field }) => {
                    return (
                      <FormItem key={item.id} className="flex flex-row items-start space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value.includes(item.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                field.onChange([...field.value, item.id]);
                              } else {
                                field.onChange(field.value.filter((value) => value !== item.id));
                              }
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal">{item.label}</FormLabel>
                      </FormItem>
                    );
                  }}
                />
              ))}
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Update display</Button>
      </form>
    </Form>
  );
}
