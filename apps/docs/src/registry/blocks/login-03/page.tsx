import { GalleryVerticalEndIcon } from "lucide-react";
import Link from "next/link";
import type { JSX } from "react";

import { LoginForm } from "@/registry/blocks/login-03/_components/login-form";

export default function LoginPage(): JSX.Element {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link className="flex items-center gap-2 self-center font-medium" href="#">
          <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
            <GalleryVerticalEndIcon className="size-4" />
          </div>
          Acme Inc.
        </Link>
        <LoginForm />
      </div>
    </div>
  );
}
