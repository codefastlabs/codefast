'use client';

import { type Preset } from '@/app/examples/playground/_data/presets';
import {
  Button,
  cn,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  Popover,
  PopoverContent,
  type PopoverProps,
  PopoverTrigger,
} from '@codefast/ui';
import { CaretSortIcon, CheckIcon } from '@radix-ui/react-icons';
import { useRouter } from 'next/navigation';
import { type JSX, useState } from 'react';

interface PresetSelectorProps extends PopoverProps {
  presets: Preset[];
}

export function PresetSelector({
  presets,
  ...props
}: PresetSelectorProps): JSX.Element {
  const [open, setOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<Preset>();
  const router = useRouter();

  return (
    <Popover open={open} onOpenChange={setOpen} {...props}>
      <PopoverTrigger asChild>
        <Button
          aria-expanded={open}
          aria-label="Load a preset..."
          className="flex-1 justify-between px-3 md:max-w-[200px] lg:max-w-[300px]"
          role="combobox"
          suffix={<CaretSortIcon className="opacity-50" />}
          variant="outline"
        >
          {selectedPreset ? selectedPreset.name : 'Load a preset...'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Search presets..." />
          <CommandList>
            <CommandEmpty>No presets found.</CommandEmpty>
            <CommandGroup heading="Examples">
              {presets.map((preset) => (
                <CommandItem
                  key={preset.id}
                  onSelect={() => {
                    setSelectedPreset(preset);
                    setOpen(false);
                  }}
                >
                  {preset.name}
                  <CheckIcon
                    className={cn(
                      'ml-auto size-4',
                      selectedPreset?.id === preset.id
                        ? 'opacity-100'
                        : 'opacity-0',
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup>
              <CommandItem
                onSelect={() => {
                  router.push('/examples');
                }}
              >
                More examples
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
