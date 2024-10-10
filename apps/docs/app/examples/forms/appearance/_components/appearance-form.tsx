'use client';

import {
  Button,
  Code,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Pre,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  toast,
} from '@codefast/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { type JSX } from 'react';
import { type SubmitHandler, useForm } from 'react-hook-form';
import { z } from 'zod';

const appearanceFormValues = z.object({
  theme: z.enum(['light', 'dark'], {
    required_error: 'Please select a theme.',
  }),
  font: z.enum(['inter', 'manrope', 'system'], {
    invalid_type_error: 'Select a font',
    required_error: 'Please select a font.',
  }),
});

type AppearanceFormValues = z.infer<typeof appearanceFormValues>;

// This can come from your database or API.
const defaultValues: Partial<AppearanceFormValues> = {
  theme: 'light',
};

export function AppearanceForm(): JSX.Element {
  const form = useForm<AppearanceFormValues>({
    resolver: zodResolver(appearanceFormValues),
    defaultValues,
  });

  const onSubmit: SubmitHandler<AppearanceFormValues> = (values): void => {
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
          name="font"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Font</FormLabel>
              <div className="relative w-max">
                <Select
                  defaultValue={field.value}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Select a font" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="inter">Inter</SelectItem>
                    <SelectItem value="manrope">Manrope</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <FormDescription>
                Set the font you want to use in the dashboard.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="theme"
          render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel>Theme</FormLabel>
              <FormDescription>
                Select the theme for the dashboard.
              </FormDescription>
              <FormMessage />
              <RadioGroup
                className="grid max-w-md grid-cols-2 gap-8 pt-2"
                defaultValue={field.value}
                onValueChange={field.onChange}
              >
                <FormItem>
                  <FormLabel className="[&:has([data-state=checked])>div]:border-primary">
                    <FormControl>
                      <RadioGroupItem className="sr-only" value="light" />
                    </FormControl>
                    <div className="border-muted hover:border-accent items-center rounded-md border-2 p-1">
                      <div className="space-y-2 rounded-sm bg-[#ecedef] p-2">
                        <div className="space-y-2 rounded-md bg-white p-2 shadow-sm">
                          <div className="h-2 w-[80px] rounded-lg bg-[#ecedef]" />
                          <div className="h-2 w-[100px] rounded-lg bg-[#ecedef]" />
                        </div>
                        <div className="flex items-center space-x-2 rounded-md bg-white p-2 shadow-sm">
                          <div className="size-4 rounded-full bg-[#ecedef]" />
                          <div className="h-2 w-[100px] rounded-lg bg-[#ecedef]" />
                        </div>
                        <div className="flex items-center space-x-2 rounded-md bg-white p-2 shadow-sm">
                          <div className="size-4 rounded-full bg-[#ecedef]" />
                          <div className="h-2 w-[100px] rounded-lg bg-[#ecedef]" />
                        </div>
                      </div>
                    </div>
                    <span className="block w-full p-2 text-center font-normal">
                      Light
                    </span>
                  </FormLabel>
                </FormItem>
                <FormItem>
                  <FormLabel className="[&:has([data-state=checked])>div]:border-primary">
                    <FormControl>
                      <RadioGroupItem className="sr-only" value="dark" />
                    </FormControl>
                    <div className="border-muted bg-popover hover:bg-accent hover:text-accent-foreground items-center rounded-md border-2 p-1">
                      <div className="space-y-2 rounded-sm bg-slate-950 p-2">
                        <div className="space-y-2 rounded-md bg-slate-800 p-2 shadow-sm">
                          <div className="h-2 w-[80px] rounded-lg bg-slate-400" />
                          <div className="h-2 w-[100px] rounded-lg bg-slate-400" />
                        </div>
                        <div className="flex items-center space-x-2 rounded-md bg-slate-800 p-2 shadow-sm">
                          <div className="size-4 rounded-full bg-slate-400" />
                          <div className="h-2 w-[100px] rounded-lg bg-slate-400" />
                        </div>
                        <div className="flex items-center space-x-2 rounded-md bg-slate-800 p-2 shadow-sm">
                          <div className="size-4 rounded-full bg-slate-400" />
                          <div className="h-2 w-[100px] rounded-lg bg-slate-400" />
                        </div>
                      </div>
                    </div>
                    <span className="block w-full p-2 text-center font-normal">
                      Dark
                    </span>
                  </FormLabel>
                </FormItem>
              </RadioGroup>
            </FormItem>
          )}
        />

        <Button type="submit">Update preferences</Button>
      </form>
    </Form>
  );
}
