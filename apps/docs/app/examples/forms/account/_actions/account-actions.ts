'use server';

import { wait } from 'next/dist/lib/wait';
import { type AccountFormValues, accountFormSchema } from '@/app/examples/forms/account/_lib/account-schema';
import { type FormState } from '@/lib/types';

export async function updateAccount(data: AccountFormValues): Promise<FormState<AccountFormValues>> {
  try {
    const validatedFields = accountFormSchema.safeParse(data);

    // If the fields aren't valid, return the errors.
    if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: 'There are errors in the form.',
        success: false,
      };
    }

    // Update the account.
    await wait(250);

    return {
      message: 'Account updated successfully!',
      success: true,
    };
  } catch (error) {
    return {
      message: 'An error occurred while updating the account.',
      success: false,
    };
  }
}
