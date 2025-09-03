import type { ComponentType } from "react";

export interface TemplateData {
  [key: string]: string | number | boolean | TemplateData | TemplateData[] | unknown;
}

export interface EmailTemplate {
  name: string;
  subject: string;
  text: string;
  html?: string;
  description?: string;
  variables?: string[];
  defaultData?: TemplateData;
}

export interface TSXEmailTemplate {
  name: string;
  subject: string;
  text: string;
  component: ComponentType<TemplateData>;
  description?: string;
  variables?: string[];
  defaultData?: TemplateData;
}

export type AnyEmailTemplate = EmailTemplate | TSXEmailTemplate;

export interface TemplateContext {
  data: TemplateData;
  template: AnyEmailTemplate;
}

export type TemplateRenderer = (
  template: AnyEmailTemplate,
  data: TemplateData,
  tailwindMode?: "v3" | "v4" | "off",
) => Promise<{
  subject: string;
  text: string;
  html?: string;
}>;

export function isTSXTemplate(template: AnyEmailTemplate): template is TSXEmailTemplate {
  return "component" in template;
}
