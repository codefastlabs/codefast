'use client';

import {
  Button,
  cn,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  Label,
  Popover,
  PopoverContent,
  type PopoverProps,
  PopoverTrigger,
} from '@codefast/ui';
import { CaretSortIcon, CheckIcon } from '@radix-ui/react-icons';
import { type JSX, useRef, useState } from 'react';
import { useMutationObserver } from '@codefast/hooks';
import {
  type Model,
  type ModelType,
} from '@/app/examples/playground/_data/models';

interface ModelSelectorProps extends PopoverProps {
  models: Model[];
  types: readonly ModelType[];
}

export function ModelSelector({
  models,
  types,
  ...props
}: ModelSelectorProps): JSX.Element {
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
          The model which will generate the completion. Some models are suitable
          for natural language tasks, others specialize in code. Learn more.
        </HoverCardContent>
      </HoverCard>
      <Popover open={open} onOpenChange={setOpen} {...props}>
        <PopoverTrigger asChild>
          <Button
            aria-expanded={open}
            aria-label="Select a model"
            className="w-full justify-between"
            role="combobox"
            suffix={<CaretSortIcon className="opacity-50" />}
            variant="outline"
          >
            {selectedModel.name ? selectedModel.name : 'Select a model...'}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-64 p-0">
          <HoverCard openDelay={0}>
            <HoverCardContent
              forceMount
              align="start"
              className="min-h-[280px] w-64"
              side="left"
            >
              <div className="grid gap-2">
                <h4 className="font-medium leading-none">{peekedModel.name}</h4>
                <div className="text-muted-foreground text-sm">
                  {peekedModel.description}
                </div>
                {peekedModel.strengths ? (
                  <div className="mt-4 grid gap-2">
                    <h5 className="text-sm font-medium leading-none">
                      Strengths
                    </h5>
                    <ul className="text-muted-foreground text-sm">
                      {peekedModel.strengths}
                    </ul>
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
                            isSelected={selectedModel.id === model.id}
                            model={model}
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
  isSelected: boolean;
  model: Model;
  onPeek: (model: Model) => void;
  onSelect: () => void;
}

function ModelItem({
  model,
  isSelected,
  onSelect,
  onPeek,
}: ModelItemProps): JSX.Element {
  const ref = useRef<HTMLDivElement>(null);

  useMutationObserver(
    ref,
    (mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'attributes') {
          if (mutation.attributeName === 'aria-selected') {
            onPeek(model);
          }
        }
      }
    },
    {
      attributeFilter: ['aria-selected'],
    },
  );

  return (
    <CommandItem
      key={model.id}
      ref={ref}
      className="aria-selected:bg-primary aria-selected:text-primary-foreground"
      onSelect={onSelect}
    >
      {model.name}
      <CheckIcon
        className={cn(
          'ml-auto size-4',
          isSelected ? 'opacity-100' : 'opacity-0',
        )}
      />
    </CommandItem>
  );
}
