import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@codefast/ui/command";

const FRAMEWORKS = ["Next.js", "Remix", "Astro", "Nuxt", "SvelteKit", "TanStack Start"];

export function CommandSimple() {
  return (
    <Command className="w-full max-w-xs rounded-xl border shadow-md">
      <CommandInput placeholder="Search framework…" />
      <CommandList>
        <CommandEmpty>No framework found.</CommandEmpty>
        <CommandGroup heading="Frameworks">
          {FRAMEWORKS.map((framework) => (
            <CommandItem key={framework} value={framework}>
              {framework}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );
}
