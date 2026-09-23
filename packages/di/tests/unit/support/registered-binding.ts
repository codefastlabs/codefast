/**
 * A real binding for a test that drives an engine part directly, made at the one site every binding
 * is: the chain `bind()` returns, registered by its `to*()` step.
 */
import type { BindingChain } from "#container/binding-builders";
import { Container } from "#container/container";
import type { Binding } from "#core/binding";
import { token } from "#core/token";

/** The chain, whose binding fields a test may set, and the same object as the engine reads it. */
export interface RegisteredBinding {
  readonly chain: BindingChain<unknown>;
  readonly binding: Binding;
}

export function registeredBinding(name: string): RegisteredBinding {
  // `bind()` returns the one builder class, typed as its first step.
  const chain = Container.create().bind(token<unknown>(name)) as BindingChain<unknown>;
  chain.toDynamic(() => undefined);
  return { chain, binding: chain as Binding };
}
