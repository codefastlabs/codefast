import { Badge } from "@codefast/ui/badge";
import { Item, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemSeparator, ItemTitle } from "@codefast/ui/item";
import { GitPullRequestIcon, MessageSquareIcon, StarIcon } from "lucide-react";
import { Fragment } from "react";

const EVENTS = [
  {
    id: 1,
    title: "New pull request",
    detail: "feat: glob registry",
    Icon: GitPullRequestIcon,
    unread: true,
  },
  {
    id: 2,
    title: "Comment on #482",
    detail: "“Looks great, shipping.”",
    Icon: MessageSquareIcon,
    unread: true,
  },
  { id: 3, title: "Repository starred", detail: "by ada-lovelace", Icon: StarIcon, unread: false },
];

export function ItemNotifications() {
  return (
    <ItemGroup className="w-full max-w-sm rounded-xl border">
      {EVENTS.map(({ id, title, detail, Icon, unread }, index) => (
        <Fragment key={id}>
          {index > 0 ? <ItemSeparator /> : null}
          <Item>
            <ItemMedia>
              <Icon className="size-5 text-ui-muted" />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>{title}</ItemTitle>
              <ItemDescription>{detail}</ItemDescription>
            </ItemContent>
            {unread ? <Badge>New</Badge> : null}
          </Item>
        </Fragment>
      ))}
    </ItemGroup>
  );
}
