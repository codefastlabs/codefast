import { Badge } from "@codefast/ui/badge";
import { Button } from "@codefast/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@codefast/ui/card";
import { Input } from "@codefast/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@codefast/ui/tabs";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";

import { DemoSection } from "#/components/demo-section";
import { DependencyGraph } from "#/components/dependency-graph";
import {
  addTaskServerFn,
  getBoardServerFn,
  removeTaskServerFn,
  resetBoardServerFn,
  toggleTaskServerFn,
} from "#/server/tasks";

export const Route = createFileRoute("/di")({
  // The loader calls a server function, so the DI container resolves a per-request TaskService on
  // the server; only the plain board snapshot crosses to the client.
  loader: () => getBoardServerFn(),
  component: DiPage,
});

function DiPage() {
  const board = Route.useLoaderData();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Array<string>>([]);

  // Every mutation goes through a server function (DI on the server), then re-runs the loader.
  async function run(action: () => Promise<unknown>): Promise<void> {
    setBusy(true);

    try {
      await action();
      setErrors([]);
      await router.invalidate();
    } catch (error) {
      setErrors([error instanceof Error ? error.message : "Request failed."]);
    } finally {
      setBusy(false);
    }
  }

  // Add is special: the server fn returns validation errors that must survive the loader re-run.
  async function submit(next: string): Promise<void> {
    setBusy(true);

    try {
      const result = await addTaskServerFn({ data: { title: next } });
      const validationErrors = result.validationErrors ?? [];

      setErrors(validationErrors);

      if (validationErrors.length === 0) {
        setTitle("");
      }

      await router.invalidate();
    } catch (error) {
      setErrors([error instanceof Error ? error.message : "Request failed."]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">@codefast/di — fullstack</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          A server-side composition root wires the object graph with <code className="font-mono">@injectable</code>{" "}
          constructor injection and modules. Each request you trigger below resolves a fresh{" "}
          <code className="font-mono">TaskService</code> from a child container (then{" "}
          <code className="font-mono">dispose()</code>s it), while the repository and activity log stay singletons on
          the server.
        </p>
      </header>

      <DemoSection
        description="Add, complete, or remove tasks — each click is a server function that resolves its service from the container."
        title="Task board"
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base">Tasks</CardTitle>
              <Badge variant={board.metricsEnabled ? "default" : "secondary"}>
                metrics {board.metricsEnabled ? "on" : "off"}
              </Badge>
            </div>
            <CardDescription>
              Handled by request <code className="font-mono text-xs">{board.requestId}</code> · service instance is
              unique every round-trip.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form
              className="flex gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                void submit(title);
              }}
            >
              <Input
                aria-label="New task title"
                disabled={busy}
                onChange={(event) => {
                  setTitle(event.target.value);
                }}
                placeholder="Add a task…"
                value={title}
              />
              <Button disabled={busy} type="submit">
                Add
              </Button>
            </form>

            {errors.length > 0 && (
              <ul className="space-y-1 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                {errors.map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            )}

            <ul className="divide-y divide-border">
              {board.tasks.length === 0 ? (
                <li className="py-3 text-sm text-muted-foreground">No tasks yet — add one above.</li>
              ) : (
                board.tasks.map((task) => (
                  <li key={task.id} className="flex items-center justify-between gap-3 py-2">
                    <button
                      className="flex items-center gap-2 text-left text-sm"
                      disabled={busy}
                      onClick={() => {
                        void run(() => toggleTaskServerFn({ data: { id: task.id } }));
                      }}
                      type="button"
                    >
                      <span
                        className={`flex size-4 items-center justify-center rounded border ${task.done ? "border-primary bg-primary text-primary-foreground" : "border-input"}`}
                      >
                        {task.done ? "✓" : ""}
                      </span>
                      <span className={task.done ? "text-muted-foreground line-through" : ""}>{task.title}</span>
                    </button>
                    <Button
                      aria-label={`Remove ${task.title}`}
                      disabled={busy}
                      onClick={() => {
                        void run(() => removeTaskServerFn({ data: { id: task.id } }));
                      }}
                      size="sm"
                      variant="ghost"
                    >
                      Remove
                    </Button>
                  </li>
                ))
              )}
            </ul>

            <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
              <span className="text-xs text-muted-foreground">
                Reset uses <code className="font-mono">container.rebind()</code> to swap the repository instance.
              </span>
              <Button
                disabled={busy}
                onClick={() => {
                  void run(() => resetBoardServerFn());
                }}
                size="sm"
                variant="outline"
              >
                Reset board
              </Button>
            </div>
          </CardContent>
        </Card>
      </DemoSection>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Activity log</CardTitle>
          <CardDescription>Singleton service — entries persist across requests.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1 text-sm">
            {board.activity.map((entry, index) => (
              <li key={index} className="text-muted-foreground">
                <span className="mr-2 text-foreground/40 tabular-nums">{String(index + 1).padStart(2, "0")}</span>
                {entry}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-base">Dependency graph</CardTitle>
            <Badge variant="secondary">validated ✓</Badge>
          </div>
          <CardDescription>
            From <code className="font-mono text-xs">generateDependencyGraph()</code> — React Flow visual and Graphviz
            DOT source.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="graph">
            <TabsList>
              <TabsTrigger value="graph">Graph</TabsTrigger>
              <TabsTrigger value="dot">DOT</TabsTrigger>
            </TabsList>
            <TabsContent className="pt-3" value="graph">
              <DependencyGraph edges={board.graph.edges} nodes={board.graph.nodes} />
            </TabsContent>
            <TabsContent className="pt-3" value="dot">
              <pre className="h-[28rem] overflow-auto rounded-md border border-border bg-muted p-4 font-mono text-xs text-muted-foreground">
                {board.graphDot}
              </pre>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-base">Container inspector</CardTitle>
            <Badge variant="secondary">{board.bindings.length} bindings</Badge>
          </div>
          <CardDescription>
            Serialized from <code className="font-mono text-xs">container.inspect()</code> — every binding on the root
            container with its scope and kind.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs tracking-wide text-muted-foreground uppercase">
                  <th className="py-2 pr-4 font-medium">Token</th>
                  <th className="py-2 pr-4 font-medium">Scope</th>
                  <th className="py-2 font-medium">Kind</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {board.bindings.map((binding, index) => (
                  <tr key={`${binding.token}-${index}`}>
                    <td className="py-2 pr-4 font-mono text-xs">{binding.token}</td>
                    <td className="py-2 pr-4">
                      <Badge
                        variant={
                          binding.scope === "singleton"
                            ? "default"
                            : binding.scope === "transient"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {binding.scope}
                      </Badge>
                    </td>
                    <td className="py-2 font-mono text-xs text-muted-foreground">{binding.kind}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="border-t border-border pt-3 text-xs text-muted-foreground">
            Transient <code className="font-mono">IdGenerator</code> — two resolves from one request gave{" "}
            <code className="font-mono">{board.transientProof.first}</code> and{" "}
            <code className="font-mono">{board.transientProof.second}</code> ({" "}
            {board.transientProof.distinct ? "distinct instances ✓" : "same instance ✗"} ).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
