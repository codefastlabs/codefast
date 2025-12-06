import { createFileRoute } from '@tanstack/react-router';
import { ExampleForm } from '@/components/sink/start-form-example';

export const Route = createFileRoute('/sink/start-form/')({
  component: StartFormPage,
});

function StartFormPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <ExampleForm />
    </div>
  );
}

