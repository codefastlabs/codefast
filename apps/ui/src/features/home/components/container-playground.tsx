import type { Container } from "@codefast/di";
import { DiError, toDotGraph, toMermaidGraph } from "@codefast/di";
import { Button } from "@codefast/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@codefast/ui/tabs";
import { useEffect, useRef, useState } from "react";

import { DependencyGraph } from "#/features/home/components/dependency-graph";
import type { LogEntry } from "#/features/home/components/resolution-log";
import { ResolutionLog } from "#/features/home/components/resolution-log";
import type { OrderService } from "#/features/home/demos/shop";
import { OrderServiceToken, createShop } from "#/features/home/demos/shop";
import { constructionOrder } from "#/features/home/demos/wiring-order";

const STEP_MS = 180;

/** The live container: its real dependency graph, a request scope to open, and a log of what each resolve built. */
export function ContainerPlayground() {
  const [shop] = useState(createShop);
  const [scope, setScope] = useState<Container | null>(null);
  const [scopeCount, setScopeCount] = useState(0);
  const [entries, setEntries] = useState<ReadonlyArray<LogEntry>>([]);
  const [constructed, setConstructed] = useState<ReadonlySet<string>>(() => new Set());
  const [active, setActive] = useState<string | null>(null);
  const seenInstances = useRef(new Set<number>());
  const nextEntryId = useRef(0);
  const timers = useRef<Array<ReturnType<typeof setTimeout>>>([]);

  useEffect(
    () => () => {
      for (const timer of timers.current) {
        clearTimeout(timer);
      }
    },
    [],
  );

  const rootId = shop.graph.nodes.find((node) => node.tokenName === "OrderService")?.id;
  const order = rootId === undefined ? [] : constructionOrder(shop.graph, rootId);

  const append = (tone: LogEntry["tone"], text: string): void => {
    const id = nextEntryId.current;

    nextEntryId.current += 1;
    setEntries((previous) => [...previous, { id, tone, text }]);
  };

  const openScope = (): void => {
    const child = shop.container.createChild();
    const count = scopeCount + 1;

    setScope(child);
    setScopeCount(count);
    append("info", `container.createChild()  → request scope #${count} open`);
  };

  const resolveOrder = (): void => {
    const target = scope ?? shop.container;
    let service: OrderService;

    try {
      service = target.resolve(OrderServiceToken);
    } catch (error: unknown) {
      // The library's stable code, not the class name, which the minified bundle renames.
      append("error", error instanceof DiError ? `${error.code}: ${error.message}` : String(error));

      return;
    }

    const instances = new Map<string, number>([
      ["OrderService", service.instance],
      ["PriceCatalog", service.catalog.instance],
      ["Inventory", service.inventory.instance],
      ["PaymentGateway", service.payments.instance],
      ["RequestContext", service.context.instance],
      ["Logger", service.logger.instance],
    ]);
    const receipt = service.place("SKU-42");

    setConstructed(new Set());
    append("info", `${scope ? `scope #${scopeCount}` : "container"}.resolve(OrderService)`);

    for (const [step, id] of order.entries()) {
      timers.current.push(
        setTimeout(() => {
          setActive(id);
          setConstructed((previous) => new Set([...previous, id]));

          const name = shop.graph.nodes.find((node) => node.id === id)?.tokenName ?? id;
          const instance = instances.get(name);

          if (instance !== undefined) {
            const reused = seenInstances.current.has(instance);

            seenInstances.current.add(instance);
            append("info", `  ${name}#${instance}  ${reused ? "reused" : "new"}`);
          }
        }, step * STEP_MS),
      );
    }

    timers.current.push(
      setTimeout(
        () => {
          setActive(null);
          append("success", `→ place("SKU-42") = ${receipt}`);
        },
        order.length * STEP_MS + 60,
      ),
    );
  };

  const reset = (): void => {
    for (const timer of timers.current) {
      clearTimeout(timer);
    }

    timers.current = [];
    seenInstances.current = new Set();
    setScope(null);
    setEntries([]);
    setConstructed(new Set());
    setActive(null);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <Tabs defaultValue="graph" className="rounded-2xl border border-ui-border/60 bg-ui-card p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="font-mono text-xs text-ui-muted">container.generateDependencyGraph()</p>
          <TabsList>
            <TabsTrigger value="graph">Graph</TabsTrigger>
            <TabsTrigger value="mermaid">Mermaid</TabsTrigger>
            <TabsTrigger value="dot">DOT</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="graph" className="overflow-x-auto">
          <DependencyGraph
            graph={shop.graph}
            constructed={constructed}
            active={active ?? undefined}
            className="min-w-[40rem] sm:min-w-0"
          />
        </TabsContent>
        <TabsContent value="mermaid">
          <pre className="overflow-x-auto rounded-xl bg-ui-surface p-4 font-mono text-xs leading-relaxed text-ui-fg">
            {toMermaidGraph(shop.graph)}
          </pre>
        </TabsContent>
        <TabsContent value="dot">
          <pre className="overflow-x-auto rounded-xl bg-ui-surface p-4 font-mono text-xs leading-relaxed text-ui-fg">
            {toDotGraph(shop.graph)}
          </pre>
        </TabsContent>
      </Tabs>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={openScope}>
            Open request scope
          </Button>
          <Button onClick={resolveOrder} disabled={active !== null}>
            Resolve OrderService
          </Button>
          <Button variant="ghost" onClick={reset}>
            Reset
          </Button>
        </div>
        <ResolutionLog entries={entries} className="flex-1" />
        <p className="text-xs leading-relaxed text-ui-muted">
          Resolving from the root container throws: RequestContext is scoped, so the library refuses until a request
          scope is open. Inside one, the three singletons come back reused, the transient gateway and the root are new
          every time, and the context is new per scope.
        </p>
      </div>
    </div>
  );
}
