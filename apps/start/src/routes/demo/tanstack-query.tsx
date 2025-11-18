import { useCallback, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { queryOptions, useMutation, useSuspenseQuery } from '@tanstack/react-query';

type Todo = {
  id: number;
  name: string;
};

export function todosQueryOptions() {
  return queryOptions({
    queryKey: ['todos'],
    queryFn: async (): Promise<Array<Todo>> => {
      const response = await fetch('/demo/api/tq-todos');

      if (!response.ok) {
        throw new Error('Failed to fetch todos');
      }

      return response.json();
    },
  });
}

export const Route = createFileRoute('/demo/tanstack-query')({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(todosQueryOptions());
  },
  component: TanStackQueryDemo,
});

function TanStackQueryDemo() {
  const { data, refetch } = useSuspenseQuery(todosQueryOptions());

  const { mutate: addTodo } = useMutation({
    mutationFn: async (todo: string): Promise<Todo> => {
      const response = await fetch('/demo/api/tq-todos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(todo),
      });

      if (!response.ok) {
        throw new Error('Failed to add todo');
      }

      return response.json();
    },
    onSuccess: () => refetch(),
  });

  const [todo, setTodo] = useState('');

  const submitTodo = useCallback(() => {
    addTodo(todo);
    setTodo('');
  }, [addTodo, todo]);

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-gradient-to-br from-red-900 via-red-800 to-black p-4 text-white"
      style={{
        backgroundImage: 'radial-gradient(50% 50% at 80% 20%, #3B021F 0%, #7B1028 60%, #1A000A 100%)',
      }}
    >
      <div className="w-full max-w-2xl rounded-xl border-8 border-black/10 bg-black/50 p-8 shadow-xl backdrop-blur-md">
        <h1 className="mb-4 text-2xl">TanStack Query Todos list</h1>
        <ul className="mb-4 space-y-2">
          {data.map((t) => (
            <li key={t.id} className="rounded-lg border border-white/20 bg-white/10 p-3 shadow-md backdrop-blur-sm">
              <span className="text-lg text-white">{t.name}</span>
            </li>
          ))}
        </ul>
        <div className="flex flex-col gap-2">
          <input
            type="text"
            value={todo}
            onChange={(event) => setTodo(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                submitTodo();
              }
            }}
            placeholder="Enter a new todo..."
            className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/60 backdrop-blur-sm focus:border-transparent focus:ring-2 focus:ring-blue-400 focus:outline-none"
          />
          <button
            disabled={todo.trim().length === 0}
            onClick={submitTodo}
            className="rounded-lg bg-blue-500 px-4 py-3 font-bold text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-blue-500/50"
          >
            Add todo
          </button>
        </div>
      </div>
    </div>
  );
}
