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
import { Image } from "@unpic/react";
import { XIcon } from "lucide-react";

const images = [
  {
    name: "workspace.png",
    meta: "PNG · 820 KB",
    src: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=900&auto=format&fit=crop&q=80",
    alt: "Workspace",
  },
  {
    name: "desk-reference.jpg",
    meta: "JPG · 1.1 MB",
    src: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=900&auto=format&fit=crop&q=80",
    alt: "Desk",
  },
  {
    name: "office-reference.jpg",
    meta: "JPG · 940 KB",
    src: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=900&auto=format&fit=crop&q=80",
    alt: "Office",
  },
];

export function AttachmentImage() {
  return (
    <AttachmentGroup className="w-full max-w-sm">
      {images.map((image) => (
        <Attachment key={image.name} orientation="vertical">
          <AttachmentMedia variant="image">
            <Image alt={image.alt} className="size-full object-cover" layout="fullWidth" src={image.src} />
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
