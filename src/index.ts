import { intro, outro, log, text, isCancel } from "@clack/prompts";
import color from "picocolors";

import { execute } from "./template";
import { getRegistry, getArguments } from "./registry";

const registry = getRegistry("./templates/registry.json");

(async () => {
  const templates = registry.resolveDependencies("tailwind");

  const argumentDefinitions = await getArguments(templates);

  const args: Record<string, number | string | boolean> = {};

  for (const arg of argumentDefinitions) {
    if (arg.type === "string") {
      const value = await text({
        message: arg.description,
        defaultValue: arg.default,
      });
      if (isCancel(value)) {
        process.exit(0);
      }
      args[arg.name] = value;
    }
    if (arg.type === "number") {
      const value = await text({
        message: `${arg.description}${
          arg.default ? ` (default: ${arg.default})` : ""
        }`,
        defaultValue: arg.default,
      });
      if (isCancel(value)) {
        process.exit(0);
      }
      args[arg.name] = Number(value);
    }
  }

  intro(`Building ${args.name}`);

  await execute(args.name as string, templates, {
    arguments: args,
    fresh: true,
    events: {
      onTemplateStart: (template) => log.step(template),
      onStep: (_template, name) =>
        log.message(name, { symbol: color.cyan("✔︎") }),
    },
  });

  outro("Your project is ready");
})();
