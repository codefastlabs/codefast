import { cn } from "@codefast/ui/lib/utils";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@codefast/ui/select";
import type { ReactNode } from "react";

import { type Language, languageOptions } from "#/components/detail/language";

export interface LanguageSelectorProps {
  value: Language;
  onValueChange: (value: Language) => void;
  className?: string;
  languages?: Array<Language>;
}

/** The `ltr` dropdown that switches the active language of an RTL preview. */
export function LanguageSelector({
  value,
  onValueChange,
  className,
  languages = ["en", "ar", "he"],
}: LanguageSelectorProps): ReactNode {
  return (
    <Select value={value} onValueChange={(next) => onValueChange(next as Language)}>
      <SelectTrigger size="sm" dir="ltr" data-name="language-selector" className={cn("w-36", className)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent dir="ltr">
        <SelectGroup>
          {languageOptions
            .filter((option) => languages.includes(option.value))
            .map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
