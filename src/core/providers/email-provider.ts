export interface EmailMessage {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  html?: string;
  text?: string;
  attachments?: Array<{ name: string; contentType: string; data: Uint8Array }>;
}

export interface EmailProvider {
  code: string;
  send(message: EmailMessage): Promise<{ messageId: string }>;
}
