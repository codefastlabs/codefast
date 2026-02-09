import { createFileRoute } from '@tanstack/react-router';
import { ExampleForm } from '@/components/sink/tanstack-form-example';

export const Route = createFileRoute('/sink/tanstack-form/')({
  component: TanstackFormPage,
  head: () => ({
    meta: [
      { title: 'TanStack Form — Components — @codefast/ui' },
      {
        name: 'description',
        content: 'Integration example of @codefast/ui form components with TanStack Form for type-safe form management.',
      },
      { property: 'og:title', content: 'TanStack Form — Components — @codefast/ui' },
      {
        property: 'og:description',
        content: 'Integration example of @codefast/ui form components with TanStack Form for type-safe form management.',
      },
      { name: 'twitter:title', content: 'TanStack Form — Components — @codefast/ui' },
      {
        name: 'twitter:description',
        content: 'Integration example of @codefast/ui form components with TanStack Form for type-safe form management.',
      },
    ],
  }),
});

function TanstackFormPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <ExampleForm />
    </div>
  );
}
