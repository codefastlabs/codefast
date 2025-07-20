/**
 * Node.js Path Service Adapter
 *
 * Infrastructure implementation of the path service using Node.js path module.
 * Following explicit architecture guidelines for CLI applications.
 */

import { injectable } from "inversify";
import path from "node:path";

import type { PathSystemPort } from "@/core/application/ports/system/path.system.port";

@injectable()
export class NodePathSystemAdapter implements PathSystemPort {
  join(...paths: string[]): string {
    return path.join(...paths);
  }

  dirname(pathString: string): string {
    return path.dirname(pathString);
  }

  basename(pathString: string, suffix?: string): string {
    return path.basename(pathString, suffix);
  }

  extname(pathString: string): string {
    return path.extname(pathString);
  }

  resolve(...paths: string[]): string {
    return path.resolve(...paths);
  }

  relative(from: string, to: string): string {
    return path.relative(from, to);
  }

  isAbsolute(pathString: string): boolean {
    return path.isAbsolute(pathString);
  }

  normalize(pathString: string): string {
    return path.normalize(pathString);
  }

  parse(pathString: string): {
    root: string;
    dir: string;
    base: string;
    ext: string;
    name: string;
  } {
    return path.parse(pathString);
  }

  format(pathObject: {
    root?: string;
    dir?: string;
    base?: string;
    ext?: string;
    name?: string;
  }): string {
    return path.format(pathObject);
  }
}
