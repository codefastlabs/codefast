import {
  Attachment,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from "@codefast/ui/attachment";
import { ImageIcon } from "lucide-react";

export function AttachmentOrientation() {
  return (
    <div className="flex flex-wrap items-start gap-3">
      <Attachment orientation="horizontal" className="w-56">
        <AttachmentMedia>
          <ImageIcon />
        </AttachmentMedia>
        <AttachmentContent>
          <AttachmentTitle>cover.png</AttachmentTitle>
          <AttachmentDescription>Horizontal</AttachmentDescription>
        </AttachmentContent>
      </Attachment>
      <Attachment orientation="vertical">
        <AttachmentMedia variant="image">
          <ImageIcon />
        </AttachmentMedia>
        <AttachmentContent>
          <AttachmentTitle>cover.png</AttachmentTitle>
          <AttachmentDescription>Vertical</AttachmentDescription>
        </AttachmentContent>
      </Attachment>
    </div>
  );
}
