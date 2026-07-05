import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from "@codefast/ui/attachment";
import { FileTextIcon, XIcon } from "lucide-react";

export function AttachmentUsage() {
  return (
    <Attachment>
      <AttachmentMedia>
        <FileTextIcon />
      </AttachmentMedia>
      <AttachmentContent>
        <AttachmentTitle>sales-dashboard.pdf</AttachmentTitle>
        <AttachmentDescription>PDF · 2.4 MB</AttachmentDescription>
      </AttachmentContent>
      <AttachmentActions>
        <AttachmentAction aria-label="Remove sales-dashboard.pdf">
          <XIcon />
        </AttachmentAction>
      </AttachmentActions>
    </Attachment>
  );
}
