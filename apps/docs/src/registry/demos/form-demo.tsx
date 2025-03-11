'use client';

import type { JSX } from 'react';

import {
  Button,
  Calendar,
  CalendarLabel,
  Checkbox,
  cn,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Textarea,
  toast,
} from '@codefast/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { isEmpty } from 'lodash-es';
import { CalendarIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
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

const FormSchema = z.object({
  username: z.string().min(2, {
    message: 'Username must be at least 2 characters.',
  }),
  bio: z
    .string()
    .min(10, {
      message: 'Bio must be at least 10 characters.',
    })
    .max(160, {
      message: 'Bio must not be longer than 30 characters.',
    }),
  email: z
    .string({
      required_error: 'Please select an email to display.',
    })
    .email(),
  type: z.enum(['all', 'mentions', 'none'], {
    required_error: 'You need to select a notification type.',
  }),
  mobile: z.boolean().default(false).optional(),
  items: z.array(z.string()).refine((value) => value.some(Boolean), {
    message: 'You have to select at least one item.',
  }),
  dob: z.date({
    required_error: 'A date of birth is required.',
  }),
  marketing_emails: z.boolean().default(false).optional(),
  security_emails: z.boolean(),
});

export function FormDemo(): JSX.Element {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      username: '',
      items: ['recents', 'home'],
    },
  });

  function onSubmit(data: z.infer<typeof FormSchema>): void {
    toast('You submitted the following values:', {
      description: (
        <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
          <code className="text-white">{JSON.stringify(data, null, 2)}</code>
        </pre>
      ),
    });
  }

  return (
    <Form {...form}>
      <form className="grid w-full max-w-sm gap-6" onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>

              <FormControl>
                <Input placeholder="@codefast/ui" {...field} />
              </FormControl>

              <FormDescription>This is your public display name.</FormDescription>

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
                  <SelectItem value="m1@example.com">m@example.com</SelectItem>

                  <SelectItem value="m2@google.com">m@google.com</SelectItem>

                  <SelectItem value="m3@support.com">m@support.com</SelectItem>
                </SelectContent>
              </Select>

              <FormDescription>You can manage email addresses in your email settings.</FormDescription>

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
                You can <span>@mention</span> other users and organizations.
              </FormDescription>

              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem className="flex flex-col gap-3">
              <FormLabel>Notify me about...</FormLabel>

              <FormControl>
                <RadioGroup className="flex flex-col gap-3" defaultValue={field.value} onValueChange={field.onChange}>
                  <FormItem className="flex items-center gap-3">
                    <FormControl>
                      <RadioGroupItem value="all" />
                    </FormControl>

                    <FormLabel className="font-normal">All new messages</FormLabel>
                  </FormItem>

                  <FormItem className="flex items-center gap-3">
                    <FormControl>
                      <RadioGroupItem value="mentions" />
                    </FormControl>

                    <FormLabel className="font-normal">Direct messages and mentions</FormLabel>
                  </FormItem>

                  <FormItem className="flex items-center gap-3">
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

        <FormField
          control={form.control}
          name="mobile"
          render={({ field }) => (
            <FormItem className="shadow-xs flex flex-row items-start gap-3 rounded-md border p-4">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>

              <div className="flex flex-col gap-1">
                <FormLabel className="leading-snug">Use different settings for my mobile devices</FormLabel>

                <FormDescription className="leading-snug">
                  You can manage your mobile notifications in the mobile settings page.
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="items"
          render={() => (
            <FormItem className="flex flex-col gap-4">
              <div>
                <FormLabel className="text-base">Sidebar</FormLabel>

                <FormDescription>Select the items you want to display in the sidebar.</FormDescription>
              </div>

              <div className="flex flex-col gap-2">
                {items.map((item) => (
                  <FormField
                    key={item.id}
                    control={form.control}
                    name="items"
                    render={({ field }) => {
                      return (
                        <FormItem key={item.id} className="flex items-start gap-3">
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

                          <FormLabel className="text-sm font-normal leading-tight">{item.label}</FormLabel>
                        </FormItem>
                      );
                    }}
                  />
                ))}
              </div>

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
                        'w-[240px] pl-3 text-left font-normal',
                        isEmpty(field.value) && 'text-muted-foreground',
                      )}
                      variant="outline"
                    >
                      <CalendarLabel date={field.value} />

                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
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

        <div>
          <h3 className="mb-4 text-lg font-medium">Email Notifications</h3>

          <div className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="marketing_emails"
              render={({ field }) => (
                <FormItem className="shadow-xs flex flex-row items-start justify-between rounded-lg border p-4">
                  <div className="flex flex-col gap-0.5">
                    <FormLabel className="leading-normal">Marketing emails</FormLabel>

                    <FormDescription className="leading-snug">
                      Receive emails about new products, features, and more.
                    </FormDescription>
                  </div>

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
                <FormItem className="shadow-xs flex flex-row items-start justify-between rounded-lg border p-4">
                  <div className="flex flex-col gap-0.5 opacity-60">
                    <FormLabel className="leading-normal">Security emails</FormLabel>

                    <FormDescription className="leading-snug">
                      Receive emails about your account security.
                    </FormDescription>
                  </div>

                  <FormControl>
                    <Switch aria-readonly disabled checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>

        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}
