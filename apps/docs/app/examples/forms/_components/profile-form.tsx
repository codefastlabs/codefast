'use client';

import { Button } from '@codefast/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@codefast/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@codefast/ui/select';
import { toast } from '@codefast/ui/sonner';
import { Textarea } from '@codefast/ui/textarea';
import { cn } from '@codefast/ui/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { type SubmitHandler, useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';
import { Pre } from '@codefast/ui/pre';
import { Code } from '@codefast/ui/code';
import { type JSX } from 'react';
import { TextInput } from '@codefast/ui/text-input';

const profileFormValues = z.object({
  username: z
    .string()
    .min(2, {
      message: 'Username must be at least 2 characters.',
    })
    .max(30, {
      message: 'Username must not be longer than 30 characters.',
    }),
  email: z
    .string({
      required_error: 'Please select an email to display.',
    })
    .email(),
  bio: z.string().max(160).min(4),
  urls: z
    .array(
      z.object({
        value: z.string().url({ message: 'Please enter a valid URL.' }),
      }),
    )
    .optional(),
});

type ProfileFormValues = z.infer<typeof profileFormValues>;

// This can come from your database or API.
const defaultValues: Partial<ProfileFormValues> = {
  bio: 'I own a computer.',
  urls: [{ value: 'https://shadcn.com' }, { value: 'https://twitter.com/shadcn' }],
};

export function ProfileForm(): JSX.Element {
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormValues),
    defaultValues,
    mode: 'onChange',
  });

  const { fields, append } = useFieldArray({
    name: 'urls',
    control: form.control,
  });

  const onSubmit: SubmitHandler<ProfileFormValues> = (values): void => {
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
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <TextInput placeholder="codefast" {...field} />
              </FormControl>
              <FormDescription>
                This is your public display name. It can be your real name or a pseudonym. You can only change this once
                every 30 days.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <Select defaultValue={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a verified email to display" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="m@example.com">m@example.com</SelectItem>
                  <SelectItem value="m@google.com">m@google.com</SelectItem>
                  <SelectItem value="m@support.com">m@support.com</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                You can manage verified email addresses in your <Link href="/examples/forms">email settings</Link>.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bio</FormLabel>
              <FormControl>
                <Textarea className="resize-none" placeholder="Tell us a little bit about yourself" {...field} />
              </FormControl>
              <FormDescription>
                You can <span>@mention</span> other users and organizations to link to them.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div>
          {fields.map(({ id }, index) => (
            <FormField
              key={id}
              control={form.control}
              name={`urls.${index}.value`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={cn(index !== 0 && 'sr-only')}>URLs</FormLabel>
                  <FormDescription className={cn(index !== 0 && 'sr-only')}>
                    Add links to your website, blog, or social media profiles.
                  </FormDescription>
                  <FormControl>
                    <TextInput {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
          <Button
            className="mt-2"
            size="sm"
            type="button"
            variant="outline"
            onClick={() => {
              append({ value: '' });
            }}
          >
            Add URL
          </Button>
        </div>
        <Button type="submit">Update profile</Button>
      </form>
    </Form>
  );
}
