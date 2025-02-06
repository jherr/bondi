import z from "zod";
import { Action, Environment } from "../types";

const schema = z.object({
  action: z.literal("update-json"),
  name: z.string(),
  file: z.string(),
  content: z.record(z.string(), z.any()),
});

async function execute(
  { file, content }: z.infer<typeof schema>,
  env: Environment
) {
  env.updateJSON(file, content);
}

const action: Action<typeof schema> = {
  name: "update-json",
  description: "Update a JSON file",
  schema,
  execute,
};

export default action;
