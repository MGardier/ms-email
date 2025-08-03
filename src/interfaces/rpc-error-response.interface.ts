export interface RpcErrorResponseInterface {
  success: false;
  error: {
    code: string;
    message: string;
    context?: Record<string, any>;
    timestamp: Date;
  };
}
