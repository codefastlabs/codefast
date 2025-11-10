"use client";

import type { JSX } from "react";

import { InfoIcon, ShieldCheckIcon } from "lucide-react";
import { useState } from "react";

import { GridWrapper } from "@/components/grid-wrapper";
import {
  Badge,
  Button,
  Checkbox,
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
  Input,
  RadioGroup,
  RadioGroupItem,
  Switch,
  Textarea,
} from "@codefast/ui";

export function FieldDemo(): JSX.Element {
  const [showSlugError, setShowSlugError] = useState<boolean>(true);
  const [usage, setUsage] = useState<string>("team");

  return (
    <GridWrapper className="*:flex *:flex-col *:gap-6 @3xl:grid-cols-2 @5xl:grid-cols-3">
      <div>
        <FieldSet>
          <Field>
            <FieldLabel htmlFor="field-name">Full name</FieldLabel>
            <FieldDescription>Displayed on invoices and shared reports.</FieldDescription>
            <Input id="field-name" placeholder="Leslie Knope" />
          </Field>

          <Field>
            <FieldLabel htmlFor="field-about">
              About
              <Badge className="ml-auto" variant="secondary">
                Optional
              </Badge>
            </FieldLabel>
            <Textarea id="field-about" placeholder="Share a short bio…" rows={3} />
            <FieldDescription>Tell collaborators a little about yourself.</FieldDescription>
          </Field>

          <Field>
            <FieldLabel htmlFor="field-slug">Workspace slug</FieldLabel>
            <Input
              aria-invalid={showSlugError}
              defaultValue="north-park"
              id="field-slug"
              placeholder="north-park"
            />
            <FieldDescription>Lowercase letters, numbers, and dashes only.</FieldDescription>
            <FieldError
              errors={
                showSlugError
                  ? [
                      { message: "Slug is already in use." },
                      { message: "Try including your team name." },
                    ]
                  : undefined
              }
            />
          </Field>

          <FieldSeparator />

          <Button
            aria-pressed={showSlugError}
            size="sm"
            variant="outline"
            onClick={() => {
              setShowSlugError((previous) => !previous);
            }}
          >
            {showSlugError ? "Hide validation messages" : "Show validation messages"}
          </Button>
        </FieldSet>
      </div>

      <div>
        <FieldSet>
          <FieldLegend variant="label">Security options</FieldLegend>
          <FieldDescription>
            Control how your organisation protects sessions and invites.
          </FieldDescription>

          <Field orientation="horizontal">
            <Switch defaultChecked id="field-session" />
            <FieldContent>
              <FieldLabel htmlFor="field-session">Require session re-auth</FieldLabel>
              <FieldDescription>Ask members to sign in again every 30 days.</FieldDescription>
            </FieldContent>
          </Field>

          <Field orientation="horizontal">
            <Checkbox id="field-invite" />
            <FieldContent>
              <FieldTitle>Restrict invites to verified domains</FieldTitle>
              <FieldDescription>
                Members can only invite collaborators with company email addresses.
              </FieldDescription>
            </FieldContent>
          </Field>

          <Field orientation="horizontal">
            <Checkbox defaultChecked id="field-admin" />
            <FieldContent>
              <FieldLabel htmlFor="field-admin">Require admin approval</FieldLabel>
              <FieldDescription>
                New members remain pending until an admin approves them.
              </FieldDescription>
            </FieldContent>
          </Field>

          <FieldSeparator>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium">
              <ShieldCheckIcon className="size-3.5" />
              Recommended
            </span>
          </FieldSeparator>

          <Field orientation="horizontal">
            <FieldLabel htmlFor="field-two-factor">Require 2-step verification</FieldLabel>
            <Switch id="field-two-factor" />
          </Field>
        </FieldSet>
      </div>

      <div className="@5xl:col-span-1">
        <FieldSet>
          <FieldLegend>Usage intent</FieldLegend>
          <FieldDescription>Choose what fits best so we can tailor onboarding.</FieldDescription>
          <RadioGroup className="gap-4" value={usage} onValueChange={setUsage}>
            <Field orientation="horizontal">
              <RadioGroupItem id="usage-team" value="team" />
              <FieldContent>
                <FieldLabel htmlFor="usage-team">Team collaboration</FieldLabel>
                <FieldDescription>
                  Coordinate projects, share documents, and manage feedback loops.
                </FieldDescription>
              </FieldContent>
            </Field>
            <Field orientation="horizontal">
              <RadioGroupItem id="usage-client" value="client" />
              <FieldContent>
                <FieldLabel htmlFor="usage-client">Client delivery</FieldLabel>
                <FieldDescription>
                  Invite clients to review progress and sign off on milestones.
                </FieldDescription>
              </FieldContent>
            </Field>
            <Field orientation="horizontal">
              <RadioGroupItem id="usage-community" value="community" />
              <FieldContent>
                <FieldLabel htmlFor="usage-community">Community programs</FieldLabel>
                <FieldDescription>
                  Manage volunteers, track participation, and share updates.
                </FieldDescription>
              </FieldContent>
            </Field>
          </RadioGroup>

          <FieldSeparator />

          <Field>
            <FieldLabel htmlFor="usage-notes">
              Additional notes
              <InfoIcon className="text-muted-foreground ml-auto size-3.5" />
            </FieldLabel>
            <Textarea
              id="usage-notes"
              placeholder="Anything specific you want us to know?"
              rows={4}
            />
          </Field>
        </FieldSet>
      </div>
    </GridWrapper>
  );
}
