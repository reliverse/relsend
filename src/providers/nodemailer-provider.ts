import { render } from "@react-email/components";
import type { Transporter } from "nodemailer";
import nodemailer from "nodemailer";
import type { EmailProvider, ProviderConfig, SendEmailOptions, SendEmailResult } from "./types";

export class NodemailerProvider implements EmailProvider {
  name = "nodemailer";
  private transporter: Transporter;

  constructor(config: ProviderConfig) {
    if (config.type !== "nodemailer") {
      throw new Error("Invalid provider type for NodemailerProvider");
    }

    const authType = config.authType || "password";

    if (authType === "oauth2") {
      const hasOAuth2Config =
        config.clientId && config.clientSecret && config.refreshToken && config.user;
      if (!hasOAuth2Config) {
        throw new Error("OAuth2 requires clientId, clientSecret, refreshToken, and user");
      }

      this.transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          type: "OAuth2",
          user: config.user,
          clientId: config.clientId,
          clientSecret: config.clientSecret,
          refreshToken: config.refreshToken,
        },
      });
    } else {
      const hasSMTPConfig = config.host && config.port && config.user && config.pass;
      if (!hasSMTPConfig) {
        throw new Error("SMTP requires host, port, user, and pass");
      }

      // Port 465 typically requires secure=true (SSL), port 587 uses STARTTLS (secure=false)
      const isSecure = Boolean(config.secure);
      const isPort465 = config.port === 465;

      // Auto-correct: port 465 should use secure=true
      const secure = isPort465 ? true : isSecure;

      this.transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure,
        // Add TLS options for better compatibility
        tls: {
          rejectUnauthorized: false, // Some servers have self-signed certs
        },
        auth: { user: config.user, pass: config.pass },
      });
    }
  }

  async send(options: SendEmailOptions): Promise<SendEmailResult> {
    try {
      let html = options.html;

      // If React component is provided, render it to HTML
      if (options.react) {
        html = await render(options.react);
      }

      const info = await this.transporter.sendMail({
        from: options.from,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html,
      });

      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}
