import { render } from "@react-email/components";
import type { ComponentType } from "react";
import React from "react";
import type { TemplateData, TSXEmailTemplate } from "./types";

/**
 * Renders a React component to HTML string for email templates using react-email
 */
export async function renderTSXTemplate(
  template: TSXEmailTemplate,
  data: TemplateData,
): Promise<string> {
  const Component = template.component;
  const element = React.createElement(Component, data);

  // Use react-email's render function for proper email HTML
  const html = await render(element);
  return html;
}

/**
 * Extracts variables from a TSX template by analyzing the component
 */
export function extractTSXVariables(template: TSXEmailTemplate): string[] {
  // For now, we'll rely on the template's variables array
  // In the future, we could analyze the component's props or use AST parsing
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
