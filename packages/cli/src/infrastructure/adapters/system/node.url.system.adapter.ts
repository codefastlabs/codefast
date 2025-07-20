/**
 * Node.js URL Service Adapter
 *
 * Infrastructure implementation of the URL service using Node.js url module.
 * Following explicit architecture guidelines for CLI applications.
 */

import { injectable } from "inversify";
import { fileURLToPath, pathToFileURL } from "node:url";

import type { UrlSystemPort } from "@/core/application/ports/system/url.system.port";

@injectable()
export class NodeUrlSystemAdapter implements UrlSystemPort {
  fileURLToPath(url: string | URL): string {
    return fileURLToPath(url);
  }

  pathToFileURL(path: string): URL {
    return pathToFileURL(path);
  }

  parse(urlString: string, base?: string | URL): URL {
    return new URL(urlString, base);
  }

  format(url: URL): string {
    return url.toString();
  }

  resolve(base: string | URL, relative: string): string {
    return new URL(relative, base).toString();
  }
}
