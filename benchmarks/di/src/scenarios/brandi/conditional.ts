/**
 * Brandi — conditional-injection scenario.
 *
 * `conditional-injection-tagged`: brandi's only conditional form is
 * injection-context — `container.when(tag).bind(token)` plus `tagged(consumer, tag)`
 * — so the binding is selected by the consumer's tag, not a call-site hint. Parallels
 * `@codefast/di`'s `inject(token, { tag })` on the same tagged set.
 */
import { createContainer, injected, tag, tagged, token } from "brandi";

import {
  CONDITIONAL_INJECTION_BATCH,
  CONDITIONAL_INJECTION_TAGGED,
  TAGGED_ENVS,
  TARGET_TAG_VALUE,
} from "#/fixtures/scenario-parity";
import { batched } from "#/harness/batched";
import type { BenchScenario } from "#/scenarios/types";

interface TaggedService {
  readonly env: string;
}

class ConditionalConsumer {
  constructor(readonly service: TaggedService) {}
}

const SERVICE_TOKEN = token<TaggedService>("bench-brandi-conditional-service");
const CONSUMER_TOKEN = token<ConditionalConsumer>("bench-brandi-conditional-consumer");

const ENV_TAGS = new Map<string, ReturnType<typeof tag>>(
  TAGGED_ENVS.map((env) => [env, tag(`bench-brandi-env-${env}`)]),
);

function tagForEnvironment(env: string): ReturnType<typeof tag> {
  const environmentTag = ENV_TAGS.get(env);
  if (environmentTag === undefined) {
    throw new Error(`No brandi tag registered for env ${env}`);
  }
  return environmentTag;
}

injected(ConditionalConsumer, SERVICE_TOKEN);
tagged(ConditionalConsumer, tagForEnvironment(TARGET_TAG_VALUE));

function buildConditionalInjectionTaggedScenario(): BenchScenario {
  const container = createContainer();
  for (const env of TAGGED_ENVS) {
    container.when(tagForEnvironment(env)).bind(SERVICE_TOKEN).toConstant({ env });
  }
  container.bind(CONSUMER_TOKEN).toInstance(ConditionalConsumer).inTransientScope();
  container.get(CONSUMER_TOKEN);

  return {
    ...CONDITIONAL_INJECTION_TAGGED,
    // brandi selects the binding by the consumer's tag (injection-context), not a call-site hint.
    what: `get() a transient consumer whose tag selects its binding (1 of ${String(TAGGED_ENVS.length)})`,
    batch: CONDITIONAL_INJECTION_BATCH,
    sanity: () => container.get(CONSUMER_TOKEN).service.env === TARGET_TAG_VALUE,
    build: () =>
      batched(CONDITIONAL_INJECTION_BATCH, () => {
        container.get(CONSUMER_TOKEN);
      }),
  };
}

/**
 * Builds the brandi conditional-injection scenarios.
 */
export function buildBrandiConditionalScenarios(): ReadonlyArray<BenchScenario> {
  return [buildConditionalInjectionTaggedScenario()];
}
