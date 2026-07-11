import { Badge } from "@codefast/ui/badge";
import { Button } from "@codefast/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@codefast/ui/card";
import { Input } from "@codefast/ui/input";
import { useRouter } from "@tanstack/react-router";
import { useState } from "react";

import { DemoSection } from "#/components/demo-section";
import type { BoardSnapshot } from "#/features/di/server/tasks";
import {
  addTaskServerFn,
  removeTaskServerFn,
  resetBoardServerFn,
  toggleTaskServerFn,
} from "#/features/di/server/tasks";

interface TaskBoardProps {
  board: BoardSnapshot;
}

/**
 * The interactive half of the DI demo — every mutation goes through a server function
 * (DI on the server), then re-runs the route loader via `router.invalidate()`.
 */
export function TaskBoard({ board }: TaskBoardProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Array<string>>([]);

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
            Handled by request <code className="font-mono text-xs">{board.requestId}</code> · service instance is unique
            every round-trip.
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
  );
}
