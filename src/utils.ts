import ejs from "ejs";

export function deepMergeWithVariables(
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
