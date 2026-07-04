import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from "@codefast/ui/attachment";
import { Bubble, BubbleContent } from "@codefast/ui/bubble";
import { Message, MessageContent } from "@codefast/ui/message";
import { DownloadIcon, FileTextIcon } from "lucide-react";

export function MessageAttachment() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-6">
      <Message align="end">
        <MessageContent>
          <Attachment>
            <AttachmentMedia>
              <FileTextIcon />
            </AttachmentMedia>
            <AttachmentContent>
              <AttachmentTitle>brief.pdf</AttachmentTitle>
              <AttachmentDescription>PDF · 180 KB</AttachmentDescription>
            </AttachmentContent>
          </Attachment>
          <Bubble align="end">
            <BubbleContent>Can you add this to the cover page?</BubbleContent>
          </Bubble>
        </MessageContent>
      </Message>
      <Message>
        <MessageContent>
          <Bubble variant="muted">
            <BubbleContent>Done — here’s the updated deck.</BubbleContent>
          </Bubble>
          <Attachment>
            <AttachmentMedia>
              <FileTextIcon />
            </AttachmentMedia>
            <AttachmentContent>
              <AttachmentTitle>sales-dashboard.pdf</AttachmentTitle>
              <AttachmentDescription>PDF · 2.4 MB</AttachmentDescription>
            </AttachmentContent>
            <AttachmentActions>
              <AttachmentAction aria-label="Download" size="icon-sm" title="Download" variant="secondary">
                <DownloadIcon />
              </AttachmentAction>
            </AttachmentActions>
          </Attachment>
        </MessageContent>
      </Message>
    </div>
  );
}
