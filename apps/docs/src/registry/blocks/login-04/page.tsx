import { LoginForm } from "@/registry/blocks/login-04/_components/login-form";

import type { JSX } from "react";

export default function LoginPage(): JSX.Element {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-3xl">
        <LoginForm />
      </div>
    </div>
  );
}
