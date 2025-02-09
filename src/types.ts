import z from "zod";

export type Action<T extends z.ZodType> = {
  name: string;
  description: string;
  schema: T;
  execute(data: z.infer<T>, env: Environment): Promise<void>;
};

export type Environment = {
  root: string;
  cwd: string;

  // File handling
  resolve: (fname: string) => string;
  read: (fname: string) => string;
  write: (fname: string, content: string) => void;
  exists: (fname: string) => boolean;

  // JSON merge handling
  updateJSON(fname: string, changes: Record<string, unknown>): void;

  // Template asset handling
  globAssets: (patterns: string[]) => string[];
  resolveAsset: (fname: string) => string;
  readAsset: (fname: string) => string;
};

export const argumentSchema = z.object({
  type: z.enum(["string", "number", "boolean"]),
  required: z.boolean().optional(),
  default: z.any().optional(),
  description: z.string(),
});

export const templateSchema = z.object({
  name: z.string(),
  description: z.string(),
  version: z.number(),
  arguments: z.record(z.string(), argumentSchema),
  variables: z
    .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
    .optional(),
  phases: z.array(
    z.object({
      name: z.string(),
      steps: z.array(z.any()),
    })
  ),
});
