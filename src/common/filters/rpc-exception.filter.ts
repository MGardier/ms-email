import { Catch, Logger } from '@nestjs/common';
import { BaseRpcExceptionFilter, RpcException } from '@nestjs/microservices';
import { Observable, throwError } from 'rxjs';
import { ErrorCode } from 'src/common/enums/error-codes.enum';
import { IRpcErrorResponse } from 'src/common/types/rpc.types';

@Catch(RpcException)
export class RpcExceptionFilter extends BaseRpcExceptionFilter {
  private readonly logger = new Logger(RpcExceptionFilter.name);

  catch(exception: RpcException): Observable<IRpcErrorResponse> {
    const error = exception.getError() as {
      code?: string;
      context?: Record<string, unknown>;
    };
    const context = error?.context;
    const code = error?.code;
    const message = this.buildContextualMessage(code, context);

    this.logException((context?.operation as string) ?? 'unknown', message);

    return throwError(() => this.formatException(message, code, context));
  }

  private buildContextualMessage(
    code: string | undefined,
    context: Record<string, unknown> | undefined,
  ): string {
    const ctx = context ?? {};
    const operation = (ctx.operation as string) || 'unknown';
    const templatePath = (ctx.templatePath as string) || 'unknown';
    const path = (ctx.path as string) || 'unknown path';

    switch (code) {
      /* TEMPLATE */
      case ErrorCode.TEMPLATE_NOT_FOUND:
        return `Operation: ${operation} => Template ${templatePath} not found in ${path}.`;

      case ErrorCode.TEMPLATE_CANNOT_ACCESS:
        return `Operation: ${operation} => Template "${templatePath}" was found but the system does not have permission to access it.`;

      case ErrorCode.TEMPLATE_UNKNOWN_ERROR:
        return `Operation: ${operation} => An unknown error occurred for template "${templatePath}".`;

      case ErrorCode.TEMPLATE_PATH_INVALID:
        return `Operation: ${operation} => Template path "${templatePath}" is invalid (path traversal attempt detected).`;

      /* PRISMA */
      case ErrorCode.PRISMA_EMAIL_CREATE_ERROR: {
        const data = ctx.data as Record<string, unknown> | undefined;
        return `Operation: ${operation} => Failed to create email "${data?.subject}" for "${data?.receivers}" due to error: ${ctx.prismaError}.`;
      }

      case ErrorCode.PRISMA_EMAIL_UPDATE_ERROR:
        return `Operation: ${operation} => Failed to update email ${ctx.id} due to error: ${ctx.prismaError}.`;

      case ErrorCode.PRISMA_EMAIL_DELETE_ERROR:
        return `Operation: ${operation} => Failed to delete email ${ctx.id} due to error: ${ctx.prismaError}.`;

      /* NESTJS MAILER */
      case ErrorCode.NESTJSMAILER_SENDING_FAILED:
        return `Operation: ${operation} => Failed to send email, sender: ${ctx.sender || 'unknown'} - recipients: ${ctx.receivers || 'unknown'}, path: ${path}, variables: ${ctx.variables || 'unknown'}.`;

      case ErrorCode.NESTJSMAILER_AUTHENTICATION_FAILED:
        return `Operation: ${operation} => Email credentials are invalid, host: ${ctx.host}, email: ${ctx.sender}, token: ******.`;

      /* RABBITMQ */
      case ErrorCode.RABBITMQ_CONNECTION_FAILED:
        return `Operation: ${operation} => Failed to connect to RabbitMQ.`;

      case ErrorCode.RABBITMQ_CHANNEL_ERROR:
        return `Operation: ${operation} => RabbitMQ channel error.`;

      case ErrorCode.RABBITMQ_MESSAGE_PROCESSING_FAILED:
        return `Operation: ${operation} => Failed to process RabbitMQ message, reason: ${ctx.reason || 'unknown'}.`;

      default:
        return `Unknown error, code: ${code}`;
    }
  }

  private formatException(
    message: string,
    code: string | undefined,
    context: Record<string, unknown> | undefined,
  ): IRpcErrorResponse {
    return {
      success: false,
      error: {
        message,
        code: code ?? 'UNKNOWN_ERROR',
        context,
        timestamp: new Date(),
      },
    };
  }

  private logException(operation: string, message: string): void {
    this.logger.error(
      `\n----------------------------------------------------------` +
        `\n ❌ Operation  : ${operation}` +
        `\n ❌ Error  : ${message}` +
        `\n ❌ Timestamp  : ${new Date().toISOString()}` +
        `\n----------------------------------------------------------`,
    );
  }
}
