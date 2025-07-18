"use client";

import type { ComponentProps, JSX } from "react";

import { getComponentName } from "@/lib/utils";
import { cn } from "@codefast/ui";

export function ComponentWrapper({
  children,
  className,
  classNames,
  name,
  ...props
}: ComponentProps<"div"> & {
  name: string;
  classNames?: {
    body?: string;
    container?: string;
    header?: string;
  };
}): JSX.Element {
  return (
    <div
      className={cn(
        "scroll-mt-18.25 shadow-xs flex w-full min-w-0 flex-col rounded-lg border",
        classNames?.container,
        className,
      )}
      data-name={name.toLowerCase()}
      id={name}
      {...props}
    >
      <div className={cn("bg-muted/20 rounded-t-lg border-b px-4 py-3", classNames?.header)}>
        <div className="text-sm font-medium">{getComponentName(name)}</div>
      </div>
      <div className={cn("flex flex-1 flex-col items-center gap-2 p-4", classNames?.body)}>
        {children}
      </div>
    </div>
  );
}
