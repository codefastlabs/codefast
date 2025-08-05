import "reflect-metadata";

import { Container } from "inversify";

import type { FileSystemPort } from "../../application/ports/file-system.port";
import type { OutputFormatterPort } from "../../application/ports/output-formatter.port";
import type { TypeScriptParserPort } from "../../application/ports/typescript-parser.port";

import {
  TYPES,
  ValidateComponentsUseCase,
} from "../../application/use-cases/validate-components.use-case";
import { ConsoleOutputAdapter } from "../adapters/console-output.adapter";
import { FileSystemAdapter } from "../adapters/file-system.adapter";
import { TsMorphAdapter } from "../adapters/ts-morph.adapter";

export const container = new Container();

// Bind ports to their implementations
container.bind<FileSystemPort>(TYPES.FileSystemPort).to(FileSystemAdapter).inSingletonScope();
container
  .bind<TypeScriptParserPort>(TYPES.TypeScriptParserPort)
  .to(TsMorphAdapter)
  .inSingletonScope();
container
  .bind<OutputFormatterPort>(TYPES.OutputFormatterPort)
  .to(ConsoleOutputAdapter)
  .inSingletonScope();

// Bind use cases
container.bind<ValidateComponentsUseCase>(ValidateComponentsUseCase).toSelf().inSingletonScope();

export { TYPES } from "../../application/use-cases/validate-components.use-case";
