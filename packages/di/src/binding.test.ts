import { describe, expect, it, vi } from "vitest";
import {
  BindingBuilder,
  createBindingIdentifier,
  flushPendingBindingRegistrations,
} from "#/binding";
import { DiError } from "#/errors";
import { token } from "#/token";
import type { Binding, ConstraintContext, Constructor } from "#/binding";

describe("BindingBuilder", () => {
  function commitPendingRegistrations(): void {
    flushPendingBindingRegistrations();
  }

  const SessionToken = token<string>("Session");

  function setup() {
    let resolvedBinding: Binding<unknown> | undefined;
    const hooks = {
      register: (binding: Binding<unknown>) => {
        resolvedBinding = binding;
      },
      update: (binding: Binding<unknown>) => {
        resolvedBinding = binding;
      },
    };
    const builder = new BindingBuilder(SessionToken, "AuthModule", hooks);
    return { builder, getBinding: () => resolvedBinding };
  }

  it("assigns unique ids by default", () => {
    const { builder: sessionBuilder, getBinding: getSessionBinding } = setup();
    const { builder: accountBuilder, getBinding: getAccountBinding } = setup();

    sessionBuilder.toConstantValue("session_v1");
    accountBuilder.toConstantValue("account_v1");
    commitPendingRegistrations();

    expect(getSessionBinding()?.id).not.toBe(getAccountBinding()?.id);
  });

  it("respects explicit ids", () => {
    const { builder, getBinding } = setup();
    const customId = createBindingIdentifier();
    builder.id(customId);
    builder.toConstantValue("persistence_layer");
    commitPendingRegistrations();
    expect(getBinding()?.id).toBe(customId);
  });

  it("throws DiError if multiple strategies are selected", () => {
    const { builder } = setup();
    builder.toConstantValue("initial_value");
    commitPendingRegistrations();
    expect(() => builder.toConstantValue("override_attempt")).toThrow(DiError);
    expect(() => builder.toConstantValue("override_attempt")).toThrow(/already selected/);
  });

  it("throws DiError when changing scope of a constant binding", () => {
    const { builder } = setup();
    builder.toConstantValue("static_config");
    commitPendingRegistrations();
    expect(() => builder.singleton()).toThrow(DiError);
    expect(() => builder.singleton()).toThrow(/Constant bindings are always singleton/);
    expect(() => builder.scoped()).toThrow(DiError);
    expect(() => builder.transient()).toThrow(DiError);
  });

  it("updates scope successfully for non-constant bindings", () => {
    const { builder: sessionBuilder, getBinding: getSessionBinding } = setup();
    sessionBuilder.toResolved(() => "new_session", []).singleton();
    commitPendingRegistrations();
    expect(getSessionBinding()?.scope).toBe("singleton");

    const { builder: scopedBuilder, getBinding: getScopedBinding } = setup();
    scopedBuilder.toResolved(() => "scoped_val", []).scoped();
    commitPendingRegistrations();
    expect(getScopedBinding()?.scope).toBe("scoped");

    const { builder: transientBuilder, getBinding: getTransientBinding } = setup();
    transientBuilder.toResolved(() => "transient_val", []).transient();
    commitPendingRegistrations();
    expect(getTransientBinding()?.scope).toBe("transient");
  });

  function mockConstraintContext(options: Partial<ConstraintContext> = {}): ConstraintContext {
    return {
      resolutionPath: [],
      materializationStack: [],
      parent: undefined,
      ancestors: [],
      currentResolveHint: undefined,
      ...options,
    };
  }

  it("supports multiple combined constraints via when", () => {
    const { builder, getBinding } = setup();
    builder
      .toConstantValue("restricted_value")
      .when(() => true)
      .when(() => false);
    commitPendingRegistrations();

    const registeredBinding = getBinding()!;
    expect(registeredBinding.constraint).toBeDefined();
    const constraintContext = mockConstraintContext({ resolutionPath: ["Root"] });
    expect(registeredBinding.constraint!(constraintContext)).toBe(false);
  });

  it("supports tags, onActivation, and onDeactivation", () => {
    const { builder, getBinding } = setup();
    const onActivate = vi.fn();
    const onDeactivate = vi.fn();
    builder
      .toConstantValue("tagged_instance")
      .whenTagged("role", "admin")
      .onActivation(onActivate)
      .onDeactivation(onDeactivate)
      .whenNamed("admin-session");
    commitPendingRegistrations();

    const registeredBinding = getBinding()!;
    expect(registeredBinding.tags.get("role")).toBe("admin");
    expect(registeredBinding.onActivation).toBe(onActivate);
    expect(registeredBinding.onDeactivation).toBe(onDeactivate);
    expect(registeredBinding.bindingName).toBe("admin-session");
  });

  it("toAlias creates an alias binding", () => {
    const { builder, getBinding } = setup();
    const UserAccountToken = token<string>("UserAccount");
    builder.toAlias(UserAccountToken);
    commitPendingRegistrations();
    const registeredBinding = getBinding()!;
    expect(registeredBinding).toMatchObject({ kind: "alias", targetToken: UserAccountToken });
  });

  it("toDynamic and toDynamicAsync creates respective bindings", () => {
    const { builder: syncBuilder, getBinding: getSyncBinding } = setup();
    syncBuilder.toDynamic(() => "sync_data");
    commitPendingRegistrations();
    expect(getSyncBinding()?.kind).toBe("dynamic");

    const { builder: asyncBuilder, getBinding: getAsyncBinding } = setup();
    asyncBuilder.toDynamicAsync(async () => "async_data");
    commitPendingRegistrations();
    expect(getAsyncBinding()?.kind).toBe("async-dynamic");
  });

  it("to creates a class binding", () => {
    const { builder, getBinding } = setup();
    class AuthService {}
    builder.to(AuthService as unknown as Constructor<string>);
    commitPendingRegistrations();
    const registeredBinding = getBinding()!;
    expect(registeredBinding).toMatchObject({ kind: "class", implementationClass: AuthService });
  });

  it("toSelf creates a class binding if key is a class", () => {
    class AuthService {}
    let registeredBinding: Binding<unknown> | undefined;
    const builder = new BindingBuilder(AuthService, undefined, {
      register: (binding) => (registeredBinding = binding),
    });
    builder.toSelf();
    commitPendingRegistrations();
    expect(registeredBinding).toMatchObject({ kind: "class", implementationClass: AuthService });
  });

  it("toSelf throws if key is a token", () => {
    const { builder } = setup();
    expect(() => builder.toSelf()).toThrow(/requires the binding key to be a constructor/);
  });

  it("id() getter returns the id (creating it if needed)", () => {
    const { builder } = setup();
    const id1 = builder.id();
    const id2 = builder.id();
    expect(id1).toBe(id2);
  });

  it("id(identifier) throws if trying to change it after strategy is set", () => {
    const { builder } = setup();
    builder.toConstantValue("final_v");
    commitPendingRegistrations();
    const id = builder.id();
    expect(() => builder.id(createBindingIdentifier())).toThrow(
      /Cannot change binding identifier after registration/,
    );
    expect(builder.id(id)).toBe(id); // Same ID is fine
  });
});
