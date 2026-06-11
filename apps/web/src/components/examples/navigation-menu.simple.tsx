import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@codefast/ui/navigation-menu";

const LINKS = ["Home", "Docs", "Pricing", "Blog"];

export function NavigationMenuSimple() {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        {LINKS.map((label) => (
          <NavigationMenuItem key={label}>
            <NavigationMenuLink asChild>
              <a className="px-3 py-2 text-sm font-medium" href={`#${label.toLowerCase()}`}>
                {label}
              </a>
            </NavigationMenuLink>
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  );
}
