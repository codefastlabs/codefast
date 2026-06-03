import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@codefast/ui/navigation-menu";

const COMPONENTS = ["Button", "Input", "Dialog", "Dropdown", "Toast", "Table"];

export function NavigationMenuMega() {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Getting started</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-64 gap-2 p-4">
              <li>
                <NavigationMenuLink asChild>
                  <a className="block rounded-md p-3 hover:bg-ui-surface" href="#introduction">
                    <div className="text-sm font-medium">Introduction</div>
                    <p className="mt-1 text-xs text-ui-muted">Overview of the design system.</p>
                  </a>
                </NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink asChild>
                  <a className="block rounded-md p-3 hover:bg-ui-surface" href="#installation">
                    <div className="text-sm font-medium">Installation</div>
                    <p className="mt-1 text-xs text-ui-muted">Step-by-step setup guide.</p>
                  </a>
                </NavigationMenuLink>
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Components</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-72 grid-cols-2 gap-2 p-4">
              {COMPONENTS.map((name) => (
                <li key={name}>
                  <NavigationMenuLink asChild>
                    <a
                      className="block rounded-md px-3 py-2 text-sm hover:bg-ui-surface"
                      href="#components"
                    >
                      {name}
                    </a>
                  </NavigationMenuLink>
                </li>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <a className="px-3 py-2 text-sm font-medium" href="#docs">
              Docs
            </a>
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}
