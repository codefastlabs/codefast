import type { Metadata } from 'next';
import type { JSX } from 'react';

import Image from 'next/image';
import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';

import type { Task } from '@/app/examples/tasks/_data/schema';

import { columns } from '@/app/examples/tasks/_components/columns';
import { DataTable } from '@/app/examples/tasks/_components/data-table';
import { UserNav } from '@/app/examples/tasks/_components/user-nav';
import { taskSchema } from '@/app/examples/tasks/_data/schema';

export const metadata: Metadata = {
  description: 'A task and issue tracker build using Tanstack Table.',
  title: 'Tasks',
};

// Simulate a database read for tasks.
function getTasks(): Task[] {
  const data = fs.readFileSync(path.join(process.cwd(), 'app/examples/tasks/_data/tasks.json'));

  const tasks = JSON.parse(data.toString()) as Task[];

  return z.array(taskSchema).parse(tasks);
}

export default function TaskPage(): JSX.Element {
  const tasks = getTasks();

  return (
    <>
      <div className="md:hidden">
        <Image
          alt="Playground"
          className="block dark:hidden"
          height={998}
          src="/examples/tasks-light.png"
          width={1280}
        />
        <Image
          alt="Playground"
          className="hidden dark:block"
          height={998}
          src="/examples/tasks-dark.png"
          width={1280}
        />
      </div>
      <div className="hidden h-full flex-1 flex-col gap-y-8 p-8 md:flex">
        <div className="flex items-center justify-between gap-y-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Welcome back!</h2>
            <p className="text-muted-foreground">
              Here&apos;s a list of your tasks for this month!
            </p>
          </div>
          <div className="flex items-center gap-x-2">
            <UserNav />
          </div>
        </div>
        <DataTable columns={columns} data={tasks} />
      </div>
    </>
  );
}
