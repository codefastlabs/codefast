'use client';

import { Button } from '@codefast/ui/button';
import { Calendar } from '@codefast/ui/calendar';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@codefast/ui/command';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@codefast/ui/form';
import { Input } from '@codefast/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@codefast/ui/popover';
import { toast } from '@codefast/ui/sonner';
import { cn } from '@codefast/ui/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarIcon, CaretSortIcon, CheckIcon } from '@radix-ui/react-icons';
import { format } from 'date-fns';
import { type JSX } from 'react';
import { type SubmitHandler, useForm } from 'react-hook-form';
import isNil from 'lodash/isNil';
import {
  accountFormSchema,
  type AccountFormValues,
} from '@/app/examples/forms/account/schemata/account';
import updateAccount from '@/app/examples/forms/account/actions/account';

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
    resolver: zodResolver(accountFormSchema),
    defaultValues,
  });

  const onSubmit: SubmitHandler<AccountFormValues> = async (
    data,
  ): Promise<void> => {
    const { message, errors, success } = await updateAccount(data);

    if (success) {
      toast.success(message);
      return;
    }

    toast.error(message);

    if (!errors) {
      return;
    }

    Object.entries(errors).forEach(([field, error]) => {
      form.setError(field as keyof AccountFormValues, {
        type: 'manual',
        message: error[0],
      });
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="Your name"
                  {...field}
                  disabled={field.disabled ?? form.formState.isSubmitting}
                />
              </FormControl>
              <FormDescription>
                This is the name that will be displayed on your profile and in
                emails.
              </FormDescription>
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
                      variant="outline"
                      className={cn(
                        'w-56 pl-3 text-left font-normal',
                        isNil(field.value) && 'text-muted-foreground',
                      )}
                      disabled={field.disabled ?? form.formState.isSubmitting}
                    >
                      {/* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- default value might be undefined */}
                      {field.value ? (
                        format(field.value, 'PPP')
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto size-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) =>
                      date > new Date() || date < new Date('1900-01-01')
                    }
                    initialFocus
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
                      variant="outline"
                      role="combobox"
                      className={cn(
                        'w-56 justify-between',
                        !field.value && 'text-muted-foreground',
                      )}
                      disabled={field.disabled ?? form.formState.isSubmitting}
                    >
                      {field.value
                        ? languages.find(
                            (language) => language.value === field.value,
                          )?.label
                        : 'Select language'}
                      <CaretSortIcon className="ml-2 size-4 shrink-0 opacity-50" />
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
                            value={language.label}
                            key={language.value}
                            onSelect={() => {
                              field.onChange(language.value);
                            }}
                          >
                            <CheckIcon
                              className={cn(
                                'mr-2 size-4',
                                language.value === field.value
                                  ? 'opacity-100'
                                  : 'opacity-0',
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
              <FormDescription>
                This is the language that will be used in the dashboard.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" loading={form.formState.isSubmitting}>
          Update account
        </Button>
      </form>
    </Form>
  );
}
