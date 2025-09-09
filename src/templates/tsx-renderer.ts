import { render } from "@react-email/components";
import type { ComponentType } from "react";
import React from "react";
import type { AnyEmailTemplate, MultiEmailModule, TemplateData, TSXEmailTemplate } from "./types";

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

/**
 * defineEmail provides a concise way to declare either a TSX-based template
 * (when `component` is provided) or a string-based template (when `html` is provided).
 */
export function defineEmail<T extends TemplateData>(config: {
  name: string;
  subject: string;
  text?: string;
  description?: string;
  variables?: string[];
  defaultData?: T;
  component?: ComponentType<T>;
  html?: string;
}): AnyEmailTemplate {
  if (config.component) {
    const tsx: TSXEmailTemplate = {
      name: config.name,
      subject: config.subject,
      text: config.text,
      description: config.description,
      variables: config.variables,
      defaultData: config.defaultData,
      component: config.component as ComponentType<TemplateData>,
    };
    return tsx;
  }

  const strBased: AnyEmailTemplate = {
    name: config.name,
    subject: config.subject,
    text: config.text,
    html: config.html,
    description: config.description,
    variables: config.variables,
    defaultData: config.defaultData,
  } as AnyEmailTemplate;
  return strBased;
}

/**
 * Defines a multi-template module that groups multiple schemas under one base name file.
 * The loader will detect this shape and treat each schema as a variant of the base.
 */
export function defineMultiTemplateEmail(config: {
  schemas: AnyEmailTemplate[];
}): MultiEmailModule {
  return {
    __relsendMulti: true,
    schemas: config.schemas,
  };
}
