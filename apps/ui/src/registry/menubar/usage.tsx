import { Menubar, MenubarContent, MenubarItem, MenubarMenu, MenubarTrigger } from "@codefast/ui/menubar";

export function MenubarUsage() {
  return (
    <Menubar>
      <MenubarMenu>
        <MenubarTrigger>File</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>New Tab</MenubarItem>
          <MenubarItem>New Window</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
}
