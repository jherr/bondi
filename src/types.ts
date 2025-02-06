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
