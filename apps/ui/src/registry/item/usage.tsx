import { Item, ItemContent, ItemDescription, ItemTitle } from "@codefast/ui/item";

export function ItemUsage() {
  return (
    <Item variant="outline">
      <ItemContent>
        <ItemTitle>Basic Item</ItemTitle>
        <ItemDescription>A simple item with a title and description.</ItemDescription>
      </ItemContent>
    </Item>
  );
}
