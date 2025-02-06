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

    resolve: (fname: string) => path.resolve(templateBasePath, fname),
    read: (fname: string) =>
      fs.readFileSync(path.resolve(projectBasePath, fname), "utf-8"),
    write: (fname: string, content: string) => {
      fs.mkdirSync(path.dirname(path.resolve(projectBasePath, fname)), {
        recursive: true,
      });
      fs.writeFileSync(path.resolve(projectBasePath, fname), content);
    },
    exists: (fname: string) =>
      fs.existsSync(path.resolve(projectBasePath, fname)),

    updateJSON: (fname: string, changes: Record<string, unknown>) => {
      const fPath = path.resolve(projectBasePath, fname);
      const original = fs.existsSync(fPath)
        ? jsonc.parse(fs.readFileSync(fPath, "utf-8"))
        : {};
      fs.writeFileSync(
        fPath,
        JSON.stringify(
          deepMergeWithVariables(changes, original, variables),
          null,
          2
        )
      );
    },

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
  };
  return environment;
}
