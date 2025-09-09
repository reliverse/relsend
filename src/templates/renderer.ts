import { renderTSXTemplateWithTailwind, type TailwindMode } from "./tailwind-renderer";
import { renderTSXTemplate } from "./tsx-renderer";
import type { TemplateData, TemplateRenderer } from "./types";
import { isTSXTemplate } from "./types";

export const renderTemplate: TemplateRenderer = async (
  template,
  data,
  tailwindMode?: TailwindMode,
) => {
  // Merge default data with provided data (provided data takes precedence)
  const mergedData = {
    ...template.defaultData,
    ...data,
  };

  const renderString = (str: string): string => {
    return str.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, path) => {
      const value = getNestedValue(mergedData, path);
      if (value === undefined) return match;

      // Handle arrays by joining with commas
      if (Array.isArray(value)) {
        return value.join(", ");
      }

      return String(value);
    });
  };

  // Handle TSX templates
  if (isTSXTemplate(template)) {
    const html = tailwindMode
      ? await renderTSXTemplateWithTailwind(template, mergedData, tailwindMode)
      : await renderTSXTemplate(template, mergedData);

    return {
      subject: renderString(template.subject),
      text: typeof template.text === "string" ? renderString(template.text) : undefined,
      html,
    };
  }

  // Handle string-based templates
  return {
    subject: renderString(template.subject),
    text: typeof template.text === "string" ? renderString(template.text) : undefined,
    html: template.html ? renderString(template.html) : undefined,
  };
};

function getNestedValue(obj: TemplateData, path: string): unknown {
  return path.split(".").reduce((current, key) => {
    if (current && typeof current === "object" && key in current) {
      return (current as TemplateData)[key];
    }
    return null;
  }, obj as unknown);
}
