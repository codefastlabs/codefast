"use client";

import { cn } from "./utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  appName: string;
}

export function Button({
  appName,
  className,
  ...props
}: ButtonProps): React.JSX.Element {
  return (
    <button
      className={cn("rounded bg-sky-700 px-4 py-2", className)}
      onClick={() => {
        // eslint-disable-next-line -- no-alert
        alert(`Hello from your ${appName} app!`);
      }}
      type="button"
      {...props}
    />
  );
}
