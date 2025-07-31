import "@/app/globals.css";

import type { JSX, ReactNode } from "react";

import { fontVariables } from "@/lib/fonts";
import { cn, Toaster } from "@codefast/ui";

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>): JSX.Element {
  return (
    <html className={cn("dark antialiased", fontVariables)} lang="en">
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
