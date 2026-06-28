import { ButtonGroup, ButtonGroupText } from "@codefast/ui/button-group";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@codefast/ui/dropdown-menu";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@codefast/ui/field";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@codefast/ui/input-group";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@codefast/ui/popover";
import { toast } from "@codefast/ui/sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@codefast/ui/tooltip";
import { ChevronDownIcon, InfoIcon, StarIcon } from "lucide-react";
import { useState } from "react";

export function InputGroupWithTooltip() {
  const [country, setCountry] = useState("+1");

  return (
    <TooltipProvider>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="input-tooltip-20">Tooltip</FieldLabel>
          <InputGroup>
            <InputGroupInput id="input-tooltip-20" />
            <InputGroupAddon align="inline-end">
              <Tooltip>
                <TooltipTrigger asChild>
                  <InputGroupButton className="rounded-full" size="icon-xs">
                    <InfoIcon />
                  </InputGroupButton>
                </TooltipTrigger>
                <TooltipContent>This is content in a tooltip.</TooltipContent>
              </Tooltip>
            </InputGroupAddon>
          </InputGroup>
          <FieldDescription>This is a description of the input group.</FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="input-dropdown-21">Dropdown</FieldLabel>
          <InputGroup>
            <InputGroupInput id="input-dropdown-21" />
            <InputGroupAddon>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <InputGroupButton className="text-muted-foreground tabular-nums">
                    {country} <ChevronDownIcon />
                  </InputGroupButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="min-w-16" sideOffset={10} alignOffset={-8}>
                  <DropdownMenuItem onClick={() => setCountry("+1")}>+1</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setCountry("+44")}>+44</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setCountry("+46")}>+46</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </InputGroupAddon>
          </InputGroup>
          <FieldDescription>This is a description of the input group.</FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="input-secure-19">Popover</FieldLabel>
          <InputGroup>
            <Popover>
              <PopoverTrigger asChild>
                <InputGroupAddon>
                  <InputGroupButton variant="secondary" size="icon-xs">
                    <InfoIcon />
                  </InputGroupButton>
                </InputGroupAddon>
              </PopoverTrigger>
              <PopoverContent align="start">
                <PopoverHeader>
                  <PopoverTitle>Your connection is not secure.</PopoverTitle>
                  <PopoverDescription>You should not enter any sensitive information on this site.</PopoverDescription>
                </PopoverHeader>
              </PopoverContent>
            </Popover>
            <InputGroupAddon className="ps-1 text-muted-foreground">https://</InputGroupAddon>
            <InputGroupInput id="input-secure-19" />
            <InputGroupAddon align="inline-end">
              <InputGroupButton size="icon-xs" onClick={() => toast("Added to favorites")}>
                <StarIcon />
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
          <FieldDescription>This is a description of the input group.</FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="url">Button Group</FieldLabel>
          <ButtonGroup>
            <ButtonGroupText>https://</ButtonGroupText>
            <InputGroup>
              <InputGroupInput id="url" />
              <InputGroupAddon align="inline-end">
                <InfoIcon />
              </InputGroupAddon>
            </InputGroup>
            <ButtonGroupText>.com</ButtonGroupText>
          </ButtonGroup>
          <FieldDescription>This is a description of the input group.</FieldDescription>
        </Field>
      </FieldGroup>
    </TooltipProvider>
  );
}
