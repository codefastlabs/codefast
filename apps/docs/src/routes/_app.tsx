import { cn } from "@codefast/tailwind-variants";
import { Link, Outlet, createFileRoute } from "@tanstack/react-router";
import Header from "#/components/header";

export const Route = createFileRoute("/_app")({
  component: MainLayout,
});

function MainLayout() {
  return (
    <>
      <Link
        to="."
        hash="main-content"
        className={cn(
          "sr-only absolute top-3 left-3 z-100",
          "px-4 py-2",
          "rounded-lg",
          "bg-primary shadow-md",
          "text-sm font-medium text-primary-foreground",
          "focus:not-sr-only focus:outline-none",
          "focus-visible:ring-2 focus-visible:ring-ring",
        )}
      >
        Skip to main content
      </Link>
      <Header />
      <main id="main-content" className="min-h-0">
        <Outlet />
      </main>
    </>
  );
}
