import { useCopyToClipboard } from "@codefast/ui/hooks/use-copy-to-clipboard";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@codefast/ui/input-group";
import { Popover, PopoverContent, PopoverTrigger } from "@codefast/ui/popover";
import { CheckIcon, CopyIcon, InfoIcon, StarIcon } from "lucide-react";
import * as React from "react";

export function InputGroupButtonExample() {
  const { copyToClipboard, isCopied } = useCopyToClipboard();
  const [isFavorite, setIsFavorite] = React.useState(false);

  return (
    <div className="grid w-full max-w-sm gap-6">
      <InputGroup>
        <InputGroupInput placeholder="https://codefastlabs.com" readOnly />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            aria-label="Copy"
            title="Copy"
            size="icon-xs"
            onClick={() => {
              void copyToClipboard("https://codefastlabs.com");
            }}
          >
            {isCopied ? <CheckIcon /> : <CopyIcon />}
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      <InputGroup className="[--radius:9999px]">
        <Popover>
          <PopoverTrigger asChild>
            <InputGroupAddon>
              <InputGroupButton variant="secondary" size="icon-xs">
                <InfoIcon />
              </InputGroupButton>
            </InputGroupAddon>
          </PopoverTrigger>
          <PopoverContent align="start" className="flex flex-col gap-1 rounded-xl text-sm">
            <p className="font-medium">Your connection is not secure.</p>
            <p>You should not enter any sensitive information on this site.</p>
          </PopoverContent>
        </Popover>
        <InputGroupAddon className="ps-1.5 text-muted-foreground">https://</InputGroupAddon>
        <InputGroupInput id="input-secure-19" />
        <InputGroupAddon align="inline-end">
          <InputGroupButton onClick={() => setIsFavorite(!isFavorite)} size="icon-xs">
            <StarIcon
              data-favorite={isFavorite}
              className="data-[favorite=true]:fill-blue-600 data-[favorite=true]:stroke-blue-600"
            />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      <InputGroup>
        <InputGroupInput placeholder="Type to search..." />
        <InputGroupAddon align="inline-end">
          <InputGroupButton variant="secondary">Search</InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </div>
  );
}
