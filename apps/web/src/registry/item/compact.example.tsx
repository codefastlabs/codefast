import { Item, ItemContent, ItemGroup, ItemMedia, ItemSeparator, ItemTitle } from "@codefast/ui/item";
import { FileTextIcon, ImageIcon, SheetIcon } from "lucide-react";
import { Fragment } from "react";

const FILES = [
  { id: 1, name: "Brand guidelines.pdf", size: "2.4 MB", Icon: FileTextIcon },
  { id: 2, name: "Hero cover.png", size: "856 KB", Icon: ImageIcon },
  { id: 3, name: "Q3 budget.xlsx", size: "112 KB", Icon: SheetIcon },
];

export function ItemCompact() {
  return (
    <ItemGroup className="w-full max-w-sm rounded-xl border">
      {FILES.map(({ id, name, size, Icon }, index) => (
        <Fragment key={id}>
          {index > 0 ? <ItemSeparator /> : null}
          <Item>
            <ItemMedia>
              <Icon className="size-4 text-ui-muted" />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>{name}</ItemTitle>
            </ItemContent>
            <span className="text-xs text-ui-muted tabular-nums">{size}</span>
          </Item>
        </Fragment>
      ))}
    </ItemGroup>
  );
}
