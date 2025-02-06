import z from "zod";
import { Action, Environment } from "../types";

const schema = z.object({
  action: z.literal("update-package-json"),
  name: z.string(),
  content: z.record(z.string(), z.any()),
});

function execute({ content }: z.infer<typeof schema>, env: Environment) {
  env.deepMergeIntoPackageJson(content);
}

const action: Action<typeof schema> = {
  name: "update-package-json",
  description: "Update the package.json file",
  schema,
  execute,
};

export default action;
