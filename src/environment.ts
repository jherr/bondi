import fs from "fs";
import path from "path";
import ejs from "ejs";
import { jsonc } from "jsonc";

import type { Environment } from "./types";
import { deepMergeWithVariables } from "./utils";

const ASSETS = "assets";

export function createEnvironment(
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
