type RelsendConfig = {
  host?: string;
  port?: number;
  secure?: boolean;
  authType?: "password" | "oauth2";
  clientId?: string;
  clientSecret?: string;
  refreshToken?: string;
};

export async function loadConfig(): Promise<RelsendConfig> {
  return envConfig();
}

function envConfig(): RelsendConfig {
  const e = process.env as Record<string, string | undefined>;
  return normalize({
    host: e.RELSEND_HOST,
    port: e.RELSEND_PORT ? Number(e.RELSEND_PORT) : undefined,
    secure: e.RELSEND_SECURE ? e.RELSEND_SECURE === "true" : undefined,
    authType: e.RELSEND_AUTH_TYPE as "password" | "oauth2" | undefined,
    clientId: e.RELSEND_CLIENT_ID,
    clientSecret: e.RELSEND_CLIENT_SECRET,
    refreshToken: e.RELSEND_REFRESH_TOKEN,
  });
}

function normalize(cfg: Partial<RelsendConfig>): RelsendConfig {
  const out: RelsendConfig = {};
  if (cfg.host) out.host = String(cfg.host);
  if (cfg.authType) out.authType = cfg.authType;
  if (cfg.clientId) out.clientId = String(cfg.clientId);
  if (cfg.clientSecret) out.clientSecret = String(cfg.clientSecret);
  if (cfg.refreshToken) out.refreshToken = String(cfg.refreshToken);
  if (typeof cfg.port === "string") {
    const n = Number(cfg.port);
    if (Number.isFinite(n) && n > 0) out.port = Math.floor(n);
  } else if (typeof cfg.port === "number" && Number.isFinite(cfg.port)) {
    out.port = Math.floor(cfg.port);
  }
  if (typeof cfg.secure === "string") out.secure = cfg.secure === "true";
  else if (typeof cfg.secure === "boolean") out.secure = cfg.secure;
  return out;
}
