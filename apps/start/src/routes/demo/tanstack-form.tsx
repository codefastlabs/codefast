import { createFileRoute } from '@tanstack/react-router';
import { revalidateLogic, useForm } from '@tanstack/react-form';
import { z } from 'zod';

const formSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.email({
    error: (issue) => (issue.input === undefined ? 'Email is required' : 'Please enter a valid email address'),
  }),
  age: z.number().min(18, 'You must be at least 18 years old'),
  bio: z.string(),
});

export const Route = createFileRoute('/demo/tanstack-form')({
  component: TanStackFormDemo,
});

function TanStackFormDemo() {
  const form = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      age: 0,
      bio: '',
    },
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: formSchema,
    },
    onSubmit: async ({ value }) => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log('Form submitted:', value);
      alert(`Form submitted successfully!\n\n${JSON.stringify(value, null, 2)}`);
    },
  });

  return (
    <div className="container mx-auto max-w-2xl p-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">TanStack Form Demo</h1>
        <p className="text-muted-foreground">
          This is a demonstration of TanStack Form with validation using Zod. Open the devtools to inspect the form
          state.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void form.handleSubmit();
        }}
        className="space-y-6"
      >
        <form.Field name="firstName">
          {(field) => (
            <div className="space-y-2">
              <label htmlFor={field.name} className="block text-sm font-medium">
                First Name *
              </label>
              <input
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                placeholder="Enter your first name"
              />
              {field.state.meta.errors.length > 0 && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {typeof field.state.meta.errors[0] === 'string'
                    ? field.state.meta.errors[0]
                    : field.state.meta.errors[0]?.message}
                </p>
              )}
            </div>
          )}
        </form.Field>

        <form.Field name="lastName">
          {(field) => (
            <div className="space-y-2">
              <label htmlFor={field.name} className="block text-sm font-medium">
                Last Name *
              </label>
              <input
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                placeholder="Enter your last name"
              />
              {field.state.meta.errors.length > 0 && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {typeof field.state.meta.errors[0] === 'string'
                    ? field.state.meta.errors[0]
                    : field.state.meta.errors[0]?.message}
                </p>
              )}
            </div>
          )}
        </form.Field>

        <form.Field name="email">
          {(field) => (
            <div className="space-y-2">
              <label htmlFor={field.name} className="block text-sm font-medium">
                Email *
              </label>
              <input
                id={field.name}
                name={field.name}
                type="email"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                placeholder="Enter your email"
              />
              {field.state.meta.errors.length > 0 && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {typeof field.state.meta.errors[0] === 'string'
                    ? field.state.meta.errors[0]
                    : field.state.meta.errors[0]?.message}
                </p>
              )}
            </div>
          )}
        </form.Field>

        <form.Field name="age">
          {(field) => (
            <div className="space-y-2">
              <label htmlFor={field.name} className="block text-sm font-medium">
                Age *
              </label>
              <input
                id={field.name}
                name={field.name}
                type="number"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(Number(e.target.value))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                placeholder="Enter your age"
              />
              {field.state.meta.errors.length > 0 && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {typeof field.state.meta.errors[0] === 'string'
                    ? field.state.meta.errors[0]
                    : field.state.meta.errors[0]?.message}
                </p>
              )}
            </div>
          )}
        </form.Field>

        <form.Field name="bio">
          {(field) => (
            <div className="space-y-2">
              <label htmlFor={field.name} className="block text-sm font-medium">
                Bio (Optional)
              </label>
              <textarea
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                rows={4}
                className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                placeholder="Tell us about yourself"
              />
            </div>
          )}
        </form.Field>

        <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
          {([canSubmit, isSubmitting]) => (
            <button
              type="submit"
              disabled={!canSubmit || isSubmitting}
              className="w-full rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
          )}
        </form.Subscribe>
      </form>

      <div className="mt-8 rounded-md bg-gray-100 p-4 dark:bg-gray-800">
        <h2 className="mb-2 text-lg font-semibold">Form State</h2>
        <pre className="overflow-auto text-xs">{JSON.stringify(form.state, null, 2)}</pre>
      </div>
    </div>
  );
}
