"use client";

import { type HTMLAttributes, type JSX } from "react";
import { cn } from "@codefast/ui/utils";
import { usePathname } from "next/navigation";
import { ScrollArea } from "@codefast/ui/scroll-area";
import Link from "next/link";

const examples = [
  {
    name: "Mail",
    href: "/examples/mail",
  },
  {
    name: "Dashboard",
    href: "/examples/dashboard",
  },
  {
    name: "Cards",
    href: "/examples/cards",
  },
  {
    name: "Tasks",
    href: "/examples/tasks",
  },
  {
    name: "Playground",
    href: "/examples/playground",
  },
  {
    name: "Forms",
    href: "/examples/forms",
  },
  {
    name: "Music",
    href: "/examples/music",
  },
  {
    name: "Authentication",
    href: "/examples/authentication",
  },
];

type ExamplesNavProps = HTMLAttributes<HTMLDivElement>;

export function ExamplesNav({ className, ...props }: ExamplesNavProps): JSX.Element {
  const pathname = usePathname();

  return (
    <div className={cn("relative", className)} {...props}>
      <ScrollArea className="max-w-[600px] lg:max-w-none">
        <div className={cn("flex items-center", className)} {...props}>
          {examples.map((example, index) => (
            <Link
              href={example.href}
              key={example.href}
              className={cn(
                "hover:text-primary flex h-7 items-center justify-center rounded-full px-4 text-center text-sm transition-colors",
                pathname.startsWith(example.href) || (index === 0 && pathname === "/")
                  ? "bg-muted text-primary font-medium"
                  : "text-muted-foreground",
              )}
            >
              {example.name}
            </Link>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
