export interface IEmailSendResult {
  id: number;
  gatewayEmailId?: number;
}

export interface IEmailContext {
  operation: string;
  data?: Record<string, unknown>;
  prismaError?: string;
}
