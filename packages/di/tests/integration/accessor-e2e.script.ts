/**
 * Executed via `pnpm exec tsx` from integration tests — Vitest’s SWC pipeline can emit
 * auto-accessors in a way that breaks `context.access.set(this, …)` private-brand checks;
 * tsx matches typical app transpilation and validates runWithContainer + lifecycle order.
 */
import { Container } from "#/container";
import { inject } from "#/decorators/inject";
import { injectable } from "#/decorators/injectable";
import { postConstruct } from "#/decorators/lifecycle-decorators";
import { token } from "#/token";

const AccessorDepToken = token<{ tag: "dep" }>("accessor-e2e.dep");
const container = Container.create();
container.bind(AccessorDepToken).toConstantValue({ tag: "dep" });

@injectable([])
class AccessorConsumer {
  sawUndefinedInPostConstruct = false;

  @inject(AccessorDepToken) accessor dep!: { tag: "dep" };

  @postConstruct()
  checkInjectedAccessor(): void {
    if (this.dep === undefined) {
      this.sawUndefinedInPostConstruct = true;
    }
  }
}

container.bind(AccessorConsumer).toSelf().transient();
const instance = container.resolve(AccessorConsumer);
if (instance.sawUndefinedInPostConstruct || instance.dep.tag !== "dep") {
  process.exit(1);
}
console.log("ACCESSOR_E2E_OK");
