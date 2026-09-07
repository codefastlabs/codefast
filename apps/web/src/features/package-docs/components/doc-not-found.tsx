import { Button } from "@codefast/ui/button";
import { Link } from "@tanstack/react-router";

import { NotFound } from "#/components/shared/not-found";

/** 404 body for `/docs/*` — an unknown package or a document the package does not publish. */
export function DocNotFound() {
  return (
    <NotFound
      badge="404"
      title="No such document"
      description="This package does not publish that page, or the package name is wrong."
      action={
        <Button asChild>
          <Link to="/docs">Browse packages</Link>
        </Button>
      }
    />
  );
}
