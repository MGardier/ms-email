
import { EmailProviderType } from "./providers/provider.constants";

export interface IEmailSendResult {
  id: string;
  providerEmailId?: string;
}

export interface IEmailContext {
  operation: string;
  data?: Record<string, unknown>;
  prismaError?: string;
}

/** PROVIDERS  */

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


export interface IMailjetMessageResponse {
  Messages: Array<{
    To: Array<{ MessageID: number }>;
  }>;
}

/** ORCHESTRATOR SERVICE */

export interface IOrchestratorResult extends IEmailProviderResult {
  provider: EmailProviderType;
  attempts: number;
  usedFallback: boolean;
  allErrors: string[];
}

export interface IProviderAttemptResult {
  success: boolean;
  emailId?: string;
  attempts: number;
  errors: string[];
}


/** RETRY SERVICE */

export interface IRetryConfig {
  maxAttempts: number;
  baseDelayMs: number;
  backoffMultiplier: number;
  maxDelayMs: number;
}

export interface IRetryResult<T> {
  success: boolean;
  result?: T;
  attempts: number;
  errors: string[];
}
