import { z } from 'zod';

export const accountFormValues = z.object({
  name: z
    .string()
    .trim()
    .min(2, {
      message: 'Name must be at least 2 characters.',
    })
    .max(30, {
      message: 'Name must not be longer than 30 characters.',
    }),
  dob: z.coerce.date({
    required_error: 'A date of birth is required.',
  }),
  language: z
    .string({
      required_error: 'Please select a language.',
    })
    .trim(),
});

export type AccountFormValues = z.infer<typeof accountFormValues>;
