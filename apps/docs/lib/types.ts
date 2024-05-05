import type { typeToFlattenedError as TypeToFlattenedError } from 'zod';

export interface FormState<T> {
  errors?: TypeToFlattenedError<T>['fieldErrors'];
  message: string;
  success: boolean;
}
