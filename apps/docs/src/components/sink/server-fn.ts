import { createServerFn } from "@tanstack/react-start";
import type { z } from "zod";
import { exampleFormSchema } from "#/components/sink/schema";

export type FormState = {
  values: z.infer<typeof exampleFormSchema>;
  errors: null | Partial<Record<keyof z.infer<typeof exampleFormSchema>, string[]>>;
  success: boolean;
};

export const subscriptionAction = createServerFn({ method: "POST" })
  .inputValidator((formData: FormData) => formData)
  .handler(async ({ data: formData }): Promise<FormState> => {
    // Simulate server processing
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const values = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      plan: formData.get("plan") as "basic" | "pro",
      billingPeriod: formData.get("billingPeriod") as string,
      addons: formData.getAll("addons") as string[],
      teamSize: parseInt(formData.get("teamSize") as string) || 1,
      emailNotifications: formData.get("emailNotifications") === "on",
      startDate: formData.get("startDate")
        ? new Date(formData.get("startDate") as string)
        : new Date(),
      theme: formData.get("theme") as string,
      password: formData.get("password") as string,
      comments: formData.get("comments") as string,
    };

    const result = exampleFormSchema.safeParse(values);

    if (!result.success) {
      return {
        values,
        success: false,
        errors: result.error.flatten().fieldErrors as Partial<
          Record<keyof z.infer<typeof exampleFormSchema>, string[]>
        >,
      };
    }

    // Simulate some business logic validation
    if (result.data.email.includes("invalid")) {
      return {
        values,
        success: false,
        errors: {
          email: ["This email domain is not supported"],
        },
      };
    }

    return {
      values,
      errors: null,
      success: true,
    };
  });
