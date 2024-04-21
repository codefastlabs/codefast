"use server";

import { wait } from "next/dist/lib/wait";
import { type typeToFlattenedError as TypeToFlattenedError } from "zod";
import { accountFormSchema, type AccountFormValues } from "@/app/examples/forms/account/schemata/account-form-schema";

export interface FormState<T> {
  errors?: TypeToFlattenedError<T>["fieldErrors"];
  message: string;
  success: boolean;
}

export default async function updateAccount(data: AccountFormValues): Promise<FormState<AccountFormValues>> {
  try {
    const validatedFields = accountFormSchema.safeParse(data);

    // If the fields are not valid, return the errors.
    if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: "There are errors in the form.",
        success: false,
      };
    }

    // Update the account.
    await wait(100);

    return {
      message: "Account updated successfully!",
      success: true,
    };
  } catch (error) {
    return {
      message: "An error occurred while updating the account.",
      success: false,
    };
  }
}
