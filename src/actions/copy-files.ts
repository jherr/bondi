import z from "zod";
import { Action, Environment } from "../types";

const schema = z.object({
  action: z.literal("copy-files"),
  name: z.string(),
  files: z.array(
    z.union([
      z.string(),
      z.object({
        source: z.string(),
        target: z.string(),
      }),
    ])
  ),
});

async function execute({ files }: z.infer<typeof schema>, env: Environment) {
  for (const file of files) {
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
