import { intro, outro, log } from "@clack/prompts";
import color from "picocolors";

import { execute } from "./template";
import { getRegistry } from "./registry";

const registry = getRegistry("./templates/registry.json");

intro("Building `test`");

execute("test", registry.resolveDependencies("tailwind"), {
  arguments: { port: 8080 },
  fresh: true,
  events: {
    onTemplateStart: (template) => log.step(`${template}`),
    onStep: (_template, name) =>
      log.message(name, { symbol: color.cyan("✔︎") }),
  },
});

outro("Your project is ready");
