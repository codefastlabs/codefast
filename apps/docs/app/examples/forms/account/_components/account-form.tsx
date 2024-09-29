'use client';

import {
  Button,
  Calendar,
  cn,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
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
  TextInput,
  toast,
} from '@codefast/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarIcon, CaretSortIcon, CheckIcon } from '@radix-ui/react-icons';
import { format } from 'date-fns';
import { type SubmitHandler, useForm } from 'react-hook-form';
import isNil from 'lodash/isNil';
import { type JSX } from 'react';
import { accountFormValues, type AccountFormValues } from '@/app/examples/forms/account/_lib/schema/account-schema';
import { updateAccount } from '@/app/examples/forms/account/_lib/actions/account-actions';

const languages = [
  { label: 'English', value: 'en' },
  { label: 'French', value: 'fr' },
  { label: 'German', value: 'de' },
  { label: 'Spanish', value: 'es' },
  { label: 'Portuguese', value: 'pt' },
  { label: 'Russian', value: 'ru' },
  { label: 'Japanese', value: 'ja' },
  { label: 'Korean', value: 'ko' },
  { label: 'Chinese', value: 'zh' },
] as const;

// This can come from your database or API.
const defaultValues: Partial<AccountFormValues> = {
  // name: "Your name",
  // dob: new Date("2023-01-23"),
};

export function AccountForm(): JSX.Element {
  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormValues),
    defaultValues,
  });

  const onSubmit: SubmitHandler<AccountFormValues> = async (values): Promise<void> => {
    const response = await updateAccount(values);

    if (response.ok) {
      toast.success(response.data.message);

      return;
    }

    toast.error(response.error.message);

    if (!response.error.errors) {
      return;
    }

    Object.entries(response.error.errors).forEach(([field, error]) => {
      form.setError(field as keyof AccountFormValues, { type: 'manual', message: error.at(0) });
    });
  };

  return (
    <Form {...form}>
      <form className="space-y-8" onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <TextInput
                  placeholder="Your name"
                  {...field}
                  disabled={field.disabled ?? form.formState.isSubmitting}
                />
              </FormControl>
              <FormDescription>This is the name that will be displayed on your profile and in emails.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
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
                        'w-56 justify-between pl-3 text-left font-normal',
                        isNil(field.value) && 'text-muted-foreground',
                      )}
                      disabled={field.disabled ?? form.formState.isSubmitting}
                      suffix={<CalendarIcon className="size-4 opacity-50" />}
                      variant="outline"
                    >
                      {/* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- default value might be undefined */}
                      {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
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
        <FormField
          control={form.control}
          name="language"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Language</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      className={cn('w-56 justify-between', !field.value && 'text-muted-foreground')}
                      disabled={field.disabled ?? form.formState.isSubmitting}
                      role="combobox"
                      suffix={<CaretSortIcon className="opacity-50" />}
                      variant="outline"
                    >
                      {field.value
                        ? languages.find((language) => language.value === field.value)?.label
                        : 'Select language'}
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-0">
                  <Command>
                    <CommandInput placeholder="Search language..." />
                    <CommandList>
                      <CommandEmpty>No language found.</CommandEmpty>
                      <CommandGroup>
                        {languages.map((language) => (
                          <CommandItem
                            key={language.value}
                            value={language.label}
                            onSelect={() => {
                              field.onChange(language.value);
                            }}
                          >
                            <CheckIcon
                              className={cn(
                                'mr-2 size-4',
                                language.value === field.value ? 'opacity-100' : 'opacity-0',
                              )}
                            />
                            {language.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <FormDescription>This is the language that will be used in the dashboard.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button loading={form.formState.isSubmitting} type="submit">
          Update account
        </Button>
      </form>
    </Form>
  );
}
