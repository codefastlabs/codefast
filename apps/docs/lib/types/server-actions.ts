import { type typeToFlattenedError } from 'zod';

interface Response {
  ok: boolean;
}

export interface SuccessfulResponse<T> extends Response {
  data: T;
  ok: true;
}

export interface ErrorDetails<ErrorType> {
  message: string;
  errors?: ErrorType;
}

export interface FailedResponse<ErrorType> extends Response {
  error: ErrorDetails<ErrorType>;
  ok: false;
}

export type ServerResponse<DataType, ErrorType> =
  | SuccessfulResponse<DataType>
  | FailedResponse<ErrorType>;

export type FieldValidationErrors<Schema> =
  typeToFlattenedError<Schema>['fieldErrors'];
