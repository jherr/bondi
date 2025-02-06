import z from "zod";
import { Action, Environment } from "../types";

const schema = z.object({
  action: z.literal("copy-files"),
  files: z.array(z.string()),
});

function execute({ files }: z.infer<typeof schema>, env: Environment) {
  for (const file of files) {
    const resolvedPath = env.resolve(file);
    const content = env.readAsset(resolvedPath);
    env.write(resolvedPath, content);
  }
}

const action: Action<typeof schema> = {
  name: "copy-files",
  description: "Copy files from the template into the project",
  schema,
  execute,
};

export default action;
