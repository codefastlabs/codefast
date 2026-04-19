import { describe, expect, it } from "vitest";
import { injectHintLabelFromResolveHint, listResolvedDependencies } from "#/dependency-graph";
import type {
  AliasBinding,
  ClassBinding,
  ConstantBinding,
  ResolvedBinding,
  BindingIdentifier,
  Constructor,
} from "#/binding";
import { createBindingIdentifier } from "#/binding";
import { token } from "#/token";
import type { Token } from "#/token";
import type { MetadataReader } from "#/decorators/metadata";

function mockConstant(id: string = createBindingIdentifier()): ConstantBinding<unknown> {
  return {
    id: id as BindingIdentifier,
    kind: "constant",
    scope: "transient",
    value: null,
    tags: new Map(),
  };
}

function mockAlias(
  target: Token<unknown>,
  id: string = createBindingIdentifier(),
): AliasBinding<unknown> {
  return {
    id: id as BindingIdentifier,
    kind: "alias",
    scope: "transient",
    targetToken: target,
    tags: new Map(),
  };
}

function mockResolved(
  deps: (Token<unknown> | Constructor<unknown>)[],
  id: string = createBindingIdentifier(),
): ResolvedBinding<unknown> {
  return {
    id: id as BindingIdentifier,
    kind: "resolved",
    scope: "transient",
    dependencyTokens: deps,
    factory: () => null,
    tags: new Map(),
  };
}

function mockClass(
  implementationClass: Constructor<unknown>,
  id: string = createBindingIdentifier(),
): ClassBinding<unknown> {
  return {
    id: id as BindingIdentifier,
    kind: "class",
    scope: "transient",
    implementationClass,
    tags: new Map(),
  };
}

describe("dependency-graph", () => {
  describe("injectHintLabelFromResolveHint", () => {
    it("returns undefined for undefined hint", () => {
      expect(injectHintLabelFromResolveHint(undefined)).toBeUndefined();
    });

    it("formats named hints", () => {
      expect(injectHintLabelFromResolveHint({ name: "primary-db" })).toBe("name: primary-db");
    });

    it("formats tagged hints with string values", () => {
      expect(injectHintLabelFromResolveHint({ tag: ["role", "admin"] })).toBe("tag: role=admin");
    });

    it("formats tagged hints with object values", () => {
      expect(injectHintLabelFromResolveHint({ tag: ["role", { id: 1 }] })).toBe(
        'tag: role={"id":1}',
      );
    });

    it("formats tagged hints with unserializable objects", () => {
      const complexObj = {} as Record<string, unknown>;
      complexObj.self = complexObj;
      expect(injectHintLabelFromResolveHint({ tag: ["role", complexObj] })).toBe(
        "tag: role=[object Object]",
      );
    });
  });

  describe("listResolvedDependencies", () => {
    it("returns [] for constant bindings", () => {
      const constantBinding = mockConstant();
      expect(listResolvedDependencies(constantBinding, () => [], undefined, [])).toEqual([]);
    });

    it("returns [] for alias binding if target is missing", () => {
      const missingAliasBinding = mockAlias(token("MissingProvider"));
      expect(listResolvedDependencies(missingAliasBinding, () => undefined, undefined, [])).toEqual(
        [],
      );
    });

    it("expands alias chain to real binding", () => {
      const StorageToken = token("Storage");
      const SqliteStorageBinding = mockConstant();
      const storageAlias = mockAlias(StorageToken);

      const res = listResolvedDependencies(
        storageAlias,
        (key) => (key === StorageToken ? [SqliteStorageBinding] : []),
        undefined,
        ["AppRoot"],
      );
      expect(res.length).toBe(1);
      expect(res[0]?.binding).toBe(SqliteStorageBinding);
      expect(res[0]?.path).toEqual(["AppRoot", "Storage"]);
    });

    it("throws DiError if resolved factory dependencies are missing", () => {
      const RequiredDepToken = token("RequiredDep");
      const factoryBinding = mockResolved([RequiredDepToken]);

      expect(() => {
        listResolvedDependencies(factoryBinding, () => undefined, undefined, ["Root"]);
      }).toThrowError(/Missing binding for dependency "RequiredDep"/);
    });

    it("handles class dependencies missing metadata reader", () => {
      class UserRepository {}
      const repositoryBinding = mockClass(UserRepository);
      expect(listResolvedDependencies(repositoryBinding, () => [], undefined, ["Root"])).toEqual(
        [],
      );
    });

    it("throws DiError on missing required parameter dependencies for class", () => {
      class UserRepository {}
      const DatabaseToken = token("Database");
      const repositoryBinding = mockClass(UserRepository);
      const reader: MetadataReader = {
        getConstructorMetadata: () => ({
          params: [{ index: 0, optional: false, token: DatabaseToken }],
        }),
      };

      expect(() => {
        listResolvedDependencies(repositoryBinding, () => undefined, reader, ["Root"]);
      }).toThrowError(/Missing binding for constructor parameter "Database"/);
    });

    it("ignores missing optional parameter dependencies for class", () => {
      class UserRepository {}
      const LoggerToken = token("Logger");
      const repositoryBinding = mockClass(UserRepository);
      const reader: MetadataReader = {
        getConstructorMetadata: () => ({
          params: [{ index: 0, optional: true, token: LoggerToken }],
        }),
      };

      const res = listResolvedDependencies(repositoryBinding, () => undefined, reader, ["Root"]);
      expect(res).toEqual([]);
    });

    it("handles deeply nested aliases breaking gracefully on missing links", () => {
      const PrimaryDatabaseToken = token("PrimaryDB");
      const ReplicaDatabaseToken = token("ReplicaDB");
      const databaseAlias = mockAlias(ReplicaDatabaseToken);
      const rootAlias = mockAlias(PrimaryDatabaseToken);

      const lookup = (key: unknown) => {
        if (key === PrimaryDatabaseToken) {
          return [databaseAlias];
        }
        return undefined; // ReplicaDB is missing
      };

      const res = listResolvedDependencies(rootAlias, lookup, undefined, []);
      // Should resolve to the last known link, which is databaseAlias
      expect(res.length).toBe(1);
      expect(res[0]?.binding).toBe(databaseAlias);
    });
  });
});
