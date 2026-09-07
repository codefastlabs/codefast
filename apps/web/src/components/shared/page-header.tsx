import { cn } from "@codefast/ui/lib/utils";
import type { ComponentProps, ReactNode } from "react";

type PageHeaderProps = Omit<ComponentProps<"section">, "title"> & {
  readonly eyebrow?: ReactNode;
  readonly title: ReactNode;
  readonly description?: string;
};

/** Eyebrow → title → description pattern shared by docs and marketing pages. */
export function PageHeader({ eyebrow, title, description, className, ...props }: PageHeaderProps) {
  return (
    <section className={cn("max-w-2xl", className)} {...props}>
      {eyebrow ? <div className="mb-5">{eyebrow}</div> : null}
      <h1 className="mb-5 text-3xl leading-none font-bold tracking-tight text-ui-fg sm:text-4xl md:text-5xl md:tracking-tighter lg:text-6xl">
        {title}
      </h1>
      {description ? <p className="text-base leading-relaxed text-ui-muted">{description}</p> : null}
    </section>
  );
}
