import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { extractTSXVariables } from "./tsx-renderer";
import type { AnyEmailTemplate } from "./types";
import { isTSXTemplate } from "./types";

const TEMPLATES_DIR = join(process.cwd(), "emails");
const EXTENSION_REGEX = /\.(ts|tsx)$/;

/**
 * Validates that a template name doesn't have duplicate files
 */
async function validateNoDuplicates(templateName: string): Promise<void> {
  try {
    const files = await readdir(TEMPLATES_DIR);
    const templateFiles = files.filter(
      (file) =>
        (file.endsWith(".ts") || file.endsWith(".tsx")) &&
        file.replace(EXTENSION_REGEX, "") === templateName &&
        file !== "types.ts" &&
        file !== "renderer.ts" &&
        file !== "loader.ts" &&
        file !== "tsx-renderer.ts",
    );

    if (templateFiles.length > 1) {
      const extensions = templateFiles.map((file) => (file.endsWith(".tsx") ? ".tsx" : ".ts"));
      const extensionsList = extensions.join(", ");
      throw new Error(
        `Duplicate template found: "${templateName}" exists in multiple formats (${extensionsList}). ` +
          "Please remove duplicate files and keep only one version.",
      );
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes("Duplicate template found")) {
      throw error;
    }
    // If it's a different error (like directory not found), ignore it
  }
}

export async function loadTemplate(name: string): Promise<AnyEmailTemplate | null> {
  // Check for duplicate templates first
  await validateNoDuplicates(name);

  // Try to load .tsx first, then .ts
  const extensions = [".tsx", ".ts"];

  for (const ext of extensions) {
    try {
      const templatePath = join(TEMPLATES_DIR, `${name}${ext}`);
      const templateModule = await import(templatePath);
      return templateModule.default || templateModule.template;
    } catch {
      // Continue to next extension
    }
  }

  return null;
}

export async function listTemplates(): Promise<string[]> {
  try {
    const files = await readdir(TEMPLATES_DIR);
    const templateFiles = files.filter(
      (file) =>
        (file.endsWith(".ts") || file.endsWith(".tsx")) &&
        file !== "types.ts" &&
        file !== "renderer.ts" &&
        file !== "loader.ts" &&
        file !== "tsx-renderer.ts",
    );

    // Check for duplicate templates
    const templateNames = new Map<string, string[]>();

    for (const file of templateFiles) {
      const name = file.replace(EXTENSION_REGEX, "");
      const extension = file.endsWith(".tsx") ? ".tsx" : ".ts";

      if (!templateNames.has(name)) {
        templateNames.set(name, []);
      }
      const extensions = templateNames.get(name);
      if (extensions) {
        extensions.push(extension);
      }
    }

    // Validate for duplicates
    for (const [name, extensions] of templateNames) {
      if (extensions.length > 1) {
        const extensionsList = extensions.join(", ");
        throw new Error(
          `Duplicate template found: "${name}" exists in multiple formats (${extensionsList}). ` +
            "Please remove duplicate files and keep only one version.",
        );
      }
    }

    return Array.from(templateNames.keys());
  } catch (error) {
    if (error instanceof Error && error.message.includes("Duplicate template found")) {
      throw error;
    }
    return [];
  }
}

export async function getTemplateInfo(
  name: string,
): Promise<{ template: AnyEmailTemplate; variables: string[] } | null> {
  const template = await loadTemplate(name);
  if (!template) return null;

  const variables = extractVariables(template);
  return { template, variables };
}

function extractVariables(template: AnyEmailTemplate): string[] {
  if (isTSXTemplate(template)) {
    return extractTSXVariables(template);
  }

  // Extract from string-based template
  const text = `${template.subject} ${template.text} ${template.html || ""}`;
  const matches = text.match(/\{\{(\w+(?:\.\w+)*)\}\}/g);
  if (!matches) return [];

  const variables = new Set<string>();
  for (const match of matches) {
    const variable = match.replace(/\{\{|\}\}/g, "");
    variables.add(variable);
  }

  return Array.from(variables).sort();
}
