import { FileTextIcon, XIcon } from "lucide-react";

import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
} from "#/components/attachment";

import preview from "../.storybook/preview";

/**
 * Attachment — a file/media card for chat and uploads. `state` drives the
 * upload lifecycle styling; `orientation` switches between a row and a tile.
 * Content here is authored against Attachment's own public API for Storybook,
 * NOT synced with the apps/web registry.
 *
 * **Anatomy:** `Attachment > AttachmentMedia + AttachmentContent >
 * (AttachmentTitle + AttachmentDescription) + AttachmentActions`.
 */
const meta = preview.meta({
  args: { orientation: "horizontal", size: "default", state: "done" },
  argTypes: {
    orientation: { control: "radio", options: ["horizontal", "vertical"] },
    size: { control: "radio", options: ["default", "sm", "xs"] },
    state: { control: "radio", options: ["idle", "uploading", "processing", "error", "done"] },
  },
  component: Attachment,
  parameters: {
    controls: { include: ["state", "size", "orientation"] },
    docs: {
      description: {
        component:
          "A file/media attachment card with upload states (idle, uploading, processing, error, done), three sizes, and horizontal/vertical orientations. Compose with `AttachmentGroup` for a scrollable row.",
      },
    },
  },
  subcomponents: {
    AttachmentAction,
    AttachmentActions,
    AttachmentContent,
    AttachmentDescription,
    AttachmentGroup,
    AttachmentMedia,
    AttachmentTitle,
  },
  title: "Chat/Attachment",
});

export const Default = meta.story({
  render: (args) => (
    <Attachment {...args}>
      <AttachmentMedia>
        <FileTextIcon />
      </AttachmentMedia>
      <AttachmentContent>
        <AttachmentTitle>quarterly-report.pdf</AttachmentTitle>
        <AttachmentDescription>1.2 MB</AttachmentDescription>
      </AttachmentContent>
      <AttachmentActions>
        <AttachmentAction aria-label="Remove attachment">
          <XIcon />
        </AttachmentAction>
      </AttachmentActions>
    </Attachment>
  ),
});

export const Group = meta.story({
  render: () => (
    <AttachmentGroup className="max-w-md">
      {["design-spec.pdf", "notes.txt", "budget.csv"].map((name) => (
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
  ),
});
