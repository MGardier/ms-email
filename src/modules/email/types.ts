export interface IEmailSendResult {
  id: string;
  providerMessageId?: string;
}

export interface IEmailContext {
  operation: string;
  data?: Record<string, unknown>;
  prismaError?: string;
}
