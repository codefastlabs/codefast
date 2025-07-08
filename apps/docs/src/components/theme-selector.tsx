"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@codefast/ui";

import { useThemeConfig } from "@/components/active-theme";
import { THEMES } from "@/lib/themes";

import type { JSX } from "react";

export function ThemeSelector(): JSX.Element {
  const { activeTheme, setActiveTheme } = useThemeConfig();

  return (
    <Select value={activeTheme} onValueChange={setActiveTheme}>
      <SelectTrigger className="w-32" size="sm">
        <SelectValue placeholder="Select a theme" />
      </SelectTrigger>
      <SelectContent align="end">
        {THEMES.map((theme) => (
          <SelectItem key={theme.name} value={theme.value}>
            {theme.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
