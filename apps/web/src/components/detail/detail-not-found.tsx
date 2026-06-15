import { Button } from "@codefast/ui/button";
import { Link } from "@tanstack/react-router";

import { NotFound } from "#/components/shared/not-found";

export function ComponentDetailNotFound() {
  return (
    <NotFound
      badge="404"
      title="Component not found"
      description="We couldn’t find that component. It may have been renamed or removed."
      action={
        <Button asChild>
          <Link to="/components">Browse all components</Link>
        </Button>
      }
    />
  );
}
