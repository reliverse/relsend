import { NodemailerProvider } from "./nodemailer-provider";
import { ResendProvider } from "./resend-provider";
import type { EmailProvider, ProviderConfig } from "./types";

export function createProvider(config: ProviderConfig): EmailProvider {
  switch (config.type) {
    case "nodemailer":
      return new NodemailerProvider(config);
    case "resend":
      return new ResendProvider(config);
    default:
      throw new Error(`Unsupported provider type: ${config.type}`);
  }
}
