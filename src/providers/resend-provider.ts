import { Resend } from "resend";
import type { EmailProvider, ProviderConfig, SendEmailOptions, SendEmailResult } from "./types";

export class ResendProvider implements EmailProvider {
  name = "resend";
  private resend: Resend;

  constructor(config: ProviderConfig) {
    if (config.type !== "resend") {
      throw new Error("Invalid provider type for ResendProvider");
    }

    if (!config.apiKey) {
      throw new Error("Resend requires apiKey");
    }

    this.resend = new Resend(config.apiKey);
  }

  async send(options: SendEmailOptions): Promise<SendEmailResult> {
    try {
      const result = await this.resend.emails.send({
        from: options.from,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
        // Resend supports React components directly
        react: options.react,
      });

      if (result.error) {
        return {
          success: false,
          error: result.error.message || "Resend API error",
        };
      }

      return {
        success: true,
        messageId: result.data?.id,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}
