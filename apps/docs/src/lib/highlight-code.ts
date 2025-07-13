import { codeToHtml } from "shiki";

export async function highlightCode(code: string): Promise<string> {
  return codeToHtml(code, {
    lang: "tsx",
    theme: "github-dark",
    transformers: [
      {
        code(node): void {
          node.properties["data-line-numbers"] = "";
        },
      },
    ],
  });
}
