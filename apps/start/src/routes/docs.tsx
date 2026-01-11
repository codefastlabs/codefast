import { Link, Outlet, createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/docs')({
  component: DocsLayout,
});

function DocsLayout() {
  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 border-r p-4 md:block">
        <nav className="flex flex-col gap-2">
          <div className="mb-2 font-bold">Docs</div>
          <Link to="/docs" className="hover:underline">
            Introduction
          </Link>
          {/* We can list other docs here or dynamic list */}
        </nav>
      </aside>
      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
}
