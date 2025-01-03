'use server';

import { wait } from 'next/dist/lib/wait';

import type { AccountFormValues } from '@/app/examples/forms/account/_lib/schema/account-schema';
import type { FieldValidationErrors, ServerResponse } from '@/lib/types/server-actions';

import { accountFormValues } from '@/app/examples/forms/account/_lib/schema/account-schema';

export async function updateAccount(
  data: AccountFormValues,
): Promise<ServerResponse<{ message: string }, FieldValidationErrors<AccountFormValues>>> {
  try {
    const validatedFields = accountFormValues.safeParse(data);

    // If the fields aren't valid, return the errors.
    if (!validatedFields.success) {
      return {
        error: {
          errors: validatedFields.error.flatten().fieldErrors,
          message: 'There are errors in the form.',
        },
        ok: false,
      };
    }

    // Update the account.
    await wait(250);

    return {
      data: {
        message: 'Account updated successfully!',
      },
      ok: true,
    };
  } catch {
    return {
      error: {
        message: 'An error occurred while updating the account.',
      },
      ok: false,
    };
  }
}
