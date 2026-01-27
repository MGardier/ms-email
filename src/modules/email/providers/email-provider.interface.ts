export interface IEmailProviderOptions {
  to: string[];
  subject: string;
  html: string;
  from?: string;
  cc?: string[];
  bcc?: string[];
}

export interface IEmailProviderResult {
  success: boolean;
  emailId?: string;
  error?: string;
}

export interface IEmailProvider {
  sendMail(options: IEmailProviderOptions): Promise<IEmailProviderResult>;
  healthCheck(): Promise<boolean>;
}

export const EMAIL_PROVIDER_TOKEN = 'EMAIL_PROVIDER';
