import type { ReactNode } from "react";

export default function ViewLayout({ children }: Readonly<{ children: ReactNode }>): ReactNode {
  return children;
}
