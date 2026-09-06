/** A container with a captive dependency, for the validate() demo: a singleton holding a scoped instance. */
import { Container, injectable, token } from "@codefast/di";

const RequestSessionToken = token<RequestSession>("RequestSession");
const ResponseCacheToken = token<ResponseCache>("ResponseCache");

/** Lives for one request scope. */
@injectable()
class RequestSession {
  readonly id = "session";
}

/** Holds the session; as a singleton it would freeze the first request's session for the container's whole life. */
@injectable([RequestSessionToken])
class ResponseCache {
  constructor(readonly session: RequestSession) {}
}

/** Binds the session scoped and the cache either as the captive singleton or, when `fixed`, scoped alongside it. */
export function createCaptiveContainer(fixed: boolean): Container {
  const container = Container.create();

  container.bind(RequestSessionToken).to(RequestSession).scoped();

  if (fixed) {
    container.bind(ResponseCacheToken).to(ResponseCache).scoped();
  } else {
    container.bind(ResponseCacheToken).to(ResponseCache).singleton();
  }

  return container;
}

/** What validate() says about a container: the message it throws, or null when the graph is sound. */
export function validationMessage(container: Container): string | null {
  try {
    container.validate();

    return null;
  } catch (error: unknown) {
    // The message alone: a class name would differ between the server render and the minified client bundle.
    return error instanceof Error ? error.message : String(error);
  }
}
