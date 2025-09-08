import { existsSync, readFileSync, writeFileSync } from "fs";
import { createSpinner } from "../utils/spinner/mod";

type SettingsKey =
  | "host"
  | "port"
  | "secure"
  | "authType"
  | "clientId"
  | "clientSecret"
  | "refreshToken";

export async function configCommand(args: string[]): Promise<void> {
  const sub = args[0];
  if (!sub || sub === "help" || sub === "--help" || sub === "-h") {
    printConfigHelp();
    return;
  }

  if (sub === "get") {
    const envVars = getEnvVars();
    console.log(JSON.stringify(envVars, null, 2));
    return;
  }

  if (sub === "set") {
    const kv: Record<string, string> = {};
    for (let i = 1; i < args.length; i++) {
      const a = args[i];
      if (typeof a !== "string") continue;
      const eq = a.indexOf("=");
      if (eq > 0) {
        const k = a.slice(0, eq) as SettingsKey;
        const v = a.slice(eq + 1);
        if (isAllowedKey(k)) kv[k] = v;
      }
    }
    const keys = Object.keys(kv) as SettingsKey[];
    if (keys.length === 0) {
      console.error(
        "Nothing to set. Example: bun relsend config set host=smtp.example.com port=587 secure=false",
      );
      return;
    }

    const spinner = createSpinner({
      text: "Updating configuration...",
      color: "yellow",
      spinner: "dots",
    });

    try {
      spinner.start();
      updateEnvFile(kv);
      spinner.succeed(`Configuration updated: ${keys.join(", ")}`);
      console.log(JSON.stringify({ ok: true, updated: keys }, null, 2));
    } catch (error) {
      spinner.fail(
        `Failed to update configuration: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }
    return;
  }

  console.error(`Unknown subcommand: ${sub}`);
  printConfigHelp();
}

function isAllowedKey(k: string): k is SettingsKey {
  return "host|port|secure|authType|clientId|clientSecret|refreshToken".split("|").includes(k);
}

function getEnvVars(): Record<string, string> {
  const envVars: Record<string, string> = {};
  const envKeys = [
    "RELSEND_HOST",
    "RELSEND_PORT",
    "RELSEND_SECURE",
    "RELSEND_AUTH_TYPE",
    "RELSEND_CLIENT_ID",
    "RELSEND_CLIENT_SECRET",
    "RELSEND_REFRESH_TOKEN",
    // Show up to 10 accounts if present
    ...Array.from({ length: 10 }, (_, i) => `RELSEND_USER_NAME_${i + 1}`),
    ...Array.from({ length: 10 }, (_, i) => `RELSEND_USER_PASS_${i + 1}`),
  ];

  for (const key of envKeys) {
    const value = process.env[key];
    if (value) {
      // Convert RELSEND_* to the shorter form for display
      const shortKey = key.replace("RELSEND_", "").toLowerCase();
      envVars[shortKey] = value;
    }
  }

  return envVars;
}

function updateEnvFile(kv: Record<string, string>): void {
  const envPath = ".env";
  let envContent = "";

  // Read existing .env file if it exists
  if (existsSync(envPath)) {
    envContent = readFileSync(envPath, "utf-8");
  }

  // Parse existing content
  const lines = envContent.split("\n");
  const existingVars = new Map<string, string>();

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const eqIndex = trimmed.indexOf("=");
      if (eqIndex > 0) {
        const key = trimmed.slice(0, eqIndex);
        const value = trimmed.slice(eqIndex + 1);
        existingVars.set(key, value);
      }
    }
  }

  // Update with new values
  for (const [key, value] of Object.entries(kv)) {
    const envKey = `RELSEND_${key.toUpperCase()}`;
    existingVars.set(envKey, value);
  }

  // Write back to .env file
  const newLines: string[] = [];
  for (const [key, value] of existingVars) {
    newLines.push(`${key}=${value}`);
  }

  writeFileSync(envPath, `${newLines.join("\n")}\n`);
}

function printConfigHelp(): void {
  const text = `
Usage: bun relsend config <get|set> [key=value ...]

Examples:
  bun relsend config get
  bun relsend config set host=smtp.example.com port=587 secure=false
  # For accounts, set via environment (e.g. .env):
  # RELSEND_USER_NAME_1=me@gmail.com
  # RELSEND_USER_PASS_1=app-password
  # RELSEND_USER_NAME_2=hr@company.com
  # RELSEND_USER_PASS_2=secret
`;
  console.log(text);
}
