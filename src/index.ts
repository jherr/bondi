import fs from "fs";
import path from "path";
import z from "zod";
import { generateErrorMessage } from "zod-error";
import { rimrafSync } from "rimraf";
import ejs from "ejs";
import { jsonc } from "jsonc";

import * as actions from "./actions";

import type { Environment, Action } from "./types";

const ASSETS = "assets";

function deepMergeWithVariables(
  input: Record<string, unknown>,
  current: Record<string, unknown>,
  variables: Record<string, string | number | boolean>
): Record<string, unknown> {
  for (const [key, value] of Object.entries(input)) {
    if (typeof value === "string") {
      current[key] = ejs.render(value, variables);
    } else {
      const defaultValue = Array.isArray(value) ? [] : {};
      current[key] = deepMergeWithVariables(
        value as Record<string, unknown>,
        // @ts-ignore
        current[key] ?? (defaultValue as Record<string, unknown>),
        variables
      );
    }
  }
  return current;
}

function createEnvironment(
  templateBasePath: string,
  projectBasePath: string,
  variables: Record<string, string | number | boolean>
): Environment {
  const environment: Environment = {
    root: projectBasePath,
    cwd: process.cwd(),
    resolve: (p: string) => path.resolve(templateBasePath, p),

    read: (p: string) =>
      fs.readFileSync(path.resolve(projectBasePath, p), "utf-8"),
    write: (p: string, content: string) => {
      fs.mkdirSync(path.dirname(path.resolve(projectBasePath, p)), {
        recursive: true,
      });
      fs.writeFileSync(path.resolve(projectBasePath, p), content);
    },
    exists: (p: string) => fs.existsSync(path.resolve(projectBasePath, p)),

    readAsset: (p: string) => {
      const assetPath = path.resolve(templateBasePath, ASSETS, p);
      if (!fs.existsSync(assetPath)) {
        const ejsPath = `${assetPath}.ejs`;
        if (fs.existsSync(ejsPath)) {
          return ejs.render(fs.readFileSync(ejsPath, "utf-8"), variables);
        }
        throw new Error(`Asset not found: ${p}`);
      }
      return fs.readFileSync(assetPath, "utf-8");
    },
    resolveAsset: (p: string) => path.resolve(templateBasePath, ASSETS, p),

    addDependencies: (dependencies: {
      direct: Record<string, string>;
      development: Record<string, string>;
    }) => {
      if (!fs.existsSync(path.join(projectBasePath, "package.json"))) {
        fs.writeFileSync(
          path.join(projectBasePath, "package.json"),
          JSON.stringify(
            { name: variables?.name, dependencies: {}, devDependencies: {} },
            null,
            2
          )
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
      const packageJson = jsonc.parse(
        fs.readFileSync(path.join(projectBasePath, "package.json"), "utf-8")
      );
      fs.writeFileSync(
        path.join(projectBasePath, "package.json"),
        JSON.stringify(
          deepMergeWithVariables(changes, packageJson, variables),
          null,
          2
        )
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

const actionsByName: Record<string, Action<z.ZodSchema>> = {
  // @ts-ignore
  "add-dependencies": actions.addDependencies,
  // @ts-ignore
  "add-dev-dependencies": actions.addDevDependencies,
  // @ts-ignore
  "copy-files": actions.copyFiles,
  // @ts-ignore
  "update-package-json": actions.updatePackageJson,
};

const templateSchema = z.object({
  name: z.string(),
  description: z.string(),
  version: z.number(),
  arguments: z.record(
    z.string(),
    z.object({
      type: z.enum(["string", "number", "boolean"]),
      required: z.boolean().optional(),
      default: z.any().optional(),
      description: z.string(),
    })
  ),
  variables: z.record(z.string(), z.string()),
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
  const templateJson = jsonc.parse(
    fs.readFileSync(path.join(templateBasePath, "template.jsonc"), "utf-8")
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
  rimrafSync("./test");
}

fs.mkdirSync("./test");

const templateBasePath = "templates/start";
const projectBasePath = "./test";

const environment = createEnvironment(templateBasePath, projectBasePath, {
  name: "test",
  port: 8080,
  __npmInstall: "pnpm i",
  __npmRun: "pnpm",
});

for (const phase of validateTemplate(templateBasePath).phases) {
  for (const step of phase.steps) {
    // @ts-ignore
    const action = actionsByName[step.action];
    // @ts-ignore
    action.execute(step, environment);
  }
}
