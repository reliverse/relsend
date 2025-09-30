import { constants as FS_CONSTANTS } from "node:fs";
import { access, readFile } from "node:fs/promises";
import pMap from "p-map";
import React from "react";
import { createProvider, type ProviderConfig, type ProviderType } from "../providers";
import { spamScannerService } from "../services/spam-scanner";
import { findTemplateVariants, loadTemplate, selectRandomTemplate } from "../templates/loader";
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
  multiTemplate?: boolean;
  // Send all templates in ./emails
  all?: boolean;
  // Base delay (seconds) between emails when using --all (default 2s)
  delay?: number;
  // Optional CSV path providing recipient emails
  emailsCsv?: string;
  // Tailwind mode
  tailwind?: "v3" | "v4" | "off";
  // Provider selection
  provider?: ProviderType;
  // Preview mode
  preview?: boolean;
  // Spam scanning
  scan?: boolean;
  forceScan?: boolean;
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

type SendResult = {
  subject: string;
  to: string;
};

async function performSend(resolved: SendOptions): Promise<SendResult> {
  // Handle template rendering
  let finalSubject = resolved.subject;
  let finalText = resolved.text;
  let finalHtml = resolved.html;
  let reactComponent: React.ReactElement | undefined;

  if (resolved.template) {
    try {
      // Suppress per-step spinner updates to keep a single combined message

      let templateName = resolved.template;
      let template = await loadTemplate(templateName);

      // If multi-template is enabled, always look for variants (even if base template exists)
      if (resolved.multiTemplate) {
        const variants = await findTemplateVariants(resolved.template);
        if (variants.totalCount > 0) {
          templateName = selectRandomTemplate(variants.variants);
          template = await loadTemplate(templateName);
          // Intentionally no spinner text update here
        } else if (!template) {
          // If no variants found and no base template, throw
          throw new Error(`Template '${resolved.template}' not found`);
        }
      }

      // Auto-enable multi-template when a multi module exists or variants are present
      if (!resolved.multiTemplate) {
        const variants = await findTemplateVariants(resolved.template);
        if (variants.totalCount > 0) {
          templateName = selectRandomTemplate(variants.variants);
          template = await loadTemplate(templateName);
          // Intentionally no spinner text update here
        }
      }

      if (!template) {
        const errorMsg = resolved.multiTemplate
          ? `Template '${resolved.template}' and its variants not found`
          : `Template '${resolved.template}' not found`;
        throw new Error(errorMsg);
      }

      let templateData: TemplateData = {};
      if (resolved.templateData) {
        try {
          templateData = JSON.parse(resolved.templateData);
        } catch {
          throw new Error("Invalid JSON in --templateData");
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

      // Intentionally no spinner text update here
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Failed to load template: ${message}`);
    }
  }

  // Spam scanning (if enabled)
  if (resolved.scan && (finalText || finalHtml || reactComponent)) {
    try {
      // Intentionally no spinner text update here

      // Create email content for scanning
      let emailContent = "";
      if (finalText && finalHtml) {
        emailContent =
          `Subject: ${finalSubject || "No Subject"}\r\n` +
          `From: ${resolved.from || "sender@example.com"}\r\n` +
          `To: ${resolved.to || "recipient@example.com"}\r\n` +
          `Date: ${new Date().toUTCString()}\r\n` +
          "MIME-Version: 1.0\r\n" +
          `Content-Type: multipart/alternative; boundary="boundary123"\r\n\r\n` +
          "--boundary123\r\n" +
          "Content-Type: text/plain; charset=utf-8\r\n\r\n" +
          `${finalText}\r\n\r\n` +
          "--boundary123\r\n" +
          "Content-Type: text/html; charset=utf-8\r\n\r\n" +
          `${finalHtml}\r\n\r\n` +
          "--boundary123--";
      } else if (finalHtml) {
        emailContent =
          `Subject: ${finalSubject || "No Subject"}\r\n` +
          `From: ${resolved.from || "sender@example.com"}\r\n` +
          `To: ${resolved.to || "recipient@example.com"}\r\n` +
          `Date: ${new Date().toUTCString()}\r\n` +
          "MIME-Version: 1.0\r\n" +
          "Content-Type: text/html; charset=utf-8\r\n\r\n" +
          finalHtml;
      } else if (finalText) {
        emailContent =
          `Subject: ${finalSubject || "No Subject"}\r\n` +
          `From: ${resolved.from || "sender@example.com"}\r\n` +
          `To: ${resolved.to || "recipient@example.com"}\r\n` +
          `Date: ${new Date().toUTCString()}\r\n` +
          "MIME-Version: 1.0\r\n" +
          "Content-Type: text/plain; charset=utf-8\r\n\r\n" +
          finalText;
      }

      const templatePath = resolved.template ? `./emails/${resolved.template}.tsx` : undefined;
      const scanResult = await spamScannerService.scanEmail(
        emailContent,
        templatePath,
        resolved.forceScan,
      );

      if (scanResult.isSpam) {
        // Keep spinner running for higher-level control; throw error to caller
        console.error("\n❌ EMAIL BLOCKED - SPAM DETECTED");
        console.error("=".repeat(50));
        console.error(`Reason: ${scanResult.message}`);

        // Show detailed results
        if (scanResult.results.phishing.length > 0) {
          console.error(`Phishing threats: ${scanResult.results.phishing.length}`);
        }
        if (scanResult.results.executables.length > 0) {
          console.error(`Executable files: ${scanResult.results.executables.length}`);
        }
        if (scanResult.results.macros.length > 0) {
          console.error(`Macros detected: ${scanResult.results.macros.length}`);
        }
        if (scanResult.results.viruses.length > 0) {
          console.error(`Viruses detected: ${scanResult.results.viruses.length}`);
        }
        // Note: NSFW and toxicity detection are not enabled in the current configuration
        if (scanResult.results.patterns.length > 0) {
          console.error(`Suspicious patterns: ${scanResult.results.patterns.length}`);
        }

        console.error("\nUse --force-scan to bypass spam detection");
        process.exit(1);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Spam scan failed: ${message}`);
    }
  }

  // If preview mode, skip validation and show preview
  if (resolved.preview) {
    await showPreview({
      from: resolved.from || "preview@example.com",
      to: resolved.to || "recipient@example.com",
      subject: finalSubject || "Preview Subject",
      text: finalText,
      html: finalHtml,
      react: reactComponent,
    });
    return { subject: finalSubject || "", to: resolved.to || "" };
  }

  const missing: string[] = [];
  if (!resolved.to) {
    // Allow CSV-driven mode to bypass required --to (handled earlier)
    if (!(resolved as unknown as { emailsCsv?: string }).emailsCsv) {
      missing.push("--to");
    }
  }
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
    throw new Error("Missing required options");
  }

  // Create provider configuration
  const provider = effectiveProvider;
  const providerConfig: ProviderConfig = {
    type: provider,
    ...resolved,
  };

  const { from, to } = resolved as Required<Pick<SendOptions, "from" | "to">>;

  try {
    // spinner is managed by caller; ensure meaningful text only

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

    if (!result.success) throw new Error(result.error);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Failed to send email via ${provider}: ${message}`);
  }
  return { subject: finalSubject || "", to };
}

export async function sendCommand(args: string[]): Promise<void> {
  const options = parseArgs(args);
  const requestedCsv = options.emailsCsv !== undefined;
  let csvPath: string | null = null;
  if (requestedCsv) {
    csvPath = await resolveCsvPath(options.emailsCsv);
  } else if (!options.to) {
    // Only fall back to default emails.csv when --to is not provided
    csvPath = await resolveCsvPath(undefined);
  }
  if (csvPath) {
    const recipients = await readEmailsFromCsv(csvPath);
    if (recipients.length === 0) {
      console.error(`No emails found in ${csvPath}`);
      return;
    }

    const { listTemplates, findTemplateVariants } = await import("../templates/loader");
    // Build template pool based on flags
    let templatePool: string[] = [];
    if (options.template && options.multiTemplate) {
      const variants = await findTemplateVariants(options.template);
      templatePool = variants.totalCount > 0 ? variants.variants : [options.template];
    } else if (options.template) {
      templatePool = [options.template];
    } else {
      templatePool = await listTemplates();
    }

    if (templatePool.length === 0) {
      console.error("No templates found in ./emails to use with --emails-csv");
      return;
    }

    const env = process.env as Record<string, string | undefined>;
    const accounts: Array<{ index: number; user: string; pass?: string }> = [];
    for (let idx = 1; idx <= 10; idx++) {
      const user = env[`RELSEND_USER_NAME_${idx}`];
      const pass = env[`RELSEND_USER_PASS_${idx}`];
      if (user) accounts.push({ index: idx, user, pass });
    }
    if (accounts.length === 0) {
      console.error("No RELSEND_USER_NAME_<i> accounts configured in environment.");
      process.exit(1);
    }

    type CsvTask = { to: string; from: string; template: string };
    const tasks: CsvTask[] = [];
    // Shuffle template pool (Fisher-Yates)
    for (let i = templatePool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = templatePool[i] || "";
      templatePool[i] = templatePool[j] || templatePool[i] || "";
      templatePool[j] = tmp;
    }

    for (let i = 0; i < recipients.length; i++) {
      const to = recipients[i] || "";
      const pickAcct = Math.floor(Math.random() * accounts.length);
      const from = accounts[pickAcct]?.user || accounts[0]?.user || "";
      const template = templatePool[i % templatePool.length] || templatePool[0] || "";
      tasks.push({ to, from, template });
    }

    const byAccount = new Map<string, CsvTask[]>();
    for (const t of tasks) {
      const list = byAccount.get(t.from);
      if (list) list.push(t);
      else byAccount.set(t.from, [t]);
    }

    const baseDelayMs = Math.max(0, Math.floor(((options.delay ?? 2) as number) * 1000));

    const scheduled = tasks.length;
    let sent = 0;
    const failed: string[] = [];

    const progressSpinner = createSpinner({
      text: `[0/${scheduled}] Preparing to send...`,
      color: "cyan",
      spinner: "dots",
    }).start();

    await pMap(
      Array.from(byAccount.entries()),
      async ([accountEmail, queue]) => {
        let sentForAccount = 0;
        for (let i = 0; i < queue.length; i++) {
          const { to, template } = queue[i] || { to: "", template: "" };
          try {
            const perEmailOptions: SendOptions = {
              ...options,
              template,
              from: accountEmail,
              all: false,
            };
            const base = withEnvFallback(perEmailOptions);
            const cfg = await loadConfig();
            const resolved = { ...cfg, ...base, to } as SendOptions;
            const { subject, to: sentTo } = await performSend(resolved);
            sentForAccount++;
            sent++;
            progressSpinner.text = `[${sent}/${scheduled}] Sending "${subject}" to ${sentTo}...`;
          } catch (error) {
            console.error(
              `❌ Failed to send to '${to}' from '${accountEmail}': ${error instanceof Error ? error.message : "Unknown error"}`,
            );
            failed.push(to);
          }

          const isLast = i === queue.length - 1;
          if (!isLast) {
            const afterSeven = sentForAccount > 0 && sentForAccount % 7 === 0;
            const waitMs = afterSeven ? baseDelayMs + 8000 : baseDelayMs;
            if (waitMs > 0) await new Promise((r) => setTimeout(r, waitMs));
          }
        }
      },
      { concurrency: byAccount.size },
    );

    progressSpinner.succeed(`Sent ${sent}/${scheduled} (Failed: ${failed.length})`);
    console.log("\n" + "=".repeat(50));
    console.log(`Attempted: ${scheduled}, Sent: ${sent}, Failed: ${failed.length}`);
    if (failed.length > 0) {
      console.log(`Failed recipients: ${failed.join(", ")}`);
      process.exitCode = 1;
    }
    return;
  }

  if (options.all) {
    const { listTemplates } = await import("../templates/loader");
    const templates = await listTemplates();
    if (templates.length === 0) {
      console.log("No templates found in ./emails");
      return;
    }

    console.log(`Sending all templates in ./emails (count: ${templates.length})...`);

    // Resolve configured accounts from env
    const env = process.env as Record<string, string | undefined>;
    const accounts: Array<{ index: number; user: string; pass?: string }> = [];
    for (let idx = 1; idx <= 10; idx++) {
      const user = env[`RELSEND_USER_NAME_${idx}`];
      const pass = env[`RELSEND_USER_PASS_${idx}`];
      if (user) accounts.push({ index: idx, user, pass });
    }
    if (accounts.length === 0) {
      console.error("No RELSEND_USER_NAME_<i> accounts configured in environment.");
      process.exit(1);
    }

    // Precompute random assignment: template -> account email
    const assignment = new Map<string, string>();
    for (const name of templates) {
      const pick = Math.floor(Math.random() * accounts.length);
      assignment.set(name, accounts[pick]?.user || accounts[0]?.user || "");
    }

    // Group templates by assigned account
    const byAccount = new Map<string, string[]>();
    for (const [tpl, acct] of assignment) {
      const list = byAccount.get(acct);
      if (list) list.push(tpl);
      else byAccount.set(acct, [tpl]);
    }

    const baseDelayMs = Math.max(0, Math.floor(((options.delay ?? 2) as number) * 1000));

    const scheduled = templates.length;
    let sent = 0;
    const failed: string[] = [];

    const progressSpinner = createSpinner({
      text: `[0/${scheduled}] Preparing to send...`,
      color: "cyan",
      spinner: "dots",
    }).start();

    // Run each account queue concurrently; each account enforces its own delays
    await pMap(
      Array.from(byAccount.entries()),
      async ([accountEmail, tplList]) => {
        let sentForAccount = 0;
        for (let i = 0; i < tplList.length; i++) {
          const name = tplList[i] || "";
          try {
            const perEmailOptions: SendOptions = {
              ...options,
              template: name,
              from: accountEmail,
              all: false,
            };
            const base = withEnvFallback(perEmailOptions);
            const cfg = await loadConfig();
            const resolved = { ...cfg, ...base } as SendOptions;
            const { subject, to: sentTo } = await performSend(resolved);
            sentForAccount++;
            sent++;
            progressSpinner.text = `[${sent}/${scheduled}] Sending "${subject}" to ${sentTo}...`;
          } catch (error) {
            console.error(
              `❌ Failed to send template '${name}' from '${accountEmail}': ${error instanceof Error ? error.message : "Unknown error"}`,
            );
            failed.push(name);
          }

          // per-account delay cadence
          const isLast = i === tplList.length - 1;
          if (!isLast) {
            const afterSeven = sentForAccount > 0 && sentForAccount % 7 === 0;
            const waitMs = afterSeven ? baseDelayMs + 8000 : baseDelayMs;
            if (waitMs > 0) await new Promise((r) => setTimeout(r, waitMs));
          }
        }
      },
      { concurrency: byAccount.size },
    );

    progressSpinner.succeed(`Sent ${sent}/${scheduled} (Failed: ${failed.length})`);
    console.log("\n" + "=".repeat(50));
    console.log(`Attempted: ${scheduled}, Sent: ${sent}, Failed: ${failed.length}`);
    if (failed.length > 0) {
      console.log(`Failed templates: ${failed.join(", ")}`);
      process.exitCode = 1;
    }
    return;
  }

  const base = withEnvFallback(options);
  const cfg = await loadConfig();
  const resolved = {
    ...cfg,
    ...base,
  } as SendOptions;

  // If a base template is provided with a direct --to, and multi-variants exist,
  // send every variant to that single recipient using one shared spinner.
  if (resolved.template && resolved.to && !requestedCsv && !options.all) {
    const variants = await findTemplateVariants(resolved.template);
    if (variants.totalCount > 0) {
      const scheduled = variants.totalCount;
      let sent = 0;
      const spinner = createSpinner({
        text: `[0/${scheduled}] Preparing to send...`,
        color: "cyan",
        spinner: "dots",
      }).start();
      try {
        for (const variantName of variants.variants) {
          const { subject, to: sentTo } = await performSend({ ...resolved, template: variantName });
          sent++;
          spinner.text = `[${sent}/${scheduled}] Sending "${subject}" to ${sentTo}...`;
        }
        spinner.succeed(`Sent ${sent}/${scheduled}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        spinner.fail(`Failed after ${sent}/${scheduled}: ${message}`);
        throw error;
      }
      return;
    }
  }

  // Single send using one spinner
  {
    const scheduled = 1;
    let sent = 0;
    const spinner = createSpinner({
      text: `[0/${scheduled}] Preparing to send...`,
      color: "cyan",
      spinner: "dots",
    }).start();
    try {
      const { subject, to: sentTo } = await performSend(resolved);
      sent = 1;
      spinner.succeed(`[${sent}/${scheduled}] Sent "${subject}" to ${sentTo}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      spinner.fail(`Failed ${sent}/${scheduled}: ${message}`);
      throw error;
    }
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
    else if (a === "--multi-template") {
      const value = args[i + 1];
      if (value === "true") {
        out.multiTemplate = true;
        i++; // Skip the next argument since we consumed it
      } else if (value === "false") {
        out.multiTemplate = false;
        i++; // Skip the next argument since we consumed it
      } else {
        // If no value provided, default to true
        out.multiTemplate = true;
      }
    } else if (a === "--tailwind" && args[i + 1]) {
      const mode = args[++i] as "v3" | "v4" | "off";
      if (["v3", "v4", "off"].includes(mode)) {
        out.tailwind = mode;
      } else {
        console.error(`Invalid tailwind mode: ${mode}. Must be one of: v3, v4, off`);
        process.exit(1);
      }
    } else if (a === "--preview") {
      out.preview = true;
    } else if (a === "--scan") {
      out.scan = true;
    } else if (a === "--force-scan") {
      out.forceScan = true;
    } else if (a === "--all") {
      const value = args[i + 1];
      if (value === "true") {
        out.all = true;
        i++;
      } else if (value === "false") {
        out.all = false;
        i++;
      } else {
        // If no value provided, default to true
        out.all = true;
      }
    } else if (a === "--delay" && args[i + 1]) {
      const n = Number(args[++i]);
      if (Number.isFinite(n) && n >= 0) out.delay = n;
    } else if (a === "--emails-csv") {
      const next = args[i + 1];
      if (next && !next.startsWith("--")) {
        out.emailsCsv = args[++i];
      } else {
        out.emailsCsv = "emails.csv";
      }
    }
  }
  // If multi-template is enabled and --all not explicitly set, default to true
  if (out.multiTemplate === true && out.all === undefined) {
    out.all = true;
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

  // Validate and resolve --from (skip validation in preview mode):
  let resolvedFrom = o.from;
  // Auto-resolve when --from is omitted:
  const shouldAutoResolveFrom = resolvedFrom === undefined && o.preview !== true;
  if (shouldAutoResolveFrom) {
    // Prefer explicit default from env
    const defaultFrom = env.RELSEND_DEFAULT_FROM;
    if (defaultFrom) {
      resolvedFrom = defaultFrom;
    } else if (accounts.length >= 1) {
      // If accounts are configured, pick one at random
      const pickIndex = Math.floor(Math.random() * accounts.length);
      resolvedFrom = accounts[pickIndex]?.user ?? accounts[0]?.user;
    }
  }

  if (resolvedFrom && !o.preview) {
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

type PreviewOptions = {
  from: string;
  to: string;
  subject: string;
  text?: string;
  html?: string;
  react?: React.ReactElement;
};

async function showPreview(options: PreviewOptions): Promise<void> {
  console.log("\n📧 EMAIL PREVIEW");
  console.log("=".repeat(50));
  console.log(`From: ${options.from}`);
  console.log(`To: ${options.to}`);
  console.log(`Subject: ${options.subject}`);
  console.log("=".repeat(50));

  // Handle React component rendering
  let finalHtml = options.html;
  if (options.react && !finalHtml) {
    const { render } = await import("@react-email/components");
    finalHtml = await render(options.react);
  }

  if (options.text) {
    console.log("\n📝 PLAIN TEXT CONTENT:");
    console.log("-".repeat(30));
    console.log(options.text);
  }

  if (finalHtml) {
    console.log("\n🌐 HTML CONTENT:");
    console.log("-".repeat(30));
    console.log(finalHtml);
  }

  if (options.react && !finalHtml) {
    console.log("\n⚛️  REACT COMPONENT:");
    console.log("-".repeat(30));
    console.log("React component will be rendered to HTML by the provider");
  }

  console.log("\n" + "=".repeat(50));
  console.log("✅ Preview complete - no email was sent");
  console.log("Remove --preview flag to actually send the email");
}

async function resolveCsvPath(input?: string): Promise<string | null> {
  const path = input || "emails.csv";
  try {
    await access(path, FS_CONSTANTS.F_OK);
    return path;
  } catch {
    return null;
  }
}

async function readEmailsFromCsv(path: string): Promise<string[]> {
  const raw = await readFile(path, "utf-8");
  const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];

  const header = lines[0] || "";
  const headers = header.split(",").map((h) => h.trim().toLowerCase());
  const emailIdx = headers.indexOf("email");
  if (emailIdx === -1) {
    throw new Error(`CSV '${path}' must include 'email' column`);
  }

  const out: string[] = [];
  for (let i = 1; i < lines.length; i++) {
    const row = lines[i] || "";
    const cells = row.split(",");
    const email = (cells[emailIdx] || "").trim();
    if (email) out.push(email);
  }
  return out;
}
