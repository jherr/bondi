import z from "zod";

export type Action<T extends z.ZodType> = {
  name: string;
  description: string;
  schema: T;
  execute: (data: z.infer<T>, env: Environment) => void;
};

export type Environment = {
  root: string;
  cwd: string;

  // File handling
  resolve: (path: string) => string;
  read: (path: string) => string;
  write: (path: string, content: string) => void;
  exists: (path: string) => boolean;

  // Package handling
  addDependencies({
    direct,
    development,
  }: {
    direct?: Record<string, string>;
    development?: Record<string, string>;
  }): void;
  deepMergeIntoPackageJson(changes: Record<string, unknown>): void;

  // Template asset handling
  resolveAsset: (path: string) => string;
  readAsset: (path: string) => string;
};

export const templateSchema = z.object({
  name: z.string(),
  description: z.string(),
  version: z.number(),
  arguments: z.record(
    z.string(),
    z.object({
      type: z.enum(["string", "number", "boolean"]),
      required: z.boolean().optional(),
      default: z.any().optional(),
      description: z.string(),
    })
  ),
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
