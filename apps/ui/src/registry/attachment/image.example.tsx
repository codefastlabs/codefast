import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
  AttachmentTrigger,
} from "@codefast/ui/attachment";
import { XIcon } from "lucide-react";

const images = [
  { name: "workspace.png", meta: "PNG · 820 KB", alt: "Workspace" },
  { name: "desk-reference.jpg", meta: "JPG · 1.1 MB", alt: "Desk" },
  { name: "office-reference.jpg", meta: "JPG · 940 KB", alt: "Office" },
];

export function AttachmentImage() {
  return (
    <AttachmentGroup className="w-full max-w-sm">
      {images.map((image) => (
        <Attachment key={image.name} orientation="vertical">
          <AttachmentMedia variant="image">
            <div aria-label={image.alt} className="size-full bg-ui-surface" role="img" />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>{image.name}</AttachmentTitle>
            <AttachmentDescription>{image.meta}</AttachmentDescription>
          </AttachmentContent>
          <AttachmentActions>
            <AttachmentAction aria-label={`Remove ${image.name}`}>
              <XIcon />
            </AttachmentAction>
          </AttachmentActions>
          <AttachmentTrigger asChild>
            <button aria-label={`Open ${image.name}`} type="button" />
          </AttachmentTrigger>
        </Attachment>
      ))}
    </AttachmentGroup>
  );
}
