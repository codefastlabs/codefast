import {
  Attachment,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from "@codefast/ui/attachment";
import { FileTextIcon } from "lucide-react";

const SIZES = ["default", "sm", "xs"] as const;

export function AttachmentSizes() {
  return (
    <div className="flex w-full max-w-xs flex-col gap-3">
      {SIZES.map((size) => (
        <Attachment key={size} size={size}>
          <AttachmentMedia>
            <FileTextIcon />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>report.pdf</AttachmentTitle>
            <AttachmentDescription>size={size}</AttachmentDescription>
          </AttachmentContent>
        </Attachment>
      ))}
    </div>
  );
}
