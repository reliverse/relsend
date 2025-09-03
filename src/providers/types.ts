export interface EmailProvider {
  name: string;
  send(options: SendEmailOptions): Promise<SendEmailResult>;
}

export interface SendEmailOptions {
  from: string;
  to: string;
  subject: string;
  text?: string;
  html?: string;
  // For React Email components
  react?: React.ReactElement;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export type ProviderType = "nodemailer" | "resend";

export interface ProviderConfig {
  type: ProviderType;
  // Nodemailer config
  host?: string;
  port?: number;
  secure?: boolean;
  user?: string;
  pass?: string;
  authType?: "password" | "oauth2";
  clientId?: string;
  clientSecret?: string;
  refreshToken?: string;
  // Resend config
  apiKey?: string;
}
