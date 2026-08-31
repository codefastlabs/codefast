/** Shared vocabulary the test bed keys its dependencies by. */

import type { Constructor, Token } from "@codefast/di";

/**
 * A token or class constructor used to identify one of the unit's dependencies.
 *
 * @remarks The value-typed counterpart of di's own `DependencyKey`: it carries `Value` so
 * `mocks.get()` can map an identifier back to the mock type it produced.
 *
 * @typeParam Value - The value type the identified dependency resolves to.
 */
export type InjectionIdentifier<Value> = Token<Value> | Constructor<Value>;
