/** The domain module — intentionally empty: the domain is pure and has nothing to wire. */

import { Module } from "@codefast/di";

/** Holds no bindings — a marker that the domain layer depends on no adapter and knows no container. */
export const domainModule = Module.create("Domain", () => {
  // The domain is framework-free: entities and value objects are constructed by the use cases,
  // never resolved from the container. This module exists only to make that explicit.
});
