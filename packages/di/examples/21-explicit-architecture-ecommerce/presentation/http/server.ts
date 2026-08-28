/** A minimal in-memory HTTP server — the seam a real framework (Express, Fastify) would replace. */

import { injectable, token } from "@codefast/di";

/** One inbound HTTP request, with any `:param` segments already extracted. */
export interface HttpRequest {
  readonly method: string;
  readonly path: string;
  readonly body?: unknown;
  readonly params: Record<string, string>;
}

/** One HTTP response. */
export interface HttpResponse {
  readonly status: number;
  readonly body: unknown;
}

/** Handles a matched request. */
export type RouteHandler = (request: HttpRequest) => Promise<HttpResponse>;

/** Registers routes and dispatches requests to them, matching `:param` segments. */
@injectable()
export class HttpServer {
  readonly #routes = new Map<string, RouteHandler>();

  /** Registers `handler` for `method path`, where `path` may contain `:param` segments. */
  route(method: string, path: string, handler: RouteHandler): void {
    this.#routes.set(`${method} ${path}`, handler);
  }

  /** Dispatches a request, returning `404` when nothing matches. */
  async handle(method: string, path: string, body?: unknown): Promise<HttpResponse> {
    for (const [routeKey, handler] of this.#routes) {
      const separator = routeKey.indexOf(" ");

      if (routeKey.slice(0, separator) !== method) {
        continue;
      }

      const params = this.#match(routeKey.slice(separator + 1), path);

      if (params !== undefined) {
        return handler({ method, path, body, params });
      }
    }

    return { status: 404, body: { error: "Not Found" } };
  }

  /** Matches `routePath` (with `:param` segments) against `path`, returning captured params or `undefined`. */
  #match(routePath: string, path: string): Record<string, string> | undefined {
    const routeSegments = routePath.split("/");
    const pathSegments = path.split("/");

    if (routeSegments.length !== pathSegments.length) {
      return undefined;
    }

    const params: Record<string, string> = {};

    for (const [index, routeSegment] of routeSegments.entries()) {
      const pathSegment = pathSegments[index] ?? "";

      if (routeSegment.startsWith(":")) {
        params[routeSegment.slice(1)] = pathSegment;
      } else if (routeSegment !== pathSegment) {
        return undefined;
      }
    }

    return params;
  }
}

/** Injection token for the HTTP server. */
export const HttpServerToken = token<HttpServer>("HttpServer");
