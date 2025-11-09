"use client";

import type { JSX } from "react";

import {
  AlertTriangleIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  ChevronDownIcon,
  CopyIcon,
  SearchIcon,
  ShareIcon,
  TrashIcon,
  UserRoundXIcon,
  VolumeOffIcon,
} from "lucide-react";
import { useState } from "react";

import { GridWrapper } from "@/components/grid-wrapper";
import {
  Button,
  ButtonGroup,
  ButtonGroupSeparator,
  ButtonGroupText,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@codefast/ui";
import { IconArrowRight, IconMinus, IconPlus } from "@tabler/icons-react";

export function ButtonGroupDemo(): JSX.Element {
  const [currency, setCurrency] = useState<string>("USD");

  return (
    <GridWrapper className="*:flex *:flex-col *:gap-6 @4xl:grid-cols-2">
      <div>
        <ButtonGroup>
          <Button>Button</Button>
          <Button>
            Get Started <IconArrowRight />
          </Button>
        </ButtonGroup>
        <ButtonGroup>
          <Button>Button</Button>
          <ButtonGroupSeparator className="bg-primary/80" />
          <Button>
            Get Started <IconArrowRight />
          </Button>
        </ButtonGroup>
        <ButtonGroup>
          <Button variant="outline">Button</Button>
          <Input placeholder="Type something here..." />
        </ButtonGroup>

        <ButtonGroup>
          <ButtonGroupText asChild>
            <Label htmlFor="search">
              <SearchIcon className="size-4" /> Search
            </Label>
          </ButtonGroupText>
          <Input id="search" placeholder="Search anything..." />
          <Button variant="outline">Go</Button>
        </ButtonGroup>

        <ButtonGroup>
          <Button variant="outline">Update</Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                Actions <ChevronDownIcon className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Duplicate</DropdownMenuItem>
              <DropdownMenuItem>Archive</DropdownMenuItem>
              <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </ButtonGroup>
      </div>

      <div>
        <ButtonGroup>
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger className="font-mono">
              <SelectValue placeholder="Currency" />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="EUR">EUR</SelectItem>
              <SelectItem value="JPY">JPY</SelectItem>
            </SelectContent>
          </Select>
          <Input min={0} placeholder="Amount" type="number" />
          <Button>
            Send <ArrowRightIcon className="size-4" />
          </Button>
        </ButtonGroup>

        <ButtonGroup>
          <Button aria-label="Previous" size="icon" variant="outline">
            <ArrowLeftIcon className="size-4" />
          </Button>
          <Button aria-label="Next" size="icon" variant="outline">
            <ArrowRightIcon className="size-4" />
          </Button>
          <ButtonGroupSeparator />
          <Button variant="secondary">View all</Button>
        </ButtonGroup>

        <ButtonGroup orientation="vertical">
          <Button size="sm" variant="outline">
            <IconPlus /> Increase
          </Button>
          <Button size="sm" variant="outline">
            <IconMinus /> Decrease
          </Button>
        </ButtonGroup>

        <ButtonGroup orientation="vertical">
          <Button size="sm" variant="secondary">
            <IconPlus /> Increase
          </Button>
          <ButtonGroupSeparator orientation="horizontal" />
          <Button size="sm" variant="secondary">
            <IconMinus /> Decrease
          </Button>
        </ButtonGroup>
      </div>

      <div>
        <ButtonGroup className="[--spacing:0.25rem]">
          <Button variant="outline">1</Button>
          <Button variant="outline">2</Button>
          <Button variant="outline">3</Button>
          <Button variant="outline">4</Button>
          <Button variant="outline">5</Button>
        </ButtonGroup>

        <ButtonGroup className="[--radius:9999px]">
          <Button variant="outline">Follow</Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="!pl-2" variant="outline">
                <ChevronDownIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="[--radius:0.95rem]">
              <DropdownMenuGroup>
                <DropdownMenuItem>
                  <VolumeOffIcon />
                  Mute Conversation
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <CheckIcon />
                  Mark as Read
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <AlertTriangleIcon />
                  Report Conversation
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <UserRoundXIcon />
                  Block User
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <ShareIcon />
                  Share Conversation
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <CopyIcon />
                  Copy Conversation
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem variant="destructive">
                  <TrashIcon />
                  Delete Conversation
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </ButtonGroup>

        <ButtonGroup>
          <ButtonGroup>
            <Button variant="outline">Previous</Button>
            <Button variant="outline">Next</Button>
          </ButtonGroup>
          <ButtonGroup aria-label="Jump navigation" orientation="vertical">
            <Button size="icon" variant="outline">
              <ArrowLeftIcon className="size-4" />
            </Button>
            <Button size="icon" variant="outline">
              <ArrowRightIcon className="size-4" />
            </Button>
          </ButtonGroup>
        </ButtonGroup>
      </div>

      <div>
        <ButtonGroup aria-label="Stacked actions" orientation="vertical">
          <Button variant="secondary">Create</Button>
          <ButtonGroupSeparator orientation="horizontal" />
          <Button variant="secondary">Duplicate</Button>
        </ButtonGroup>

        <ButtonGroup>
          <ButtonGroupText>Status</ButtonGroupText>
          <ButtonGroupSeparator />
          <Button variant="outline">Draft</Button>
          <Button variant="outline">Published</Button>
          <Button variant="outline">Archived</Button>
        </ButtonGroup>

        <ButtonGroup>
          <Button variant="outline">Zoom out</Button>
          <ButtonGroupSeparator />
          <Button variant="outline">Reset</Button>
          <ButtonGroupSeparator />
          <Button variant="outline">Zoom in</Button>
        </ButtonGroup>
      </div>
    </GridWrapper>
  );
}
