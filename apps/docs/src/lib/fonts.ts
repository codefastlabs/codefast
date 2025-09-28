import { Geist, JetBrains_Mono as JetBrainsMono } from "next/font/google";

import { cn } from "@codefast/tailwind-variants";

const fontGeistSans = Geist({
  subsets: ["latin-ext"],
  variable: "--font-geist-sans",
});

const fontJetBrainsMono = JetBrainsMono({
  subsets: ["vietnamese"],
  variable: "--font-jetbrains-mono",
});

export const fontVariables = cn(fontGeistSans.variable, fontJetBrainsMono.variable);
