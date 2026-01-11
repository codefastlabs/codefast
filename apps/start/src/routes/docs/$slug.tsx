import { createFileRoute, notFound } from '@tanstack/react-router';
import { allDocs } from 'content-collections';
import type { JSX } from 'react';
import { Markdown } from '@/components/markdown';

export const Route = createFileRoute('/docs/$slug')({
  loader: ({ params }) => {
    const doc = allDocs.find((d) => d._meta.path === params.slug);

    if (!doc) {
      throw notFound();
    }

    return doc;
  },
  component: DocPage,
});

function DocPage(): JSX.Element {
  const doc = Route.useLoaderData();

  return (
    <div className="prose dark:prose-invert max-w-none">
      <h1>{doc.title}</h1>
      {doc.description && <p className="lead">{doc.description}</p>}
      <hr />
      <Markdown content={doc.content} className="prose" />
    </div>
  );
}
