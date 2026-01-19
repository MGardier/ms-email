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
    const operation = (ctx.operation as string) || 'inconnu';
    const templatePath = (ctx.templatePath as string) || 'inconnu';
    const path = (ctx.path as string) || 'chemin inconnu';

    switch (code) {
      /* TEMPLATE */
      case ErrorCode.TEMPLATE_NOT_FOUND:
        return `Opération : ${operation} => Template ${templatePath} introuvable dans ${path}.`;

      case ErrorCode.TEMPLATE_CANNOT_ACCESS:
        return `Opération : ${operation} => Le système a bien trouvé le template : "${templatePath}" mais n'a pas les permissions pour y accéder.`;

      case ErrorCode.TEMPLATE_UNKNOWN_ERROR:
        return `Opération : ${operation} => Une erreur inconnue est survenue pour le template : "${templatePath}".`;

      case ErrorCode.TEMPLATE_PATH_INVALID:
        return `Opération : ${operation} => Le chemin du template "${templatePath}" est invalide (tentative de path traversal détectée).`;

      /* PRISMA */
      case ErrorCode.PRISMA_EMAIL_CREATE_ERROR: {
        const data = ctx.data as Record<string, unknown> | undefined;
        return `Opération : ${operation} => Impossible de créer l'email "${data?.subject}" pour "${data?.receivers}" à cause de l'erreur : ${ctx.prismaError}.`;
      }

      case ErrorCode.PRISMA_EMAIL_UPDATE_ERROR:
        return `Opération : ${operation} => Impossible de mettre à jour l'email ${ctx.id} à cause de l'erreur : ${ctx.prismaError}.`;

      case ErrorCode.PRISMA_EMAIL_DELETE_ERROR:
        return `Opération : ${operation} => Impossible de supprimer l'email ${ctx.id} à cause de l'erreur : ${ctx.prismaError}.`;

      /* NESTJS MAILER */
      case ErrorCode.NESTJSMAILER_SENDING_FAILED:
        return `Opération : ${operation} => Echec de l'envoi d'un email, expéditeur : ${ctx.sender || 'inconnu'} - destinataires ${ctx.receivers || 'inconnu'}, chemin : ${path}, variables : ${ctx.variables || 'inconnu'}.`;

      case ErrorCode.NESTJSMAILER_AUTHENTICATION_FAILED:
        return `Opération : ${operation} => Les identifiants de l'email utilisé sont incorrects, host: ${ctx.host}, email : ${ctx.sender}, token: ******.`;

      default:
        return `Erreur inconnue, code : ${code}`;
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
