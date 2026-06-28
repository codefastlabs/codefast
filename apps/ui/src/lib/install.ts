export const INSTALL_COMMAND = "pnpm add @codefast/ui" as const;

export const CSS_SETUP = `@import "tailwindcss";
@import "@codefast/ui/css/themes/neutral.css";
@import "@codefast/ui/css/preset.css";` as const;

export const BUTTON_EXAMPLE = `import { Button } from "@codefast/ui/button";

export function MyPage() {
  return <Button variant="outline">Click me</Button>;
}` as const;
