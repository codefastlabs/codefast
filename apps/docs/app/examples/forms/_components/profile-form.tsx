'use client';

import type { JSX } from 'react';
import type { SubmitHandler } from 'react-hook-form';

import {
  Button,
  cn,
  Code,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Pre,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  toast,
} from '@codefast/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';

const profileFormValues = z.object({
  bio: z.string().max(160).min(4),
  email: z
    .string({
      required_error: 'Please select an email to display.',
    })
    .email(),
  urls: z
    .array(
      z.object({
        value: z.string().url({ message: 'Please enter a valid URL.' }),
      }),
    )
    .optional(),
  username: z
    .string()
    .min(2, {
      message: 'Username must be at least 2 characters.',
    })
    .max(30, {
      message: 'Username must not be longer than 30 characters.',
    }),
});

type ProfileFormValues = z.infer<typeof profileFormValues>;

// This can come from your database or API.
const defaultValues: Partial<ProfileFormValues> = {
  bio: 'I own a computer.',
  urls: [
    { value: 'https://github.com/codefastlabs/codefast' },
    {
      value: 'https://www.chromatic.com/library?appId=65f6e20be4fe47733636320a',
    },
  ],
};

export function ProfileForm(): JSX.Element {
  const form = useForm<ProfileFormValues>({
    defaultValues,
    mode: 'onChange',
    resolver: zodResolver(profileFormValues),
  });

  const { append, fields } = useFieldArray({
    control: form.control,
    name: 'urls',
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
                <Input placeholder="codefast" {...field} />
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
        <div className="space-y-2">
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
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}

          <Button
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
