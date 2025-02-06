import { execute } from "./template";
import { getRegistry } from "./registry";

const registry = getRegistry("./templates/registry.jsonc");

execute("test", registry.resolveDependencies("tailwind"), {
  arguments: { port: 8080 },
  fresh: true,
});
