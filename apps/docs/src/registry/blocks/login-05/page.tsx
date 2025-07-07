import type { JSX } from "react";

import { LoginForm } from "@/registry/blocks/login-05/_components/login-form";


export default function LoginPage(): JSX.Element {
  return (
    <div className="bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  );
}
