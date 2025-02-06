import z from "zod";
import { Action, Environment } from "../types";

const schema = z.object({
  action: z.literal("add-dev-dependencies"),
  name: z.string(),
  packages: z.record(z.string(), z.string()),
});

function execute({ packages }: z.infer<typeof schema>, env: Environment) {
  env.addDependencies({
    development: packages,
  });
}

const action: Action<typeof schema> = {
  name: "add-dev-dependencies",
  description: "Add development dependencies to the project",
  schema,
  execute,
};

export default action;
