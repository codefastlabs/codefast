import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/api/demo/names')({
  server: {
    handlers: {
      GET: () => Response.json(['Alice', 'Bob', 'Charlie']),
    },
  },
});

