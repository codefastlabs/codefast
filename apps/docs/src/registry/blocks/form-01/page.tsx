import { PaymentPlanForm } from "@/registry/blocks/form-01/_components/payment-plan-form";

import type { JSX } from "react";

export default function Page(): JSX.Element {
  return (
    <div className="grid min-h-dvh place-content-center p-6">
      <PaymentPlanForm />
    </div>
  );
}
