export interface IRpcErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    context?: Record<string, unknown>;
    timestamp: Date;
  };
}
