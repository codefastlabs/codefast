import { Button } from "@codefast/ui/button";
import { Link } from "@tanstack/react-router";

export function ButtonAsChild() {
  return (
    <Button asChild>
      <Link to="/">Login</Link>
    </Button>
  );
}
