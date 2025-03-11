'use client';

import type { JSX } from 'react';

import { Button, Collapsible, CollapsibleContent, CollapsibleTrigger } from '@codefast/ui';
import { ChevronsUpDown } from 'lucide-react';
import { useState } from 'react';

export function CollapsibleDemo(): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible className="flex w-full flex-col gap-2 md:w-[350px]" open={isOpen} onOpenChange={setIsOpen}>
      <div className="flex items-center justify-between gap-4 px-4">
        <h4 className="line-clamp-1 text-sm font-semibold">@peduarte starred 3 repositories</h4>

        <CollapsibleTrigger asChild>
          <Button icon size="sm" variant="ghost">
            <ChevronsUpDown className="h-4 w-4" />

            <span className="sr-only">Toggle</span>
          </Button>
        </CollapsibleTrigger>
      </div>

      <div className="shadow-xs rounded-md border px-4 py-2 font-mono text-sm">@radix-ui/primitives</div>

      <CollapsibleContent className="flex flex-col gap-2">
        <div className="shadow-xs rounded-md border px-4 py-2 font-mono text-sm">@radix-ui/colors</div>

        <div className="shadow-xs rounded-md border px-4 py-2 font-mono text-sm">@stitches/react</div>
      </CollapsibleContent>
    </Collapsible>
  );
}
