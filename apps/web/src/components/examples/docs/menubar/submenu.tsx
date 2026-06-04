import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from "@codefast/ui/menubar";

export function MenubarSubmenu() {
  return (
    <Menubar>
      <MenubarMenu>
        <MenubarTrigger>Share</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>Copy link</MenubarItem>
          <MenubarSub>
            <MenubarSubTrigger>Send to…</MenubarSubTrigger>
            <MenubarSubContent>
              <MenubarItem>Email</MenubarItem>
              <MenubarItem>Messages</MenubarItem>
              <MenubarItem>AirDrop</MenubarItem>
            </MenubarSubContent>
          </MenubarSub>
          <MenubarSeparator />
          <MenubarItem>Embed…</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
}
