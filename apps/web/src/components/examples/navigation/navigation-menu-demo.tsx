import { cn } from "@codefast/tailwind-variants";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@codefast/ui/navigation-menu";

export function NavigationMenuDemo() {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Getting started</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-64 gap-3 p-4">
              <li>
                <NavigationMenuLink asChild>
                  <a
                    className={cn("block", "p-3", "rounded-md", "hover:bg-accent")}
                    href="/docs/introduction"
                  >
                    <div className="text-sm font-medium">Introduction</div>
                    <p className={cn("mt-1", "text-xs text-muted-foreground")}>
                      Overview of the design system.
                    </p>
                  </a>
                </NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink asChild>
                  <a
                    className={cn("block", "p-3", "rounded-md", "hover:bg-accent")}
                    href="/docs/installation"
                  >
                    <div className="text-sm font-medium">Installation</div>
                    <p className={cn("mt-1", "text-xs text-muted-foreground")}>
                      Step-by-step setup guide.
                    </p>
                  </a>
                </NavigationMenuLink>
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Components</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-80 grid-cols-2 gap-2 p-4">
              {["Button", "Input", "Dialog", "Dropdown", "Toast", "Table"].map((name) => (
                <li key={name}>
                  <NavigationMenuLink asChild>
                    <a
                      className={cn(
                        "block",
                        "px-3 py-2",
                        "rounded-md",
                        "text-sm",
                        "hover:bg-accent",
                      )}
                      href="/components"
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
            <a className={cn("px-3 py-2", "text-sm font-medium")} href="/docs">
              Docs
            </a>
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}
