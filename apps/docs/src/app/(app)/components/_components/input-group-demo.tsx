"use client";

import type { JSX } from "react";

import { ChevronDownIcon, CopyIcon, InfoIcon, MicIcon, SearchIcon, StarIcon } from "lucide-react";
import { useState } from "react";

import { GridWrapper } from "@/components/grid-wrapper";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
  Kbd,
  KbdGroup,
  Label,
  Spinner,
} from "@codefast/ui";

export function InputGroupDemo(): JSX.Element {
  const [countryCode, setCountryCode] = useState<string>("+1");

  return (
    <GridWrapper className="*:flex *:flex-col *:gap-4 @3xl:grid-cols-2 @5xl:grid-cols-3">
      <div>
        <Label htmlFor="input-group-basic">Default</Label>
        <InputGroup>
          <InputGroupInput id="input-group-basic" placeholder="name@company.com" type="email" />
        </InputGroup>

        <Label htmlFor="input-group-disabled">Disabled</Label>
        <InputGroup data-disabled="true">
          <InputGroupInput
            disabled
            defaultValue="read only"
            id="input-group-disabled"
            placeholder="Disabled field"
          />
        </InputGroup>

        <Label htmlFor="input-group-invalid">Invalid</Label>
        <InputGroup>
          <InputGroupInput
            aria-invalid="true"
            id="input-group-invalid"
            placeholder="Invalid field"
            type="text"
          />
          <InputGroupAddon align="inline-end">
            <InfoIcon className="text-destructive" />
          </InputGroupAddon>
        </InputGroup>
      </div>

      <div>
        <Label htmlFor="input-group-icon-left">Icon (left)</Label>
        <InputGroup>
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupInput
            id="input-group-icon-left"
            placeholder="Search projects..."
            type="search"
          />
        </InputGroup>

        <Label htmlFor="input-group-icon-right">Icon (right)</Label>
        <InputGroup>
          <InputGroupInput id="input-group-icon-right" placeholder="Listening..." type="text" />
          <InputGroupAddon align="inline-end">
            <MicIcon />
          </InputGroupAddon>
        </InputGroup>

        <Label htmlFor="input-group-loading">Loading</Label>
        <InputGroup data-disabled="true">
          <InputGroupInput
            disabled
            defaultValue="codefast"
            id="input-group-loading"
            placeholder="Searching..."
          />
          <InputGroupAddon align="inline-end">
            <Spinner className="size-4" />
          </InputGroupAddon>
        </InputGroup>
      </div>

      <div>
        <Label htmlFor="input-group-button">Button</Label>
        <InputGroup>
          <InputGroupInput id="input-group-button" placeholder="Invite teammate" />
          <InputGroupAddon align="inline-end">
            <InputGroupButton size="sm">Send</InputGroupButton>
          </InputGroupAddon>
        </InputGroup>

        <Label htmlFor="input-group-dropdown">Dropdown</Label>
        <InputGroup>
          <InputGroupAddon>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <InputGroupButton className="tabular-nums" size="sm" variant="outline">
                  {countryCode} <ChevronDownIcon className="size-3.5" />
                </InputGroupButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-16" sideOffset={8}>
                {["+1", "+44", "+81", "+84"].map((code) => (
                  <DropdownMenuItem
                    key={code}
                    onClick={() => {
                      setCountryCode(code);
                    }}
                  >
                    {code}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </InputGroupAddon>
          <InputGroupInput id="input-group-dropdown" placeholder="Phone number" type="tel" />
        </InputGroup>

        <Label htmlFor="input-group-results">Results</Label>
        <InputGroup>
          <InputGroupInput id="input-group-results" placeholder="Search documentation..." />
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupAddon align="inline-end">
            <InputGroupText>12 results</InputGroupText>
          </InputGroupAddon>
          <InputGroupAddon align="inline-end">
            <KbdGroup>
              <Kbd>⌘</Kbd>
              <Kbd>K</Kbd>
            </KbdGroup>
          </InputGroupAddon>
        </InputGroup>

        <Label htmlFor="input-group-actions">Actions</Label>
        <InputGroup className="[--radius:9999px]">
          <InputGroupAddon>
            <InputGroupButton size="icon-xs" variant="secondary">
              <StarIcon />
              <span className="sr-only">Add to favorites</span>
            </InputGroupButton>
          </InputGroupAddon>
          <InputGroupInput id="input-group-actions" placeholder="https://codefast.dev" />
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              size="icon-xs"
              onClick={() => {
                if (!("clipboard" in navigator)) {
                  return;
                }

                void navigator.clipboard.writeText("https://codefast.dev");
              }}
            >
              <CopyIcon />
              <span className="sr-only">Copy</span>
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </div>

      <div className="@5xl:col-span-3">
        <Label htmlFor="input-group-textarea">Comment</Label>
        <InputGroup className="h-auto">
          <InputGroupTextarea
            id="input-group-textarea"
            placeholder="Share your thoughts..."
            rows={4}
          />
          <InputGroupAddon align="block-end">
            <Button className="ml-auto" size="sm" variant="ghost">
              Cancel
            </Button>
            <Button size="sm">Post</Button>
          </InputGroupAddon>
        </InputGroup>
      </div>
    </GridWrapper>
  );
}
