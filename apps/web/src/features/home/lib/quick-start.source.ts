import { Container, injectable, token } from "@codefast/di";

interface Logger {
  info(message: string): void;
}

const LoggerToken = token<Logger>("app:Logger");

@injectable([LoggerToken])
class OrderService {
  constructor(private readonly logger: Logger) {}

  place(sku: string): void {
    this.logger.info(`${sku} placed`);
  }
}

const container = Container.create();

container.bind(LoggerToken).toConstantValue({
  info: (message) => console.log(message),
});
container.bind(OrderService).toSelf();

container.resolve(OrderService).place("SKU-42");
