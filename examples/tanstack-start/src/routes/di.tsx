import { createFileRoute } from "@tanstack/react-router";

import { ActivityLogCard } from "#/features/di/components/activity-log-card";
import { ContainerInspectorCard } from "#/features/di/components/container-inspector-card";
import { DependencyGraphCard } from "#/features/di/components/dependency-graph-card";
import { TaskBoard } from "#/features/di/components/task-board";
import { getBoardServerFn } from "#/features/di/server/tasks";

export const Route = createFileRoute("/di")({
  // The loader calls a server function, so the DI container resolves a per-request TaskService on
  // the server; only the plain board snapshot crosses to the client.
  loader: () => getBoardServerFn(),
  component: DiPage,
});

function DiPage() {
  const board = Route.useLoaderData();

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

      <TaskBoard board={board} />
      <ActivityLogCard entries={board.activity} />
      <DependencyGraphCard graph={board.graph} graphDot={board.graphDot} />
      <ContainerInspectorCard bindings={board.bindings} transientProof={board.transientProof} />
    </div>
  );
}
