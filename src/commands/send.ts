import React from "react";
import { createProvider, type ProviderConfig, type ProviderType } from "../providers";
import { loadTemplate } from "../templates/loader";
import { renderTemplate } from "../templates/renderer";
import type { TemplateData } from "../templates/types";
import { loadConfig } from "../utils/config";
import { createSpinner } from "../utils/spinner/mod";

const NUMBER_ONLY_REGEX = /^\d+$/;

type SendOptions = {
  to?: string;
  from?: string;
  subject?: string;
  text?: string;
  html?: string;
  // Template options
  template?: string;
  templateData?: string;
  // Tailwind mode
  tailwind?: "v3" | "v4" | "off";
  // Provider selection
  provider?: ProviderType;
  // SMTP config (for nodemailer)
  host?: string;
  port?: number;
  secure?: boolean;
  user?: string; // explicit overrides if needed
  pass?: string; // explicit overrides if needed
  authType?: "password" | "oauth2";
  clientId?: string;
  clientSecret?: string;
  refreshToken?: string;
  // Resend config
  apiKey?: string;
};

export async function sendCommand(args: string[]): Promise<void> {
  const options = parseArgs(args);

  const base = withEnvFallback(options);
  const cfg = await loadConfig();
  const resolved = {
    ...cfg,
    ...base,
  } as SendOptions;

  // Handle template rendering
  let finalSubject = resolved.subject;
  let finalText = resolved.text;
  let finalHtml = resolved.html;
  let reactComponent: React.ReactElement | undefined;

  if (resolved.template) {
    const templateSpinner = createSpinner({
      text: `Loading template '${resolved.template}'...`,
      color: "blue",
      spinner: "dots",
    });

    try {
      templateSpinner.start();

      const template = await loadTemplate(resolved.template);
      if (!template) {
        templateSpinner.fail(`Template '${resolved.template}' not found`);
        return;
      }

      let templateData: TemplateData = {};
      if (resolved.templateData) {
        try {
          templateData = JSON.parse(resolved.templateData);
        } catch {
          templateSpinner.fail("Invalid JSON in --templateData");
          return;
        }
      }

      // Merge defaults with provided data so both the pre-render and any
      // potential React render receive the same fully-populated props
      const defaultData = (template as unknown as { defaultData?: TemplateData }).defaultData ?? {};
      const mergedData: TemplateData = { ...defaultData, ...templateData };

      const rendered = await renderTemplate(template, mergedData, resolved.tailwind);
      finalSubject = rendered.subject;
      finalText = rendered.text;
      finalHtml = rendered.html;

      // If it's a TSX template, create React component for providers that support it
      // Only pass a React component to the provider if we don't already have HTML.
      // This avoids double-rendering and ensures default data is respected.
      if ("component" in template && !finalHtml) {
        reactComponent = React.createElement(template.component, mergedData);
      }

      templateSpinner.succeed(`Template '${resolved.template}' loaded and rendered`);
    } catch (error) {
      templateSpinner.fail(
        `Failed to load template: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }
  }

  const missing: string[] = [];
  if (!resolved.to) missing.push("--to");
  if (!resolved.from) missing.push("--from");
  if (!finalSubject) missing.push("--subject or --template");
  if (!(finalText || finalHtml || reactComponent)) missing.push("--text/--html or --template");

  const effectiveProvider = resolved.provider || "nodemailer";
  if (effectiveProvider === "nodemailer") {
    if (!resolved.host) missing.push("--host or RELSEND_HOST");
    if (!Number.isFinite(resolved.port)) missing.push("--port or RELSEND_PORT");
    if (!resolved.user) missing.push("--user or RELSEND_USER_NAME_<index> (derived from --from)");

    // Check auth requirements based on authType
    const authType = resolved.authType || "password";
    if (authType === "oauth2") {
      if (!resolved.clientId) missing.push("--clientId or RELSEND_CLIENT_ID");
      if (!resolved.clientSecret) missing.push("--clientSecret or RELSEND_CLIENT_SECRET");
      if (!resolved.refreshToken) missing.push("--refreshToken or RELSEND_REFRESH_TOKEN");
    } else if (!resolved.pass) {
      missing.push("--pass or RELSEND_USER_PASS_<index> (derived from --from)");
    }
  } else if (effectiveProvider === "resend" && !resolved.apiKey) {
    missing.push("--apiKey or RELSEND_API_KEY");
  }

  if (missing.length > 0) {
    console.error(
      `Missing required options: ${missing.join(", ")}.\nUsage: bun relsend send --to a@b.com --from you@x.com --subject "Hi" --text "Hello" --host smtp.example.com --port 587 --user user --pass pass [--secure] [--html '<b>Hi</b>']`,
    );
    return;
  }

  // Create provider configuration
  const provider = effectiveProvider;
  const providerConfig: ProviderConfig = {
    type: provider,
    ...resolved,
  };

  const { from, to } = resolved as Required<Pick<SendOptions, "from" | "to">>;

  const spinner = createSpinner({
    text: `Sending email via ${provider}...`,
    color: "cyan",
    spinner: "dots",
  });

  try {
    spinner.start();

    // Create provider instance
    const emailProvider = createProvider(providerConfig);

    // Send email using the provider
    const result = await emailProvider.send({
      from,
      to,
      subject: finalSubject || "",
      text: finalText,
      html: finalHtml,
      react: reactComponent,
    });

    if (result.success) {
      spinner.succeed(`Email sent successfully via ${provider}! Message ID: ${result.messageId}`);
      console.log(JSON.stringify({ ok: true, messageId: result.messageId, provider }, null, 2));
    } else {
      spinner.fail(`Failed to send email via ${provider}: ${result.error}`);
      throw new Error(result.error);
    }
  } catch (error) {
    spinner.fail(
      `Failed to send email via ${provider}: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
    throw error;
  }
}

function parseArgs(args: string[]): SendOptions {
  const out: SendOptions = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--to" && args[i + 1]) out.to = args[++i];
    else if (a === "--from" && args[i + 1]) out.from = args[++i];
    else if (a === "--subject" && args[i + 1]) out.subject = args[++i];
    else if (a === "--text" && args[i + 1]) out.text = args[++i];
    else if (a === "--html" && args[i + 1]) out.html = args[++i];
    else if (a === "--provider" && args[i + 1]) {
      const provider = args[++i] as ProviderType;
      if (["nodemailer", "resend"].includes(provider)) {
        out.provider = provider;
      } else {
        console.error(`Invalid provider: ${provider}. Must be one of: nodemailer, resend`);
        process.exit(1);
      }
    } else if (a === "--host" && args[i + 1]) out.host = args[++i];
    else if (a === "--port" && args[i + 1]) {
      const n = Number(args[++i]);
      if (Number.isFinite(n) && n > 0) out.port = Math.floor(n);
    } else if (a === "--secure") out.secure = true;
    else if (a === "--user" && args[i + 1]) out.user = args[++i];
    else if (a === "--pass" && args[i + 1]) out.pass = args[++i];
    else if (a === "--authType" && args[i + 1]) out.authType = args[++i] as "password" | "oauth2";
    else if (a === "--clientId" && args[i + 1]) out.clientId = args[++i];
    else if (a === "--clientSecret" && args[i + 1]) out.clientSecret = args[++i];
    else if (a === "--refreshToken" && args[i + 1]) out.refreshToken = args[++i];
    else if (a === "--apiKey" && args[i + 1]) out.apiKey = args[++i];
    else if (a === "--template" && args[i + 1]) out.template = args[++i];
    else if (a === "--templateData" && args[i + 1]) out.templateData = args[++i];
    else if (a === "--tailwind" && args[i + 1]) {
      const mode = args[++i] as "v3" | "v4" | "off";
      if (["v3", "v4", "off"].includes(mode)) {
        out.tailwind = mode;
      } else {
        console.error(`Invalid tailwind mode: ${mode}. Must be one of: v3, v4, off`);
        process.exit(1);
      }
    }
  }
  return out;
}

function withEnvFallback(o: SendOptions): SendOptions {
  const env = process.env as Record<string, string | undefined>;
  // Multi-account resolution
  const accounts: Array<{ index: number; user: string; pass?: string }> = [];
  for (let idx = 1; idx <= 10; idx++) {
    const user = env[`RELSEND_USER_NAME_${idx}`];
    const pass = env[`RELSEND_USER_PASS_${idx}`];
    if (user) accounts.push({ index: idx, user, pass });
  }

  // Validate and resolve --from:
  let resolvedFrom = o.from;
  if (resolvedFrom) {
    if (resolvedFrom === "random") {
      if (accounts.length === 0) {
        console.error(
          "--from random requires at least one RELSEND_USER_NAME_<index> to be configured.",
        );
        process.exit(1);
      }
      const users = accounts.map((a) => a.user);
      const pickIndex = Math.floor(Math.random() * users.length);
      resolvedFrom = users[pickIndex] || users[0];
    } else {
      // If numeric index given, map to account email
      const fromIsIndex = NUMBER_ONLY_REGEX.test(resolvedFrom);
      if (fromIsIndex) {
        const idx = Number(resolvedFrom);
        const acct = accounts.find((a) => a.index === idx);
        if (acct) resolvedFrom = acct.user;
      } else if (accounts.length > 0 && !accounts.some((a) => a.user === resolvedFrom)) {
        // Ensure provided from matches one of configured account emails
        console.error(
          `Invalid --from '${resolvedFrom}'. Must be one of configured RELSEND_USER_NAME_<index> or an index or 'random'.`,
        );
        process.exit(1);
      }
    }
  }

  // Choose credentials based on resolvedFrom if not explicitly provided
  let resolvedUser = o.user;
  let resolvedPass = o.pass;
  if (!resolvedUser && resolvedFrom && accounts.length > 0) {
    const acct = accounts.find((a) => a.user === resolvedFrom);
    if (acct) {
      resolvedUser = acct.user;
      resolvedPass = resolvedPass ?? acct.pass;
    }
  }

  return {
    ...o,
    provider: o.provider ?? (env.RELSEND_PROVIDER as ProviderType | undefined),
    host: o.host ?? env.RELSEND_HOST,
    port: o.port ?? (env.RELSEND_PORT ? Number(env.RELSEND_PORT) : undefined),
    secure: o.secure ?? (env.RELSEND_SECURE ? env.RELSEND_SECURE === "true" : undefined),
    user: resolvedUser,
    pass: resolvedPass,
    from: resolvedFrom,
    authType: o.authType ?? (env.RELSEND_AUTH_TYPE as "password" | "oauth2" | undefined),
    clientId: o.clientId ?? env.RELSEND_CLIENT_ID,
    clientSecret: o.clientSecret ?? env.RELSEND_CLIENT_SECRET,
    refreshToken: o.refreshToken ?? env.RELSEND_REFRESH_TOKEN,
    apiKey: o.apiKey ?? env.RELSEND_API_KEY,
  };
}
