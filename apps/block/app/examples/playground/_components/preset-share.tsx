import type { JSX } from 'react';

import { Button, Input, Label, Popover, PopoverContent, PopoverTrigger } from '@codefast/ui';
import { CopyIcon } from '@radix-ui/react-icons';

export function PresetShare(): JSX.Element {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="secondary">Share</Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[32.5rem]">
        <div className="flex flex-col gap-y-2 text-center sm:text-left">
          <h3 className="text-lg font-semibold">Share preset</h3>
          <p className="text-muted-foreground text-sm">
            Anyone who has this link and an OpenAI account will be able to view this.
          </p>
        </div>
        <div className="flex items-center gap-x-2 pt-4">
          <div className="grid flex-1 gap-2">
            <Label className="sr-only" htmlFor="link">
              Link
            </Label>
            <Input
              readOnly
              className="h-9"
              defaultValue="https://platform.openai.com/playground/p/7bbKYQvsVkNmVb8NGcdUOLae?model=text-davinci-003"
              id="link"
            />
          </div>
          <Button aria-label="Copy" className="px-3" prefix={<CopyIcon />} size="sm" type="submit" />
        </div>
      </PopoverContent>
    </Popover>
  );
}
