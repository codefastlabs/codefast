import { createFileRoute } from '@tanstack/react-router';
import { ExampleForm } from '@/components/sink/tanstack-form-example';

export const Route = createFileRoute('/sink/tanstack-form/')({
  component: TanstackFormPage,
});

function TanstackFormPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <ExampleForm />
    </div>
  );
}
