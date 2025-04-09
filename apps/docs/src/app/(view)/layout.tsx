import type { ReactNode } from "react";

import "@/app/(app)/themes.css";

export default function ViewLayout({ children }: Readonly<{ children: ReactNode }>): ReactNode {
  return children;
}
