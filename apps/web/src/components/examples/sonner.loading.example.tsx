import { Button } from "@codefast/ui/button";
import { Toaster, toast } from "@codefast/ui/sonner";

export function SonnerLoading() {
  return (
    <div className="flex justify-center">
      <Toaster />
      <Button
        variant="outline"
        onClick={() => {
          const id = toast.loading("Uploading file…");
          setTimeout(() => {
            toast.success("File uploaded.", { id });
          }, 1800);
        }}
      >
        Upload file
      </Button>
    </div>
  );
}
