import { Link, useNavigate } from "@tanstack/react-router";

import { BrandMark } from "#/features/brand/components/brand-mark";
import { BrandWordmark } from "#/features/brand/components/brand-wordmark";

/** Mark + wordmark linking home; a right-click opens the brand page instead of the browser menu. */
export function Logo() {
  const navigate = useNavigate();

  return (
    <Link
      to="/"
      className="flex shrink-0 items-center gap-1.5 no-underline"
      aria-label="Codefast Labs home"
      onContextMenu={(event) => {
        event.preventDefault();
        void navigate({ to: "/brand" });
      }}
    >
      <BrandMark small className="size-4 text-ui-fg" />
      <BrandWordmark className="text-sm text-ui-fg" />
    </Link>
  );
}
