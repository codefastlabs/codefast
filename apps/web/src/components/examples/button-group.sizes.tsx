import { Button } from "@codefast/ui/button";
import { ButtonGroup } from "@codefast/ui/button-group";

const SIZES = ["sm", "default", "lg"] as const;

export function ButtonGroupSizes() {
  return (
    <div className="flex flex-col items-center gap-4">
      {SIZES.map((size) => (
        <ButtonGroup key={size}>
          <Button variant="outline" size={size}>
            Day
          </Button>
          <Button variant="outline" size={size}>
            Week
          </Button>
          <Button variant="outline" size={size}>
            Month
          </Button>
        </ButtonGroup>
      ))}
    </div>
  );
}
