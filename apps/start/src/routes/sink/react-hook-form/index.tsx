import { createFileRoute } from '@tanstack/react-router';
import { ExampleForm } from '@/components/sink/react-hook-form-example';

export const Route = createFileRoute('/sink/react-hook-form/')({
  component: ReactHookFormPage,
});

function ReactHookFormPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <ExampleForm />
    </div>
  );
}

