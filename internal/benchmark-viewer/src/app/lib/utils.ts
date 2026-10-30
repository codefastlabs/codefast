import { createTV } from "@codefast/tailwind-variants";
import { extendTailwindMerge } from "cn/config";

/**
 * `cn` and `tv` merging with the viewer's own font-size tokens, which the engine would otherwise read as text colors
 * and drop beside a real one.
 */
const { cn, tv } = createTV({
  twMerge: extendTailwindMerge({
    extend: { theme: { text: ["bh-caption", "bh-small", "bh-body", "bh-title", "bh-display"] } },
  }),
});

export { cn, tv };
