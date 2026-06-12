import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@codefast/ui/empty";

export function EmptyMinimal() {
  return (
    <Empty className="w-full max-w-sm border">
      <EmptyHeader>
        <EmptyTitle>Nothing here yet</EmptyTitle>
        <EmptyDescription>Items you add will show up in this space. No media or actions required.</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
