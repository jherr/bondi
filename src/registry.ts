import fs from "node:fs";
import { jsonc } from "jsonc";
import z from "zod";

import { load } from "./template";
import { argumentSchema } from "./types";

const registrySchema = z.array(
  z.object({
    name: z.string(),
    description: z.string(),
    template: z.string(),
    dependsOn: z.array(z.string()).optional(),
  })
);

// TODO: Should be a proper DAG that detects circular dependencies
export function getRegistry(file: string) {
  const registryJSON = jsonc.parse(fs.readFileSync(file, "utf-8"));
  const registry = registrySchema.parse(registryJSON);

  function resolveDependencies(template: string): string[] {
    const templ = registry.find((t) => t.name === template);
    if (!templ) {
      throw new Error(`Template ${template} not found in registry`);
    }
    const result = [];
    result.unshift(template);
    if (templ.dependsOn) {
      result.unshift(...templ.dependsOn.map((t) => resolveDependencies(t)));
    }
    return result.flat();
  }

  return {
    resolveDependencies,
    registry,
  };
}

export async function getArguments(
  templates: string[]
): Promise<(z.infer<typeof argumentSchema> & { name: string })[]> {
  const args: Map<string, z.infer<typeof argumentSchema> & { name: string }> =
    new Map();
  for (const templateName of templates) {
    const template = await load(templateName);
    for (const arg of Object.entries(template.arguments || [])) {
      args.set(arg[0], {
        name: arg[0],
        ...arg[1],
      });
    }
  }
  return Array.from(args.values());
}
