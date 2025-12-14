import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';

export const Route = createFileRoute('/api/demo/names')({
  server: {
    handlers: {
      GET: () => json(['Alice', 'Bob', 'Charlie']),
    },
  },
});

