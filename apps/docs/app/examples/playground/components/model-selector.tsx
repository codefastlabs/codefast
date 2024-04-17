"use client";

import { Popover, PopoverContent, type PopoverProps, PopoverTrigger } from "@codefast/ui/popover";
import { type JSX, useRef, useState } from "react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@codefast/ui/hover-card";
import { Label } from "@codefast/ui/label";
import { Button } from "@codefast/ui/button";
import { CaretSortIcon, CheckIcon } from "@radix-ui/react-icons";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@codefast/ui/command";
import { cn } from "@codefast/ui/utils";
import { type Model, type ModelType } from "@/app/examples/playground/data/models";
import { useMutationObserver } from "@/hooks/use-mutation-observer";

interface ModelSelectorProps extends PopoverProps {
  types: readonly ModelType[];
  models: Model[];
}

export function ModelSelector({ models, types, ...props }: ModelSelectorProps): JSX.Element {
  const [open, setOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<Model>(models[0]);
  const [peekedModel, setPeekedModel] = useState<Model>(models[0]);

  return (
    <div className="grid gap-2">
      <HoverCard openDelay={200}>
        <HoverCardTrigger asChild>
          <Label htmlFor="model">Model</Label>
        </HoverCardTrigger>
        <HoverCardContent align="start" className="w-64 text-sm" side="left">
          The model which will generate the completion. Some models are suitable for natural language tasks, others
          specialize in code. Learn more.
        </HoverCardContent>
      </HoverCard>
      <Popover open={open} onOpenChange={setOpen} {...props}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label="Select a model"
            className="w-full justify-between"
          >
            {selectedModel.name ? selectedModel.name : "Select a model..."}
            <CaretSortIcon className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-64 p-0">
          <HoverCard openDelay={0}>
            <HoverCardContent side="left" align="start" forceMount className="min-h-[280px] w-64">
              <div className="grid gap-2">
                <h4 className="font-medium leading-none">{peekedModel.name}</h4>
                <div className="text-muted-foreground text-sm">{peekedModel.description}</div>
                {peekedModel.strengths ? (
                  <div className="mt-4 grid gap-2">
                    <h5 className="text-sm font-medium leading-none">Strengths</h5>
                    <ul className="text-muted-foreground text-sm">{peekedModel.strengths}</ul>
                  </div>
                ) : null}
              </div>
            </HoverCardContent>
            <Command loop>
              <CommandInput placeholder="Search Models..." />
              <HoverCardTrigger>
                <CommandList className="h-[var(--cmdk-list-height)] max-h-[400px]">
                  <CommandEmpty>No Models found.</CommandEmpty>
                  {types.map((type) => (
                    <CommandGroup key={type} heading={type}>
                      {models
                        .filter((model) => model.type === type)
                        .map((model) => (
                          <ModelItem
                            key={model.id}
                            model={model}
                            isSelected={selectedModel.id === model.id}
                            onPeek={(currentModel) => {
                              setPeekedModel(currentModel);
                            }}
                            onSelect={() => {
                              setSelectedModel(model);
                              setOpen(false);
                            }}
                          />
                        ))}
                    </CommandGroup>
                  ))}
                </CommandList>
              </HoverCardTrigger>
            </Command>
          </HoverCard>
        </PopoverContent>
      </Popover>
    </div>
  );
}

interface ModelItemProps {
  model: Model;
  isSelected: boolean;
  onSelect: () => void;
  onPeek: (model: Model) => void;
}

function ModelItem({ model, isSelected, onSelect, onPeek }: ModelItemProps): JSX.Element {
  const ref = useRef<HTMLDivElement>(null);

  useMutationObserver(
    ref,
    (mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "attributes") {
          if (mutation.attributeName === "aria-selected") {
            onPeek(model);
          }
        }
      }
    },
    {
      attributeFilter: ["aria-selected"],
    },
  );

  return (
    <CommandItem
      key={model.id}
      onSelect={onSelect}
      ref={ref}
      className="aria-selected:bg-primary aria-selected:text-primary-foreground"
    >
      {model.name}
      <CheckIcon className={cn("ml-auto size-4", isSelected ? "opacity-100" : "opacity-0")} />
    </CommandItem>
  );
}
