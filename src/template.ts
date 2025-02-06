import fs from "fs";
import path from "path";
import z from "zod";
import { generateErrorMessage } from "zod-error";
import { rimrafSync } from "rimraf";
import { jsonc } from "jsonc";

import * as actions from "./actions";
import type { Action } from "./types";
import { createEnvironment } from "./environment";
import { templateSchema } from "./types";

const actionSchemas: Record<string, z.ZodSchema> = {
  "copy-files": actions.copyFiles.schema,
  "update-json": actions.updateJSON.schema,
};

const actionsByName: Record<string, Action<z.ZodSchema>> = {
  // @ts-ignore
  "copy-files": actions.copyFiles,
  // @ts-ignore
  "update-json": actions.updateJSON,
};

function validateTemplate(
  templateBasePath: string
): z.infer<typeof templateSchema> {
  const templateJson = jsonc.parse(
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

export async function load(template: string) {
  return validateTemplate(`templates/${template}`);
}

export async function execute(
  name: string,
  templates: string[],
  options: {
    arguments: Record<string, string | number | boolean>;
    fresh?: boolean;
    events?: {
      onTemplateFinish?: (template: string) => void;
      onStep?: (template: string, name: string) => void;
      onTemplateStart?: (template: string) => void;
    };
  }
) {
  if (options?.fresh) {
    // Clean up the project directory
    if (fs.existsSync(name)) {
      rimrafSync(name);
    }
    fs.mkdirSync(name);
  }

  // Make sure the templates are valid
  for (const template of templates) {
    validateTemplate(`templates/${template}`);
  }

  // Execute the templates
  for (const template of templates) {
    options?.events?.onTemplateStart?.(template);

    const templateBasePath = `templates/${template}`;
    const projectBasePath = name;
    const environment = createEnvironment(templateBasePath, projectBasePath, {
      name,
      ...options.arguments,
      __npmInstall: "pnpm i",
      __npmRun: "pnpm",
    });

    for (const phase of validateTemplate(templateBasePath).phases) {
      for (const step of phase.steps) {
        options?.events?.onStep?.(template, step.name);
        // @ts-ignore
        const action = actionsByName[step.action];
        // @ts-ignore
        await action.execute(step, environment);
      }
    }

    options?.events?.onTemplateFinish?.(template);
  }
}
