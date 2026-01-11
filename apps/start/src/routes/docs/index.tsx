import { Link, createFileRoute } from '@tanstack/react-router';
import { allDocs } from 'content-collections';

export const Route = createFileRoute('/docs/')({
  component: DocsIndex,
});

function DocsIndex() {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Documentation</h1>
      <p>Select a topic to get started.</p>
      <ul className="list-disc pl-5">
        {allDocs.map((doc) => (
          <li key={doc._meta.path}>
            <Link to="/docs/$slug" params={{ slug: doc._meta.path }} className="text-blue-600 hover:underline">
              {doc.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
