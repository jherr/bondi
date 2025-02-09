import z from "zod";
import { Action, Environment } from "../types";

const schema = z.object({
  action: z.literal("update-json"),
  name: z.string(),
  file: z.string(),
});

async function execute({ file }: z.infer<typeof schema>, env: Environment) {
  const content = env.readAsset(file);
  env.updateJSON(file, JSON.parse(content));
}

const action: Action<typeof schema> = {
  name: "update-json",
  description: "Update a JSON file",
  schema,
  execute,
};

export default action;
