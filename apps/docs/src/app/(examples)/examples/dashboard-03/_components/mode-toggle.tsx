"use client";

import { Button } from "@codefast/ui";
import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import type { JSX } from "react";
import { useCallback } from "react";

export function ModeToggle(): JSX.Element {
  const { setTheme, resolvedTheme } = useTheme();

  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }, [resolvedTheme, setTheme]);

  return (
    <Button className="group/toggle size-8" onClick={toggleTheme} size="icon" variant="secondary">
      <SunIcon className="hidden [html.dark_&]:block" />
      <MoonIcon className="hidden [html.light_&]:block" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
