import type { Binding, BindingIdentifier, Constructor, ResolveHint } from "#/binding";
import type { Token } from "#/token";
export type RegistryKey = Token<unknown> | Constructor<unknown>;
export class BindingRegistry {
  private readonly bindingsByKey = new Map<RegistryKey, Binding<unknown>[]>();
  private readonly namedIndexByKey = new Map<RegistryKey, Map<string, Binding<unknown>[]>>();
  private readonly unnamedIndexByKey = new Map<RegistryKey, Binding<unknown>[]>();
  private indexInsert(key: RegistryKey, binding: Binding<unknown>): void {
    if (binding.bindingName !== undefined) {
      let namedMap = this.namedIndexByKey.get(key);
      if (namedMap === undefined) {
        namedMap = new Map<string, Binding<unknown>[]>();
        this.namedIndexByKey.set(key, namedMap);
      }
      const namedList = namedMap.get(binding.bindingName);
      if (namedList !== undefined) {
        namedList.push(binding);
      } else {
        namedMap.set(binding.bindingName, [binding]);
      }
      return;
    }
    const unnamedList = this.unnamedIndexByKey.get(key);
    if (unnamedList !== undefined) {
      unnamedList.push(binding);
    } else {
      this.unnamedIndexByKey.set(key, [binding]);
    }
  }
  private indexRemove(key: RegistryKey, binding: Binding<unknown>): void {
    if (binding.bindingName !== undefined) {
      const namedMap = this.namedIndexByKey.get(key);
      if (namedMap === undefined) {
        return;
      }
      const namedList = namedMap.get(binding.bindingName);
      if (namedList === undefined) {
        return;
      }
      const removeIndex = namedList.indexOf(binding);
      if (removeIndex !== -1) {
        namedList.splice(removeIndex, 1);
      }
      if (namedList.length === 0) {
        namedMap.delete(binding.bindingName);
      }
      if (namedMap.size === 0) {
        this.namedIndexByKey.delete(key);
      }
      return;
    }
    const unnamedList = this.unnamedIndexByKey.get(key);
    if (unnamedList === undefined) {
      return;
    }
    const removeIndex = unnamedList.indexOf(binding);
    if (removeIndex !== -1) {
      unnamedList.splice(removeIndex, 1);
    }
    if (unnamedList.length === 0) {
      this.unnamedIndexByKey.delete(key);
    }
  }
  add<Value>(key: Token<Value> | Constructor<Value>, binding: Binding<Value>): void {
    const registryKey = key as RegistryKey;
    const nextBinding = binding as Binding<unknown>;
    const existing = this.bindingsByKey.get(registryKey);
    if (existing === undefined) {
      this.bindingsByKey.set(registryKey, [nextBinding]);
    } else {
      existing.push(nextBinding);
    }
    this.indexInsert(registryKey, nextBinding);
  }
  get<Value>(key: Token<Value> | Constructor<Value>): readonly Binding<Value>[] | undefined {
    const found = this.bindingsByKey.get(key as RegistryKey);
    return found as readonly Binding<Value>[] | undefined;
  }
  remove(key: RegistryKey): void {
    this.bindingsByKey.delete(key);
    this.namedIndexByKey.delete(key);
    this.unnamedIndexByKey.delete(key);
  }
  listEntries(): readonly {
    key: RegistryKey;
    bindings: readonly Binding<unknown>[];
  }[] {
    return [...this.bindingsByKey.entries()].map(([key, bindings]) => ({ key, bindings }));
  }
  removeById(id: BindingIdentifier): void {
    for (const [registryKey, list] of this.bindingsByKey.entries()) {
      const removeIndex = list.findIndex((binding) => binding.id === id);
      if (removeIndex === -1) {
        continue;
      }
      const [removedBinding] = list.splice(removeIndex, 1);
      if (removedBinding !== undefined) {
        this.indexRemove(registryKey, removedBinding);
      }
      if (list.length === 0) {
        this.bindingsByKey.delete(registryKey);
        this.namedIndexByKey.delete(registryKey);
        this.unnamedIndexByKey.delete(registryKey);
      }
      return;
    }
  }
  replaceById(id: BindingIdentifier, next: Binding<unknown>): void {
    for (const [registryKey, list] of this.bindingsByKey.entries()) {
      const index = list.findIndex((binding) => binding.id === id);
      if (index === -1) {
        continue;
      }
      const oldBinding = list[index];
      if (oldBinding !== undefined) {
        this.indexRemove(registryKey, oldBinding);
      }
      list[index] = next;
      this.indexInsert(registryKey, next);
      return;
    }
  }
  getSingleBinding<Value>(
    key: Token<Value> | Constructor<Value>,
    hint: ResolveHint | undefined,
  ): Binding<Value> | undefined {
    const registryKey = key as RegistryKey;
    if (hint?.name !== undefined) {
      const namedMatches = this.namedIndexByKey.get(registryKey)?.get(hint.name);
      return namedMatches?.length === 1 ? (namedMatches[0] as Binding<Value>) : undefined;
    }
    const list = this.bindingsByKey.get(registryKey);
    if (list === undefined) {
      return undefined;
    }
    if (hint === undefined || (hint.name === undefined && hint.tag === undefined)) {
      const unnamed = this.unnamedIndexByKey.get(registryKey);
      if (unnamed !== undefined && unnamed.length === 1) {
        return unnamed[0] as Binding<Value>;
      }
      if (unnamed === undefined || unnamed.length === 0) {
        return list.length === 1 ? (list[0] as Binding<Value>) : undefined;
      }
      return undefined;
    }
    const candidates = list.filter((binding) => {
      if (hint.tag !== undefined) {
        const [tagKey, tagValue] = hint.tag;
        if (!Object.is(binding.tags.get(tagKey), tagValue)) {
          return false;
        }
      }
      return true;
    });
    return candidates.length === 1 ? (candidates[0] as Binding<Value>) : undefined;
  }
}
