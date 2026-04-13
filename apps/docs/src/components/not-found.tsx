import { cn } from "@codefast/tailwind-variants";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

type NotFoundProps = {
  children?: ReactNode;
};

export function NotFound({ children }: NotFoundProps) {
  return (
    <div className={cn("space-y-2", "p-2")}>
      <div className={cn("text-gray-600", "dark:text-gray-400")}>
        {children || <p>The page you are looking for does not exist.</p>}
      </div>
      <p className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => window.history.back()}
          className={cn(
            "px-2 py-1",
            "rounded-sm",
            "bg-emerald-500 text-sm font-black text-white uppercase",
          )}
        >
          Go back
        </button>
        <Link
          to="/"
          className={cn(
            "px-2 py-1",
            "rounded-sm",
            "bg-cyan-600 text-sm font-black text-white uppercase",
          )}
        >
          Start Over
        </Link>
      </p>
    </div>
  );
}
