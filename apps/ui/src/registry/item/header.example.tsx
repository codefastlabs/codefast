import { Item, ItemContent, ItemDescription, ItemGroup, ItemHeader, ItemTitle } from "@codefast/ui/item";

const models = [
  {
    name: "v0-1.5-sm",
    description: "Everyday tasks and UI generation.",
  },
  {
    name: "v0-1.5-lg",
    description: "Advanced thinking or reasoning.",
  },
  {
    name: "v0-2.0-mini",
    description: "Open Source model for everyone.",
  },
];

export function ItemHeaderDemo() {
  return (
    <div className="flex w-full max-w-xl flex-col gap-6">
      <ItemGroup className="grid grid-cols-3 gap-4">
        {models.map((model) => (
          <Item key={model.name} variant="outline">
            <ItemHeader>
              <div aria-label={model.name} className="aspect-square w-full rounded-sm bg-ui-surface" role="img" />
            </ItemHeader>
            <ItemContent>
              <ItemTitle>{model.name}</ItemTitle>
              <ItemDescription>{model.description}</ItemDescription>
            </ItemContent>
          </Item>
        ))}
      </ItemGroup>
    </div>
  );
}
