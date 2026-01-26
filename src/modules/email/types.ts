export interface IEmailSendResult {
  id: string;
  providerEmailId?: string;
}

export interface IEmailContext {
  operation: string;
  data?: Record<string, unknown>;
  prismaError?: string;
}
