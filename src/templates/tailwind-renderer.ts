import { render } from "@react-email/components";
import type { ComponentType } from "react";
import React from "react";
import type { TemplateData, TSXEmailTemplate } from "./types";

export type TailwindMode = "v3" | "v4" | "off";

/**
 * Renders a React component to HTML string for email templates with different Tailwind modes
 */
export async function renderTSXTemplateWithTailwind(
  template: TSXEmailTemplate,
  data: TemplateData,
  tailwindMode: TailwindMode = "v3",
): Promise<string> {
  const Component = template.component;
  const element = React.createElement(Component, data);

  // Use react-email's render function for proper email HTML
  const html = await render(element);

  // For v4 and off modes, we might need to wrap with additional CSS
  if (tailwindMode === "v4" || tailwindMode === "off") {
    const cssLink = getCSSLink(tailwindMode);
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${template.subject}</title>
  ${cssLink}
</head>
<body>
  ${html}
</body>
</html>`;
  }

  // For v3 mode, react-email handles everything
  return html;
}

function getCSSLink(mode: TailwindMode): string {
  switch (mode) {
    case "v3":
      // For v3 mode, we don't need external CSS as react-email Tailwind handles it
      return "";
    case "v4":
      // For v4 mode, use the compiled CSS from styles/dist/output.css
      return '<link href="./styles/dist/output.css" rel="stylesheet">';
    case "off":
      // For off mode, no CSS link (user provides their own)
      return "";
    default:
      return "";
  }
}

/**
 * Extracts variables from a TSX template by analyzing the component
 */
export function extractTSXVariables(template: TSXEmailTemplate): string[] {
  return template.variables || [];
}

/**
 * Helper function to create a TSX template with proper typing
 */
export function createTSXTemplate<T extends TemplateData>(
  template: Omit<TSXEmailTemplate, "component"> & {
    component: ComponentType<T>;
  },
): TSXEmailTemplate {
  return template as TSXEmailTemplate;
}
