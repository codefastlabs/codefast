import { z } from 'zod';

export const addons = [
  {
    id: 'analytics',
    title: 'Analytics',
    description: 'Advanced analytics and reporting',
  },
  {
    id: 'backup',
    title: 'Backup',
    description: 'Automated daily backups',
  },
  {
    id: 'support',
    title: 'Priority Support',
    description: '24/7 premium customer support',
  },
] as const;

export const exampleFormSchema = z.object({
  name: z
    .string({
      error: (issue) => (issue.input === undefined ? 'Name is required' : 'Name must be a string'),
    })
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .refine((value) => !/\d/.test(value), {
      message: 'Name must not contain numbers',
    }),
  email: z.email({
    error: (issue) => (issue.input === undefined ? 'Email is required' : 'Please enter a valid email address'),
  }),
  plan: z
    .string({
      error: (issue) => (issue.input === undefined ? 'Please select a subscription plan' : undefined),
    })
    .min(1, 'Please select a subscription plan')
    .refine((value) => value === 'basic' || value === 'pro', {
      message: 'Invalid plan selection. Please choose Basic or Pro',
    }),
  billingPeriod: z
    .string({
      error: (issue) => (issue.input === undefined ? 'Please select a billing period' : undefined),
    })
    .min(1, 'Please select a billing period'),
  addons: z.array(z.string()).min(1, 'Please select at least one add-on').max(3, 'You can select up to 3 add-ons'),
  teamSize: z.number().min(1).max(10),
  emailNotifications: z.boolean({
    error: (issue) => (issue.input === undefined ? 'Please choose email notification preference' : undefined),
  }),
  comments: z
    .string()
    .min(10, 'Comments must be at least 10 characters')
    .max(240, 'Comments must not exceed 240 characters'),
  startDate: z
    .date({
      error: (issue) => (issue.input === undefined ? 'Please select a start date' : 'Invalid date format'),
    })
    .min(new Date(), 'Start date cannot be in the past')
    .refine(
      (date) => {
        const now = new Date();
        const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        return date <= oneWeekFromNow;
      },
      {
        message: 'Start date must be within the current week',
      },
    ),
  theme: z
    .string({
      error: (issue) => (issue.input === undefined ? 'Please select a theme' : undefined),
    })
    .min(1, 'Please select a theme'),
  password: z
    .string({
      error: (issue) => (issue.input === undefined ? 'Password is required' : undefined),
    })
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
      error: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
    }),
});
