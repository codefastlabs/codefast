import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
} from "@codefast/ui/attachment";
import type { LucideIcon } from "lucide-react";
import { FileCodeIcon, FileTextIcon, TableIcon, XIcon } from "lucide-react";

interface Item {
  name: string;
  meta: string;
  icon?: LucideIcon | undefined;
  image?: boolean | undefined;
}

const items: Array<Item> = [
  { name: "briefing-notes.pdf", meta: "PDF · 1.4 MB", icon: FileTextIcon },
  { name: "workspace.png", meta: "PNG · 820 KB", image: true },
  { name: "customers.csv", meta: "CSV · 18 KB", icon: TableIcon },
  { name: "renderer.tsx", meta: "TSX · 12 KB", icon: FileCodeIcon },
];

export function AttachmentGroupExample() {
  return (
    <AttachmentGroup className="w-full max-w-sm">
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <Attachment key={item.name} className="w-64">
            {item.image ? (
              <AttachmentMedia variant="image">
                <div aria-label={item.name} className="size-full bg-ui-surface" role="img" />
              </AttachmentMedia>
            ) : Icon ? (
              <AttachmentMedia>
                <Icon />
              </AttachmentMedia>
            ) : null}
            <AttachmentContent>
              <AttachmentTitle>{item.name}</AttachmentTitle>
              <AttachmentDescription>{item.meta}</AttachmentDescription>
            </AttachmentContent>
            <AttachmentActions>
              <AttachmentAction aria-label={`Remove ${item.name}`}>
                <XIcon />
              </AttachmentAction>
            </AttachmentActions>
          </Attachment>
        );
      })}
    </AttachmentGroup>
  );
}
