import { cn } from "@codefast/tailwind-variants";
import { Component } from "react";
import type { ComponentPropsWithoutRef, ErrorInfo, ReactNode } from "react";

export function ComponentWrapper({
  className,
  name,
  children,
  ...props
}: ComponentPropsWithoutRef<"div"> & { name: string }) {
  return (
    <ComponentErrorBoundary name={name}>
      <div
        id={name}
        data-name={name.toLowerCase()}
        className={cn("flex w-full flex-col", "rounded-xl border", "scroll-mt-16", className)}
        {...props}
      >
        <div className={cn("px-4 py-3", "border-b")}>
          <div className="text-sm font-medium">{getComponentName(name)}</div>
        </div>
        <div className={cn("flex flex-1 items-center gap-2", "p-4")}>{children}</div>
      </div>
    </ComponentErrorBoundary>
  );
}

class ComponentErrorBoundary extends Component<
  { children: ReactNode; name: string },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; name: string }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`Error in component ${this.props.name}:`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className={cn("p-4", "text-red-500")}>
          Something went wrong in component: {this.props.name}
        </div>
      );
    }

    return this.props.children;
  }
}

function getComponentName(name: string) {
  // convert kebab-case to title case
  return name.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}
