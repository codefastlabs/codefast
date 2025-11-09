"use client";

import type { JSX } from "react";

import { CalendarCheck2Icon } from "lucide-react";
import Image from "next/image";
import { Fragment } from "react";

import { GridWrapper } from "@/components/grid-wrapper";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemGroup,
  ItemHeader,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
  Progress,
  Spinner,
} from "@codefast/ui";
import {
  IconArrowRight,
  IconChevronRight,
  IconDownload,
  IconMessagePlus,
} from "@tabler/icons-react";

interface Person {
  avatar: string;
  message: string;
  username: string;
}

const people: Person[] = [
  {
    avatar: "https://github.com/shadcn.png",
    message: "Just shipped a component update for docs",
    username: "shadcn",
  },
  {
    avatar: "https://github.com/pranathip.png",
    message: "Working on the new design tokens release",
    username: "pranathip",
  },
  {
    avatar: "https://github.com/evilrabbit.png",
    message: "Shipping improvements to our accessibility pass",
    username: "evilrabbit",
  },
  {
    avatar: "https://github.com/maxleiter.png",
    message: "Polishing dashboards and performance metrics",
    username: "maxleiter",
  },
];

interface Track {
  album: string;
  artist: string;
  duration: string;
  title: string;
}

const tracks: Track[] = [
  {
    album: "Electric Nights",
    artist: "Neon Dreams",
    duration: "3:45",
    title: "Midnight City Lights",
  },
  {
    album: "Urban Stories",
    artist: "The Morning Brew",
    duration: "4:05",
    title: "Coffee Shop Conversations",
  },
  {
    album: "Binary Beats",
    artist: "Cyber Symphony",
    duration: "3:30",
    title: "Digital Rain",
  },
  {
    album: "California Dreams",
    artist: "Golden Hour",
    duration: "3:55",
    title: "Sunset Boulevard",
  },
];

interface Issue {
  date: string;
  description: string;
  number: number;
  title: string;
}

const issues: Issue[] = [
  {
    date: "April 2, 2024",
    description: "Form validation helper text overlaps with floating labels.",
    number: 1389,
    title: "Form validation messages overlap with floating labels",
  },
  {
    date: "March 15, 2024",
    description: "Button disabled state does not respect custom variants.",
    number: 1247,
    title: "Button component ignores disabled state when variant is applied",
  },
  {
    date: "February 8, 2024",
    description: "Scroll lock is not restored on mobile after closing dialog.",
    number: 892,
    title: "Dialog component causes scroll lock on mobile devices",
  },
];

export function ItemDemo(): JSX.Element {
  return (
    <GridWrapper className="*:flex *:flex-col *:gap-6 @4xl:grid-cols-3">
      <div>
        <Item>
          <ItemContent>
            <ItemTitle>Item Title</ItemTitle>
          </ItemContent>
          <ItemActions>
            <Button variant="outline">Button</Button>
          </ItemActions>
        </Item>

        <Item variant="outline">
          <ItemContent>
            <ItemTitle>Item Title</ItemTitle>
            <ItemDescription>Used to group related content with optional actions.</ItemDescription>
          </ItemContent>
        </Item>

        <Item variant="muted">
          <ItemContent>
            <ItemTitle>Item Title</ItemTitle>
            <ItemDescription>Stack multiple items together for list layouts.</ItemDescription>
          </ItemContent>
          <ItemActions className="gap-1.5">
            <Button size="sm" variant="outline">
              Secondary
            </Button>
            <Button size="sm">
              Primary <IconArrowRight className="size-4" />
            </Button>
          </ItemActions>
        </Item>

        <Item variant="outline">
          <ItemMedia variant="icon">
            <CalendarCheck2Icon className="size-4" />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>Design Review</ItemTitle>
            <ItemDescription>Tomorrow · 10:00 AM – 12:00 PM</ItemDescription>
          </ItemContent>
          <ItemActions>
            <Button size="sm" variant="outline">
              View
            </Button>
          </ItemActions>
        </Item>

        <Item>
          <ItemHeader>Design system sync is in progress.</ItemHeader>
          <ItemMedia variant="icon">
            <Spinner />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>Downloading UI Kit</ItemTitle>
            <ItemDescription>129 MB of 512 MB</ItemDescription>
          </ItemContent>
          <ItemActions>
            <Button size="sm" variant="outline">
              Cancel
            </Button>
          </ItemActions>
          <ItemFooter>
            <Progress value={42} />
          </ItemFooter>
        </Item>
      </div>

      <div>
        <ItemGroup>
          {people.map((person, index) => (
            <Fragment key={person.username}>
              <Item>
                <ItemMedia>
                  <Avatar>
                    <AvatarImage alt={person.username} src={person.avatar} />
                    <AvatarFallback>{person.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>{person.username}</ItemTitle>
                  <ItemDescription>{person.message}</ItemDescription>
                </ItemContent>
                <ItemActions>
                  <Button
                    aria-label={`Add ${person.username}`}
                    className="size-8 rounded-full"
                    size="icon"
                    variant="outline"
                  >
                    <IconMessagePlus className="size-4" />
                  </Button>
                </ItemActions>
              </Item>
              {index === people.length - 1 ? null : <ItemSeparator />}
            </Fragment>
          ))}
        </ItemGroup>

        <Item variant="outline">
          <ItemMedia>
            <div className="*:data-[slot=avatar]:ring-background flex -space-x-2 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:grayscale">
              <Avatar>
                <AvatarImage alt="@shadcn" src="https://github.com/shadcn.png" />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
              <Avatar>
                <AvatarImage alt="@maxleiter" src="https://github.com/maxleiter.png" />
                <AvatarFallback>ML</AvatarFallback>
              </Avatar>
              <Avatar>
                <AvatarImage alt="@evilrabbit" src="https://github.com/evilrabbit.png" />
                <AvatarFallback>ER</AvatarFallback>
              </Avatar>
            </div>
          </ItemMedia>
          <ItemContent>
            <ItemTitle>Design Department</ItemTitle>
            <ItemDescription>
              Meet the design, engineering, and research teams working on the system.
            </ItemDescription>
          </ItemContent>
          <ItemActions className="self-start">
            <Button
              aria-label="Open team"
              className="size-8 rounded-full"
              size="icon"
              variant="outline"
            >
              <IconChevronRight className="size-4" />
            </Button>
          </ItemActions>
        </Item>
      </div>

      <div>
        <ItemGroup className="gap-4">
          {tracks.map((track) => (
            <Item key={track.title} asChild role="listitem" variant="outline">
              <a href="#">
                <ItemMedia variant="image">
                  <Image
                    alt={track.title}
                    className="grayscale"
                    height={48}
                    src={`https://avatar.vercel.sh/${encodeURIComponent(track.title)}`}
                    width={48}
                  />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle className="line-clamp-1">
                    {track.title} <span className="text-muted-foreground">· {track.album}</span>
                  </ItemTitle>
                  <ItemDescription>{track.artist}</ItemDescription>
                </ItemContent>
                <ItemContent className="flex-none text-right">
                  <ItemDescription>{track.duration}</ItemDescription>
                </ItemContent>
                <ItemActions>
                  <Button
                    aria-label={`Download ${track.title}`}
                    className="size-8 rounded-full"
                    size="icon"
                    variant="ghost"
                  >
                    <IconDownload className="size-4" />
                  </Button>
                </ItemActions>
              </a>
            </Item>
          ))}
        </ItemGroup>

        <ItemGroup>
          {issues.map((issue, index) => (
            <Fragment key={issue.number}>
              <Item asChild className="rounded-none" role="listitem">
                <a href="#">
                  <ItemContent>
                    <ItemTitle className="line-clamp-1">{issue.title}</ItemTitle>
                    <ItemDescription>{issue.description}</ItemDescription>
                  </ItemContent>
                  <ItemContent className="flex-none text-right">
                    <ItemDescription>#{issue.number}</ItemDescription>
                    <ItemDescription>{issue.date}</ItemDescription>
                  </ItemContent>
                </a>
              </Item>
              {index === issues.length - 1 ? null : <ItemSeparator />}
            </Fragment>
          ))}
        </ItemGroup>
      </div>
    </GridWrapper>
  );
}
