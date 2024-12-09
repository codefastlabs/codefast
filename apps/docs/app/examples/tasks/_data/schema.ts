import { z } from 'zod';

// We're keeping a simple non-relational schema here.
// IRL, you will have a schema for your data models.
export const taskSchema = z.object({
  id: z.string().trim(),
  label: z.string().trim(),
  priority: z.string().trim(),
  status: z.string().trim(),
  title: z.string().trim(),
});

export type TaskSchema = z.infer<typeof taskSchema>;

export type Task = Partial<TaskSchema>;
