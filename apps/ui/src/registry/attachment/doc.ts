import { AttachmentGroupExample } from "#/registry/attachment/group.example";
import { AttachmentImage } from "#/registry/attachment/image.example";
import { AttachmentOrientation } from "#/registry/attachment/orientation.example";
import { AttachmentSizes } from "#/registry/attachment/sizes.example";
import { AttachmentStates } from "#/registry/attachment/states.example";
import { AttachmentTriggerExample } from "#/registry/attachment/trigger.example";
import { docSource, docUsage } from "#/registry/source";
import type { ComponentDoc } from "#/registry/types";

export const attachmentDoc: ComponentDoc = {
  usage: docUsage("attachment"),
  examples: [
    {
      id: "attachment-states",
      title: "States",
      description:
        "state drives the upload lifecycle: idle, uploading, processing, error, and done. The title shimmers while uploading or processing; error tints the media and description.",
      Demo: AttachmentStates,
      source: docSource("attachment", "states"),
    },
    {
      id: "attachment-sizes",
      title: "Sizes",
      description: "Three sizes — default, sm, and xs — scale the media, padding, and text together.",
      Demo: AttachmentSizes,
      source: docSource("attachment", "sizes"),
    },
    {
      id: "attachment-orientation",
      title: "Orientation",
      description:
        "horizontal is a compact row; vertical is a tile with the media on top and actions floated to the corner.",
      Demo: AttachmentOrientation,
      source: docSource("attachment", "orientation"),
    },
    {
      id: "attachment-group",
      title: "Group",
      description:
        "AttachmentGroup lays out a horizontally scrollable, snap-aligned row with a direction-aware edge fade. Mix icon and image media in the same row.",
      Demo: AttachmentGroupExample,
      source: docSource("attachment", "group"),
      previewClassName: "block",
    },
    {
      id: "attachment-image",
      title: "Image",
      description:
        "A gallery of vertical image tiles inside AttachmentGroup, each wrapping a full-card AttachmentTrigger to open the media.",
      Demo: AttachmentImage,
      source: docSource("attachment", "image"),
      previewClassName: "block",
    },
    {
      id: "attachment-trigger",
      title: "Trigger",
      description:
        "AttachmentTrigger fills the card as a single click target (open/preview) while AttachmentActions stay clickable above it.",
      Demo: AttachmentTriggerExample,
      source: docSource("attachment", "trigger"),
    },
  ],
  anatomy: [
    {
      name: "AttachmentGroup",
      children: [
        {
          name: "Attachment",
          children: [
            { name: "AttachmentMedia" },
            { name: "AttachmentContent", children: [{ name: "AttachmentTitle" }, { name: "AttachmentDescription" }] },
            { name: "AttachmentActions", children: [{ name: "AttachmentAction" }] },
            { name: "AttachmentTrigger" },
          ],
        },
      ],
    },
  ],
  features: [
    "Icon and image media through AttachmentMedia.",
    "Upload states — idle, uploading, processing, error, done — with a built-in shimmer while in progress.",
    "Three sizes and horizontal or vertical orientation.",
    "A full-card AttachmentTrigger that stays independently clickable alongside AttachmentActions.",
    "Scrollable, snapping AttachmentGroup with a direction-aware edge fade.",
  ],
  api: [
    {
      name: "Attachment",
      description: "The card. Exposes lifecycle and layout via data attributes its parts react to.",
      props: [
        {
          name: "state",
          type: '"idle" | "uploading" | "processing" | "error" | "done"',
          default: '"done"',
          description: "Upload lifecycle; drives shimmer, dashed border (idle), and destructive tint (error).",
        },
        { name: "size", type: '"default" | "sm" | "xs"', default: '"default"', description: "Overall density." },
        {
          name: "orientation",
          type: '"horizontal" | "vertical"',
          default: '"horizontal"',
          description: "Row layout or vertical tile.",
        },
      ],
    },
    {
      name: "AttachmentMedia",
      description: "Thumbnail slot.",
      props: [
        {
          name: "variant",
          type: '"icon" | "image"',
          default: '"icon"',
          description: "Icon tile, or a cover image that fills and crops.",
        },
      ],
    },
    {
      name: "AttachmentAction",
      description: "An action button; defaults to a ghost icon button.",
      props: [
        { name: "variant", type: "ButtonProps['variant']", default: '"ghost"', description: "Button variant." },
        { name: "size", type: "ButtonProps['size']", default: '"icon-xs"', description: "Button size." },
      ],
    },
    {
      name: "AttachmentTrigger",
      description: "Full-card overlay trigger for opening or previewing the attachment.",
      props: [
        {
          name: "asChild",
          type: "boolean",
          default: "false",
          description: "Render as the child element (e.g. a link); type defaults to 'button' otherwise.",
        },
      ],
    },
    {
      name: "AttachmentContent / AttachmentTitle / AttachmentDescription / AttachmentActions / AttachmentGroup",
      description: "Text column, name, secondary line, action cluster, and the scrollable row wrapper.",
      props: [{ name: "children", type: "ReactNode", description: "Slot content." }],
    },
  ],
  accessibility: {
    notes: [
      {
        title: "Label icon-only actions",
        description: "AttachmentAction is usually icon-only — give each one an aria-label naming its target.",
      },
      {
        title: "Label the trigger",
        description: "AttachmentTrigger covers the card with no text of its own — give it an aria-label too.",
      },
      {
        title: "Keyboard scrolling",
        description: "AttachmentGroup scrolls horizontally; interactive attachments stay reachable by tabbing.",
      },
      {
        title: "Meaning beyond color",
        description: "Keep the failure reason in an AttachmentDescription — error isn't signaled by color alone.",
      },
    ],
  },
  guidelines: {
    do: [
      "Show a Spinner in AttachmentMedia while state is uploading or processing.",
      "Use the vertical orientation for image-forward galleries and horizontal for file lists.",
    ],
    dont: ["Don’t leave action buttons unlabeled.", "Don’t use the image variant without an actual image child."],
  },
  dependencies: ["Radix UI Slot"],
  related: ["item", "message", "spinner"],
};
