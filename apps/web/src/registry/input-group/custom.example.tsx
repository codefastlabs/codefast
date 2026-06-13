import { InputGroup, InputGroupAddon, InputGroupButton } from "@codefast/ui/input-group";

export function InputGroupCustom() {
  return (
    <div className="grid w-full max-w-sm gap-6">
      <InputGroup>
        <textarea
          data-slot="input-group-control"
          className="flex field-sizing-content min-h-16 w-full resize-none rounded-md bg-transparent px-3 py-2.5 text-base transition-[color,box-shadow] outline-none md:text-sm"
          aria-label="Autoresize textarea"
          placeholder="Autoresize textarea..."
        />
        <InputGroupAddon align="block-end">
          <InputGroupButton className="ms-auto" size="sm" variant="default">
            Submit
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </div>
  );
}
