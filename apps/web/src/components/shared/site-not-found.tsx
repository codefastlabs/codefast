import { Button } from "@codefast/ui/button";
import { Link } from "@tanstack/react-router";

import { NotFound } from "#/components/shared/not-found";

/**
 * App-wide 404. Wired to the root route's `notFoundComponent`, so every
 * unmatched path and every `notFound()` that bubbles past a route without its
 * own handler lands on the exact same screen.
 */
export function SiteNotFound() {
  return (
    <NotFound
      badge="404"
      title="Page not found"
      description="The page you’re looking for doesn’t exist or may have moved."
      action={
        <Button asChild>
          <Link to="/">Back to home</Link>
        </Button>
      }
    />
  );
}
