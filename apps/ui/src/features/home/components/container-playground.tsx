import type { Container } from "@codefast/di";
import { DiError, toDotGraph, toMermaidGraph } from "@codefast/di";
import { Button } from "@codefast/ui/button";
import { cn } from "@codefast/ui/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@codefast/ui/tabs";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { DependencyGraph } from "#/features/home/components/dependency-graph";
import type { LogEntry } from "#/features/home/components/resolution-log";
import { ResolutionLog } from "#/features/home/components/resolution-log";
import type { OrderService } from "#/features/home/demos/shop";
import { OrderServiceToken, createShop } from "#/features/home/demos/shop";
import { constructionOrder } from "#/features/home/demos/wiring-order";
import { useInView } from "#/hooks/use-in-view";

const STEP_MS = 180;

const SCOPE_LEGEND = [
  { scope: "singleton", note: "one instance, shared by every scope", dot: "bg-ui-brand" },
  { scope: "scoped", note: "one per request scope", dot: "bg-amber-600 dark:bg-amber-400" },
  { scope: "transient", note: "new on every resolve", dot: "bg-ui-muted" },
] as const;

/**
 * The live container: its real dependency graph, a request scope to open, and a log of what each resolve built. The
 * first time it scrolls into view it opens a scope and resolves once on its own, unless the reader got there first.
 */
export function ContainerPlayground() {
  const [shop] = useState(createShop);
  const [entries, setEntries] = useState<ReadonlyArray<LogEntry>>([]);
  const [constructed, setConstructed] = useState<ReadonlySet<string>>(() => new Set());
  const [active, setActive] = useState<string | null>(null);
  // The open scope and its number live in refs: the handlers and the autoplay read them, nothing renders them.
  const scope = useRef<Container | null>(null);
  const scopeCount = useRef(0);
  const interacted = useRef(false);
  const autoplayed = useRef(false);
  const seenInstances = useRef(new Set<number>());
  const nextEntryId = useRef(0);
  const timers = useRef<Array<ReturnType<typeof setTimeout>>>([]);
  const { ref: root, inView } = useInView<HTMLDivElement>({ rootMargin: "-25% 0px" });

  useEffect(
    () => () => {
      for (const timer of timers.current) {
        clearTimeout(timer);
      }
    },
    [],
  );

  const order = useMemo(() => {
    const rootId = shop.graph.nodes.find((node) => node.tokenName === "OrderService")?.id;

    return rootId === undefined ? [] : constructionOrder(shop.graph, rootId);
  }, [shop]);

  const append = useCallback((tone: LogEntry["tone"], text: string): void => {
    const id = nextEntryId.current;

    nextEntryId.current += 1;
    setEntries((previous) => [...previous, { id, tone, text }]);
  }, []);

  const openScope = useCallback((): void => {
    scope.current = shop.container.createChild();
    scopeCount.current += 1;
    append("info", `container.createChild()  → request scope #${scopeCount.current} open`);
  }, [append, shop]);

  const resolveOrder = useCallback((): void => {
    const target = scope.current ?? shop.container;
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
    append("info", `${scope.current ? `scope #${scopeCount.current}` : "container"}.resolve(OrderService)`);

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
  }, [append, order, shop]);

  const reset = useCallback((): void => {
    for (const timer of timers.current) {
      clearTimeout(timer);
    }

    timers.current = [];
    seenInstances.current = new Set();
    scope.current = null;
    scopeCount.current = 0;
    setEntries([]);
    setConstructed(new Set());
    setActive(null);
  }, []);

  // Autoplay once: the section should move before anyone clicks, but never over a reader's own run.
  useEffect(() => {
    if (!inView || autoplayed.current || interacted.current) {
      return;
    }

    autoplayed.current = true;
    timers.current.push(setTimeout(openScope, 500), setTimeout(resolveOrder, 1100));
  }, [inView, openScope, resolveOrder]);

  return (
    <div ref={root} className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <Tabs defaultValue="graph" className="rounded-2xl border border-ui-border/60 bg-ui-card p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="font-mono text-xs text-ui-muted">container.generateDependencyGraph()</p>
          <TabsList>
            <TabsTrigger value="graph">Graph</TabsTrigger>
            <TabsTrigger value="mermaid">Mermaid</TabsTrigger>
            <TabsTrigger value="dot">DOT</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="graph" className="relative">
          <div className="overflow-x-auto">
            <DependencyGraph
              graph={shop.graph}
              constructed={constructed}
              active={active ?? undefined}
              className="min-w-[40rem] sm:min-w-0"
            />
          </div>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-linear-to-l from-ui-card to-transparent sm:hidden"
          />
          <p className="mt-2 text-xs text-ui-muted sm:hidden">Scroll sideways for the whole graph.</p>
          <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-ui-muted" aria-label="Scope legend">
            {SCOPE_LEGEND.map(({ scope: name, note, dot }) => (
              <li key={name} className="flex items-center gap-2">
                <span aria-hidden className={cn("size-2 rounded-full", dot)} />
                <span className="font-mono text-ui-fg">{name}</span>
                <span>{note}</span>
              </li>
            ))}
          </ul>
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
          <Button
            variant="outline"
            onClick={() => {
              interacted.current = true;
              openScope();
            }}
          >
            Open request scope
          </Button>
          <Button
            onClick={() => {
              interacted.current = true;
              resolveOrder();
            }}
            disabled={active !== null}
          >
            Resolve OrderService
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              interacted.current = true;
              reset();
            }}
          >
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
