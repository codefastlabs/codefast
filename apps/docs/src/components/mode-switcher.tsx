"use client";

import { Button } from "@codefast/ui";
import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useCallback } from "react";

import type { JSX } from "react";

import { useMetaColor } from "@/hooks/use-meta-color";
import { META_THEME_COLORS } from "@/lib/site";


export function ModeSwitcher(): JSX.Element {
  const { setTheme, resolvedTheme } = useTheme();
  const { setMetaColor } = useMetaColor();

  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
    setMetaColor(resolvedTheme === "dark" ? META_THEME_COLORS.light : META_THEME_COLORS.dark);
  }, [resolvedTheme, setTheme, setMetaColor]);

  return (
    <Button className="group/toggle h-8 w-8 px-0" onClick={toggleTheme} variant="outline">
      <SunIcon className="hidden [html.dark_&]:block" />
      <MoonIcon className="hidden [html.light_&]:block" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
