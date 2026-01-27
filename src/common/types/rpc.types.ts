export interface IRpcErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    context?: Record<string, unknown>;
    timestamp: Date;
  };
}

export interface IStructuredLogContext {
  recipients?: string[];
  subject?: string;
  templateId?: number;
  emailId?: string;
  provider?: string;
  reason?: string;
  error?: string;
  [key: string]: unknown;
}

export interface IStructuredLog {
  level: 'error' | 'warn' | 'info';
  timestamp: string;
  service: string;
  operation: string;
  errorCode: string;
  message: string;
  context: IStructuredLogContext;
}
