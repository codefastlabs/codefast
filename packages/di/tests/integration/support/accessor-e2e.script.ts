/**
 * Executed as a `tsx` subprocess from the integration test suite.
 *
 * Running outside Vitest’s Babel pipeline verifies that accessor injection and lifecycle
 * hooks work correctly under tsx’s esbuild-based emit — the transform most application
 * authors use in their own codebases.  It also avoids private-brand check discrepancies
 * that can arise when `context.access.set(this, …)` crosses a module boundary inside a
 * single Vitest worker.
 */
import { Container } from "#/container/container";
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
