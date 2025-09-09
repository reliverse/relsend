import { readdir } from "fs/promises";
import { join } from "path";
import type { ComponentType } from "react";
import { extractTSXVariables } from "./tsx-renderer";
import type { AnyEmailTemplate, MultiEmailModule, TemplateData, TSXEmailTemplate } from "./types";
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

  // If the requested name looks like a numbered variant (e.g., base-2),
  // attempt to resolve it from a multi-template module named `base` first.
  const variantMatch = name.match(/^(.*)-(\d+)$/);
  if (variantMatch) {
    const base = variantMatch[1] || "";
    const numStr = variantMatch[2] || "";
    const zeroBasedIndex = Math.max(0, Number.parseInt(numStr, 10) - 1);
    for (const ext of extensions) {
      try {
        const basePath = join(TEMPLATES_DIR, `${base}${ext}`);
        const mod = await import(basePath);
        const multi = (mod as { default?: unknown }).default as MultiEmailModule | undefined;
        if (multi && typeof multi === "object" && multi.__relsendMulti === true) {
          // 1) Try exact name match
          const pickedByName = multi.schemas.find((s) => s.name === name);
          if (pickedByName) return pickedByName;
          // 2) Fallback to index-based selection: base-N maps to schemas[N-1]
          const pickedByIndex = multi.schemas[zeroBasedIndex];
          if (pickedByIndex) return pickedByIndex;
        }
      } catch {
        // continue
      }
    }
  }

  for (const ext of extensions) {
    try {
      const templatePath = join(TEMPLATES_DIR, `${name}${ext}`);
      const templateModule = await import(templatePath);
      // 0) Multi-template module support (return the first schema as a sentinel)
      const multi = (templateModule as { default?: unknown }).default as
        | MultiEmailModule
        | undefined;
      if (
        multi &&
        typeof multi === "object" &&
        (multi as MultiEmailModule).__relsendMulti === true
      ) {
        // Pick a schema to return deterministically (first schema) - the caller
        // in send flow will treat this as a signal that variants exist and will
        // resolve a specific variant later.
        const first = (multi as MultiEmailModule).schemas[0];
        if (first) return first;
      }
      // 1) Back-compat and new helper: accept default export, named `template`, or named `email`
      const direct =
        (templateModule as { default?: AnyEmailTemplate }).default ||
        (templateModule as { template?: AnyEmailTemplate }).template ||
        (templateModule as { email?: AnyEmailTemplate }).email;
      if (direct) return direct;

      // 2) New convention: build from component + meta without exporting a full template object
      //    - default export (or named `component`) is a React component
      //    - named export `meta` (or `templateMeta`) contains name, subject, text, etc.
      const component =
        (templateModule as { default?: unknown; component?: unknown }).default ||
        (templateModule as { default?: unknown; component?: unknown }).component;
      const meta =
        (templateModule as { meta?: unknown; templateMeta?: unknown }).meta ||
        (templateModule as { meta?: unknown; templateMeta?: unknown }).templateMeta;

      if (component && meta && typeof meta === "object") {
        const m = meta as Partial<AnyEmailTemplate> & {
          name?: string;
          subject?: string;
          text?: string;
        };
        if (m?.name && m?.subject) {
          // If a component exists, prefer TSX template shape
          const built: TSXEmailTemplate = {
            name: m.name,
            subject: m.subject,
            text: m.text,
            description: (m as { description?: string }).description,
            variables: (m as { variables?: string[] }).variables,
            defaultData: (m as { defaultData?: Record<string, unknown> }).defaultData,
            component: component as ComponentType<TemplateData>,
          };
          return built;
        }
      }

      // 3) Fallback: string-based template via named exports only (no component)
      //    Accept modules exporting subject/text/html and optional name/description/variables/defaultData
      const subject = (templateModule as { subject?: unknown }).subject;
      const text = (templateModule as { text?: unknown }).text;
      if (typeof subject === "string" && (typeof text === "string" || text === undefined)) {
        const html = (templateModule as { html?: unknown }).html;
        const nameFromModule = (templateModule as { name?: unknown }).name;
        const description = (templateModule as { description?: unknown }).description;
        const variables = (templateModule as { variables?: unknown }).variables;
        const defaultData = (templateModule as { defaultData?: unknown }).defaultData;
        const built = {
          name: typeof nameFromModule === "string" ? nameFromModule : name,
          subject,
          text: typeof text === "string" ? text : undefined,
          html: typeof html === "string" ? html : undefined,
          description: typeof description === "string" ? description : undefined,
          variables: Array.isArray(variables) ? (variables as string[]) : undefined,
          defaultData: (defaultData as Record<string, unknown> | undefined) ?? undefined,
        } satisfies AnyEmailTemplate;
        return built;
      }
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

    // Collect template names and detect duplicates across .ts/.tsx single-template files
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

    // Validate for duplicates only when both files are single-template modules.
    // If a module is a multi-template module, we allow a single file that represents many variants.
    for (const [name, extensions] of templateNames) {
      if (extensions.length > 1) {
        // If both files exist (.ts and .tsx), we'll still flag as duplicate because
        // multi-template is expected to live in a single module file.
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

/**
 * Finds all template variants matching the pattern: {baseName}-{number}
 * Returns the base name and all found variants
 */
export async function findTemplateVariants(baseName: string): Promise<{
  baseName: string;
  variants: string[];
  totalCount: number;
}> {
  try {
    const files = await readdir(TEMPLATES_DIR);
    const variantPattern = new RegExp(`^${baseName}-(\\d+)\\.(ts|tsx)$`);

    const variants: string[] = [];
    const variantNumbers: number[] = [];

    for (const file of files) {
      const match = file.match(variantPattern);
      if (match) {
        const variantNumber = Number.parseInt(match[1] || "0", 10);
        const variantName = file.replace(EXTENSION_REGEX, "");
        variants.push(variantName);
        variantNumbers.push(variantNumber);
      }
    }

    // Also check for multi-template module variants defined within a single base file
    for (const ext of [".ts", ".tsx"]) {
      try {
        const basePath = join(TEMPLATES_DIR, `${baseName}${ext}`);
        const mod = await import(basePath);
        const multi = (mod as { default?: unknown }).default as MultiEmailModule | undefined;
        if (multi && typeof multi === "object" && multi.__relsendMulti === true) {
          // Build standardized variant names as base-1, base-2, ...
          for (let i = 0; i < multi.schemas.length; i++) {
            variants.push(`${baseName}-${i + 1}`);
            variantNumbers.push(i + 1);
          }
          break;
        }
      } catch {
        // ignore if file not found or not a multi module
      }
    }

    // Sort by variant number to ensure consistent ordering
    variants.sort((a, b) => {
      const aNum = Number.parseInt(a.split("-").pop() || "0", 10);
      const bNum = Number.parseInt(b.split("-").pop() || "0", 10);
      return aNum - bNum;
    });

    return {
      baseName,
      variants,
      totalCount: variants.length,
    };
  } catch {
    return {
      baseName,
      variants: [],
      totalCount: 0,
    };
  }
}

/**
 * Randomly selects one template from a list of variants
 */
export function selectRandomTemplate(variants: string[]): string {
  if (variants.length === 0) {
    throw new Error("No template variants found");
  }

  const randomIndex = Math.floor(Math.random() * variants.length);
  return variants[randomIndex] || "";
}

function extractVariables(template: AnyEmailTemplate): string[] {
  if (isTSXTemplate(template)) {
    return extractTSXVariables(template);
  }

  // Extract from string-based template
  const text = `${template.subject} ${template.text || ""} ${template.html || ""}`;
  const matches = text.match(/\{\{(\w+(?:\.\w+)*)\}\}/g);
  if (!matches) return [];

  const variables = new Set<string>();
  for (const match of matches) {
    const variable = match.replace(/\{\{|\}\}/g, "");
    variables.add(variable);
  }

  return Array.from(variables).sort();
}
