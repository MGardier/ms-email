import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Observable, throwError } from 'rxjs';

import { ErrorCode } from 'src/common/enums/error-codes.enum';
import {
  IRpcErrorResponse,
  IStructuredLog,
  IStructuredLogContext,
} from 'src/common/types/rpc.types';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);
  private readonly serviceName = 'ms-email';

  catch(
    exception: unknown,
    _host: ArgumentsHost,
  ): Observable<IRpcErrorResponse> {
    if (exception instanceof RpcException) {
      return this.handleRpcException(exception);
    }

    if (exception instanceof BadRequestException) {
      return this.handleValidationException(exception);
    }

    return this.handleUnknownException(exception);
  }

  /** EXCEPTION HANDLERS */

  private handleRpcException(
    exception: RpcException,
  ): Observable<IRpcErrorResponse> {
    const error = exception.getError() as {
      code?: string;
      context?: Record<string, unknown>;
    };
    const context = error?.context ?? {};
    const code = error?.code ?? ErrorCode.UNKNOWN_ERROR;

    const message = this.buildContextualMessage(code, context);
    const logContext = this.extractLogContext(context);

    this.logStructuredError({
      level: 'error',
      timestamp: new Date().toISOString(),
      service: this.serviceName,
      operation: (context.operation as string) ?? 'unknown',
      errorCode: code,
      message,
      context: logContext,
    });

    return throwError(
      () => new RpcException(this.formatException(message, code, context)),
    );
  }

  private handleValidationException(
    exception: BadRequestException,
  ): Observable<IRpcErrorResponse> {
    const response = exception.getResponse() as { message: string | string[] };
    const errors = Array.isArray(response.message)
      ? response.message
      : [response.message];

    const code = ErrorCode.VALIDATION_ERROR;
    const context = {
      operation: 'validation',
      errors,
    };
    const message = this.buildContextualMessage(code, context);

    this.logStructuredError({
      level: 'error',
      timestamp: new Date().toISOString(),
      service: this.serviceName,
      operation: 'validation',
      errorCode: code,
      message,
      context: { errors },
    });

    return throwError(
      () => new RpcException(this.formatException(message, code, context)),
    );
  }

  private handleUnknownException(
    exception: unknown,
  ): Observable<IRpcErrorResponse> {
    const error =
      exception instanceof Error ? exception : new Error(String(exception));
    const code = ErrorCode.UNKNOWN_ERROR;
    const context = {
      operation: 'unknown',
      error: error.message,
    };
    const message = this.buildContextualMessage(code, context);

    this.logStructuredError({
      level: 'error',
      timestamp: new Date().toISOString(),
      service: this.serviceName,
      operation: 'unknown',
      errorCode: code,
      message,
      context: { error: error.message },
    });

    return throwError(
      () => new RpcException(this.formatException(message, code, context)),
    );
  }

  /** PRIVATE METHODS */

  private buildContextualMessage(
    code: string,
    context: Record<string, unknown>,
  ): string {
    const operation = (context.operation as string) || 'unknown';

    switch (code) {

      /* VALIDATION */
      case ErrorCode.INVALID_PAYLOAD:
        return this.buildInvalidPayloadMessage(context);

      case ErrorCode.VALIDATION_ERROR: {
        const errors = context.errors as string[] | undefined;
        return `Validation failed: ${errors?.join(', ') ?? 'unknown validation errors'}`;
      }

      /* TEMPLATE */
      case ErrorCode.TEMPLATE_NOT_FOUND:
        return `Template not found: ID "${context.templateVersionId ?? context.slug ?? context.templatePath ?? 'unknown'}" does not exist in database or file is missing.`;

      case ErrorCode.TEMPLATE_CANNOT_ACCESS:
        return `Access denied: system does not have permission to read template "${context.templatePath}".`;

      case ErrorCode.TEMPLATE_UNKNOWN_ERROR:
        return `Template error: unexpected error while processing "${context.templatePath}". Details: ${context.error ?? 'none'}.`;

      case ErrorCode.TEMPLATE_PATH_INVALID:
        return `Invalid path: attempted to access unauthorized path "${context.templatePath}" (path traversal detected).`;

      /* PRISMA */
      case ErrorCode.PRISMA_EMAIL_CREATE_ERROR: {
        const data = context.data as Record<string, unknown> | undefined;
        const recipients =
          (data?.recipients as string[])?.join(', ') ?? 'unknown';
        return `Email creation failed: Prisma error "${context.prismaError}" for recipients [${recipients}].`;
      }

      case ErrorCode.PRISMA_EMAIL_UPDATE_ERROR:
        return `Email update failed: unable to modify email "${context.id}". Prisma error: ${context.prismaError}.`;

      case ErrorCode.PRISMA_EMAIL_LOG_CREATE_ERROR:
        return `Email log creation failed: unable to create log for email "${context.emailId}". Status: ${context.status}. Prisma error: ${context.prismaError}.`;

      /* EMAIL PROVIDER */
      case ErrorCode.PROVIDER_SENDING_FAILED:
        return `Sending failed: provider returned error "${context.error ?? 'unknown'}". Email ID: ${context.emailId ?? 'N/A'}.`;

      case ErrorCode.PROVIDER_AUTHENTICATION_FAILED:
        return `Authentication failed: unable to authenticate with email provider. Check credentials.`;

      case ErrorCode.PROVIDER_NOT_CONFIGURED:
        return `Provider not configured: "${context.requestedProvider}" is not available. Active providers: ${context.availableProviders ?? 'none'}.`;

      /* RABBITMQ */
      case ErrorCode.RABBITMQ_CONNECTION_FAILED:
        return `RabbitMQ connection failed: unable to establish connection to broker. Check RABBITMQ_URL.`;

      case ErrorCode.RABBITMQ_CHANNEL_ERROR:
        return `RabbitMQ channel error: communication channel encountered an error.`;

      case ErrorCode.RABBITMQ_MESSAGE_PROCESSING_FAILED:
        return `Message processing failed: unable to process RabbitMQ message. Reason: ${context.reason ?? 'unknown'}.`;

      /* UNKNOWN */
      case ErrorCode.UNKNOWN_ERROR:
        return `Unexpected error: ${context.error ?? 'no details available'}`;

      default:
        return `Unknown error [${code}] in operation "${operation}". Context: ${JSON.stringify(context)}.`;
    }
  }

  private buildInvalidPayloadMessage(
    context: Record<string, unknown>,
  ): string {
    const reason = context.reason as string | undefined;

    if (reason?.includes('both')) {
      return `Invalid payload: you provided both 'html' AND 'templateVersionId'. Choose one or the other.`;
    }

    if (reason?.includes('either')) {
      return `Invalid payload: you must provide either 'html' (raw content) or 'templateVersionId' (template reference).`;
    }

    return `Invalid payload: ${reason ?? 'payload format does not match expected schema'}.`;
  }

  private extractLogContext(
    context: Record<string, unknown>,
  ): IStructuredLogContext {
    return {
      recipients: context.recipients as string[] | undefined,
      subject: context.subject as string | undefined,
      templateId: context.templateVersionId as number | undefined,
      emailId: context.emailId as string | undefined,
      provider: context.provider as string | undefined,
      reason: context.reason as string | undefined,
      error: context.error as string | undefined,
      operation: context.operation as string | undefined,
    };
  }

  private formatException(
    message: string,
    code: string,
    context: Record<string, unknown>,
  ): IRpcErrorResponse {
    return {
      success: false,
      error: {
        message,
        code,
        context,
        timestamp: new Date(),
      },
    };
  }

  private logStructuredError(log: IStructuredLog): void {

    this.logger.error(JSON.stringify(log));

    const contextLines = this.buildContextLines(log.context);

    this.logger.error(
      `\n${'═'.repeat(70)}` +
        `\n║ ERROR: ${log.errorCode}` +
        `\n${'─'.repeat(70)}` +
        `\n║ Service    : ${log.service}` +
        `\n║ Operation  : ${log.operation}` +
        `\n║ Message    : ${log.message}` +
        contextLines +
        `\n${'─'.repeat(70)}` +
        `\n║ Timestamp  : ${log.timestamp}` +
        `\n${'═'.repeat(70)}`,
    );
  }

  private buildContextLines(context: IStructuredLogContext): string {
    let lines = '';

    if (context.recipients?.length) {
      lines += `\n║ Recipients : ${context.recipients.join(', ')}`;
    }
    if (context.subject) {
      lines += `\n║ Subject    : ${context.subject}`;
    }
    if (context.templateId) {
      lines += `\n║ Template   : ${context.templateId}`;
    }
    if (context.emailId) {
      lines += `\n║ Email ID   : ${context.emailId}`;
    }
    if (context.provider) {
      lines += `\n║ Provider   : ${context.provider}`;
    }
    if (context.reason) {
      lines += `\n║ Reason     : ${context.reason}`;
    }
    if (context.error) {
      lines += `\n║ Error      : ${context.error}`;
    }

    return lines;
  }
}
