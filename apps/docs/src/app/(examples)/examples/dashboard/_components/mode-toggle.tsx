"use client";

import { Button } from "@codefast/ui";
import { IconBrightness } from "@tabler/icons-react";
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
      <IconBrightness />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
