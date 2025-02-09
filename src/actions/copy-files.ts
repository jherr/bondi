import z from "zod";
import { Action, Environment } from "../types";

const schema = z.object({
  action: z.literal("copy-files"),
  name: z.string(),
  files: z
    .array(
      z.union([
        z.string(),
        z.object({
          source: z.string(),
          target: z.string(),
        }),
      ])
    )
    .optional(),
  globs: z.array(z.string()).optional(),
});

async function execute(
  { files, globs }: z.infer<typeof schema>,
  env: Environment
) {
  const filesToCopy = [...(files || []), ...env.globAssets(globs || [])];
  console.log(filesToCopy);
  for (const file of filesToCopy) {
    if (typeof file === "object") {
      const resolvedPath = env.resolveAsset(file.source);
      const content = env.readAsset(resolvedPath);
      env.write(file.target, content);
    } else {
      const resolvedPath = env.resolveAsset(file);
      const content = env.readAsset(resolvedPath);
      env.write(file, content);
    }
  }
}

const action: Action<typeof schema> = {
  name: "copy-files",
  description: "Copy files from the template into the project",
  schema,
  execute,
};

export default action;
