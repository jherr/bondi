import fs from "fs";
import path from "path";
import { deepmerge } from "deepmerge-ts";
import z from "zod";
import { generateErrorMessage } from "zod-error";
import rimraf from "rimraf";

import * as actions from "./actions";

import type { Environment, Action } from "./types";

const ASSETS = "assets";

function createEnvironment(
  templateBasePath: string,
  projectBasePath: string
): Environment {
  const environment: Environment = {
    root: projectBasePath,
    cwd: process.cwd(),
    resolve: (p: string) => {
      if (p.startsWith("assets:")) {
        return path.join(templateBasePath, ASSETS, p.slice("assets:".length));
      }
      return path.join(projectBasePath, p);
    },
    read: (p: string) =>
      fs.readFileSync(path.join(projectBasePath, p), "utf-8"),
    write: (p: string, content: string) =>
      fs.writeFileSync(path.join(projectBasePath, p), content),
    exists: (p: string) => fs.existsSync(path.join(projectBasePath, p)),
    readAsset: (p: string) => {
      return fs.readFileSync(path.join(templateBasePath, ASSETS, p), "utf-8");
    },
    addDependencies: (dependencies: {
      direct: Record<string, string>;
      development: Record<string, string>;
    }) => {
      if (!fs.existsSync(path.join(projectBasePath, "package.json"))) {
        fs.writeFileSync(
          path.join(projectBasePath, "package.json"),
          JSON.stringify({ dependencies: {}, devDependencies: {} }, null, 2)
        );
      }
      const packageJson = JSON.parse(
        fs.readFileSync(path.join(projectBasePath, "package.json"), "utf-8")
      );
      packageJson.dependencies = {
        ...packageJson.dependencies,
        ...dependencies.direct,
      };
      packageJson.devDependencies = {
        ...packageJson.devDependencies,
        ...dependencies.development,
      };
      fs.writeFileSync(
        path.join(projectBasePath, "package.json"),
        JSON.stringify(packageJson, null, 2)
      );
    },
    deepMergeIntoPackageJson: (changes: Record<string, unknown>) => {
      const packageJson = JSON.parse(
        fs.readFileSync(path.join(projectBasePath, "package.json"), "utf-8")
      );
      fs.writeFileSync(
        path.join(projectBasePath, "package.json"),
        JSON.stringify(deepmerge(packageJson, changes), null, 2)
      );
    },
  };
  return environment;
}

const actionSchemas: Record<string, z.ZodSchema> = {
  "add-dependencies": actions.addDependencies.schema,
  "add-dev-dependencies": actions.addDevDependencies.schema,
  "copy-files": actions.copyFiles.schema,
  "update-package-json": actions.updatePackageJson.schema,
};

const templateSchema = z.object({
  name: z.string(),
  description: z.string(),
  version: z.number(),
  phases: z.array(
    z.object({
      name: z.string(),
      steps: z.array(z.any()),
    })
  ),
});

function validateTemplate(
  templateBasePath: string
): z.infer<typeof templateSchema> {
  const templateJson = JSON.parse(
    fs.readFileSync(path.join(templateBasePath, "template.json"), "utf-8")
  );

  if (templateJson.version !== 1) {
    throw new Error("Invalid template version");
  }

  // Validate the basic schema
  templateSchema.parse(templateJson);

  // Validate each step
  for (const phase of templateJson.phases) {
    for (const step of phase.steps) {
      if (!actionSchemas[step.action]) {
        throw new Error(`Unknown action: ${step.action}`);
      }
      const result = actionSchemas[step.action].safeParse(step);
      if (!result.success) {
        console.error(
          generateErrorMessage(result.error.issues, { prefix: "" })
        );
        throw new Error(
          generateErrorMessage(result.error.issues, { prefix: "" })
        );
      }
    }
  }

  return templateJson;
}

validateTemplate("templates/start");

if (fs.existsSync("./test")) {
  rimraf.sync("./test");
}

fs.mkdirSync("./test");

const templateBasePath = "templates/start";
const projectBasePath = "./test";

const environment = createEnvironment(templateBasePath, projectBasePath);

for (const phase of validateTemplate(templateBasePath).phases) {
  for (const step of phase.steps) {
    // @ts-ignore
    const actions = actionSchemas[step.action];
    // @ts-ignore
    actions?.[step.action]?.(step, environment);
  }
}
