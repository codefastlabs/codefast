import { Container, injectable, token } from "@codefast/di";

interface Logger {
  info(message: string): void;
}

const LoggerToken = token<Logger>("Logger");

@injectable([LoggerToken])
class CheckoutService {
  constructor(private readonly logger: Logger) {}

  complete(orderId: string): void {
    this.logger.info(`Order ${orderId} completed`);
  }
}

const container = Container.create();

container.bind(LoggerToken).toConstantValue({
  info: (message) => console.log(message),
});
container.bind(CheckoutService).toSelf();

container.resolve(CheckoutService).complete("ORD-1001");
