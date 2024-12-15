import type { typeToFlattenedError as TypeToFlattenedError } from 'zod';

export interface FormState<T> {
  message: string;
  success: boolean;
  errors?: TypeToFlattenedError<T>['fieldErrors'];
}
