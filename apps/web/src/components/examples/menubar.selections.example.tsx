import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarLabel,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarTrigger,
} from "@codefast/ui/menubar";
import { useState } from "react";

export function MenubarSelections() {
  const [statusBar, setStatusBar] = useState(true);
  const [showMinimap, setShowMinimap] = useState(false);
  const [profile, setProfile] = useState("benoit");

  return (
    <Menubar>
      <MenubarMenu>
        <MenubarTrigger>View</MenubarTrigger>
        <MenubarContent>
          <MenubarCheckboxItem
            checked={statusBar}
            onCheckedChange={(checked) => {
              setStatusBar(checked);
            }}
          >
            Status bar
          </MenubarCheckboxItem>
          <MenubarCheckboxItem
            checked={showMinimap}
            onCheckedChange={(checked) => {
              setShowMinimap(checked);
            }}
          >
            Minimap
          </MenubarCheckboxItem>
          <MenubarSeparator />
          <MenubarLabel>Profile</MenubarLabel>
          <MenubarRadioGroup value={profile} onValueChange={setProfile}>
            <MenubarRadioItem value="andy">Andy</MenubarRadioItem>
            <MenubarRadioItem value="benoit">Benoit</MenubarRadioItem>
            <MenubarRadioItem value="luis">Luis</MenubarRadioItem>
          </MenubarRadioGroup>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
}
