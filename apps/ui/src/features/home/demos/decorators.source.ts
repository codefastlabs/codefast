import { inject, injectAll, injectable, optional, postConstruct, preDestroy, token } from "@codefast/di";

interface MailTransport {
  connect(): Promise<void>;
  close(): Promise<void>;
  send(to: string, body: string): Promise<void>;
}
interface ReceiptFormatter {
  format(receipt: string): string;
}
interface Logger {
  info(message: string): void;
}

const MailTransportToken = token<MailTransport>("MailTransport");
const ReceiptFormatterToken = token<ReceiptFormatter>("ReceiptFormatter");
const LoggerToken = token<Logger>("Logger");

@injectable([
  MailTransportToken,
  optional(LoggerToken),
  injectAll(ReceiptFormatterToken),
  inject(MailTransportToken, { name: "fallback" }),
])
export class ReceiptMailer {
  constructor(
    readonly transport: MailTransport,
    readonly logger: Logger | undefined,
    readonly formatters: Array<ReceiptFormatter>,
    readonly fallback: MailTransport,
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
