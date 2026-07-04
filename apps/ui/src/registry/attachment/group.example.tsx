import {
  Attachment,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
} from "@codefast/ui/attachment";
import { FileTextIcon } from "lucide-react";

const FILES = ["design-spec.pdf", "notes.txt", "budget.csv", "roadmap.md"];

export function AttachmentGroupExample() {
  return (
    <AttachmentGroup className="max-w-sm">
      {FILES.map((name) => (
        <Attachment key={name}>
          <AttachmentMedia>
            <FileTextIcon />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>{name}</AttachmentTitle>
            <AttachmentDescription>820 KB</AttachmentDescription>
          </AttachmentContent>
        </Attachment>
      ))}
    </AttachmentGroup>
  );
}
