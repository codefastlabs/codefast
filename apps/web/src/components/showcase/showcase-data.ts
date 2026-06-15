import { ALPHABET_GROUPS } from "#/components/showcase/groups";
import { COMPONENTS } from "#/registry/components";
import { DEMO_BY_SLUG } from "#/registry/demos";

export const GALLERY_STATS = [
  { value: `${COMPONENTS.length}`, label: "components" },
  { value: `${DEMO_BY_SLUG.size}`, label: "live previews" },
  { value: `${ALPHABET_GROUPS.length}`, label: "A–Z groups" },
] as const;
