import { inject, injectAll, injectable, optional, postConstruct, preDestroy, token } from "@codefast/di";

interface Transport {
  connect(): Promise<void>;
  close(): Promise<void>;
  send(to: string, body: string): Promise<void>;
}
interface Formatter {
  format(receipt: string): string;
}
interface Logger {
  info(message: string): void;
}

const TransportToken = token<Transport>("app:Transport");
const FormatterToken = token<Formatter>("app:Formatter");
const LoggerToken = token<Logger>("app:Logger");

@injectable([
  TransportToken,
  optional(LoggerToken),
  injectAll(FormatterToken),
  inject(TransportToken, { name: "fallback" }),
])
export class ReceiptMailer {
  constructor(
    readonly transport: Transport,
    readonly logger: Logger | undefined,
    readonly formatters: Array<Formatter>,
    readonly fallback: Transport,
  ) {}

  @postConstruct()
  async connect(): Promise<void> {
    await this.transport.connect();
  }

  @preDestroy()
  async close(): Promise<void> {
    await this.transport.close();
  }
}
