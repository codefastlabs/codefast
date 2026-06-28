import { Badge } from "@codefast/ui/badge";
import { Button } from "@codefast/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@codefast/ui/card";
import { Input } from "@codefast/ui/input";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";

import { DemoSection } from "#/components/demo-section";
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

  // Every mutation goes through a server function (DI on the server), then re-runs the loader.
  async function run(action: () => Promise<unknown>): Promise<void> {
    setBusy(true);

    try {
      await action();
      await router.invalidate();
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
          constructor injection and modules. Each request you trigger below resolves a{" "}
          <code className="font-mono">scoped</code> <code className="font-mono">TaskService</code> from a fresh child
          container, while the repository and activity log stay singletons on the server.
        </p>
      </header>

      <DemoSection
        description="Add, complete, or remove tasks — each click is a server function that resolves its service from the container."
        title="Task board"
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tasks</CardTitle>
            <CardDescription>
              Handled by request <code className="font-mono text-xs">{board.requestId}</code> · scoped instances differ
              every round-trip.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form
              className="flex gap-2"
              onSubmit={(event) => {
                event.preventDefault();

                const next = title.trim();

                if (!next) {
                  return;
                }

                setTitle("");
                void run(() => addTaskServerFn({ data: { title: next } }));
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
              <Button disabled={busy || title.trim().length === 0} type="submit">
                Add
              </Button>
            </form>

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

      <div className="grid gap-4 md:grid-cols-2">
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
              From <code className="font-mono text-xs">container.generateDependencyGraph()</code>.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="max-h-64 overflow-auto rounded-md bg-muted p-3 text-xs text-muted-foreground">
              {board.graph}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
