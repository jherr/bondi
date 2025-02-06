import z from "zod";
import { Action, Environment } from "../types";

const schema = z.object({
  action: z.literal("add-dependencies"),
  name: z.string(),
  packages: z.record(z.string(), z.string()),
});

function execute({ packages }: z.infer<typeof schema>, env: Environment) {
  env.addDependencies({
    direct: packages,
  });
}

const action: Action<typeof schema> = {
  name: "add-dependencies",
  description: "Add direct dependencies to the project",
  schema,
  execute,
};

export default action;
