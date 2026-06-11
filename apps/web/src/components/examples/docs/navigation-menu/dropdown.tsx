import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@codefast/ui/navigation-menu";

const RESOURCES = [
  { title: "Documentation", description: "Guides and API reference." },
  { title: "Changelog", description: "What’s new in each release." },
  { title: "Support", description: "Get help from the team." },
];

export function NavigationMenuDropdown() {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Resources</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-64 gap-1 p-2">
              {RESOURCES.map((resource) => (
                <li key={resource.title}>
                  <NavigationMenuLink asChild>
                    <a className="block rounded-md p-3 hover:bg-ui-surface" href={`#${resource.title.toLowerCase()}`}>
                      <div className="text-sm font-medium">{resource.title}</div>
                      <p className="mt-0.5 text-xs text-ui-muted">{resource.description}</p>
                    </a>
                  </NavigationMenuLink>
                </li>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}
