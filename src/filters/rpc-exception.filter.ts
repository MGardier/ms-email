import { Catch, Logger } from '@nestjs/common';
import { BaseRpcExceptionFilter, RpcException } from '@nestjs/microservices';
import { EnumErrorCode } from 'src/enums/error-codes.enum';
import { RpcErrorResponseInterface } from 'src/interfaces/rpc-error-response.interface';
import { Observable, throwError } from 'rxjs';

@Catch(RpcException)
export class RpcExceptionFilter extends BaseRpcExceptionFilter {
  private readonly logger = new Logger(RpcExceptionFilter.name);

  catch(exception: RpcException): Observable<RpcErrorResponseInterface> {
    const error = exception.getError() as {
      code?: string;
      context?: Record<string, unknown>;
    };
    const context = error?.context;
    const code = error?.code;
    const message = this.__buildContextualMessage(code, context);

    this.__logException((context?.operation as string) ?? 'unknown', message);

    return throwError(() => this.__formatException(message, code, context));
  }

  private __buildContextualMessage(
    code: string | undefined,
    context: Record<string, unknown> | undefined,
  ): string {
    const ctx = context ?? {};
    const operation = (ctx.operation as string) || 'inconnu';
    const templatePath = (ctx.templatePath as string) || 'inconnu';
    const path = (ctx.path as string) || 'chemin inconnu';

    switch (code) {
      /** ---------- TEMPLATE --------------- */
      case EnumErrorCode.TEMPLATE_NOT_FOUND:
        return `Opération : ${operation} => Template ${templatePath} introuvable dans ${path}.`;

      case EnumErrorCode.TEMPLATE_CANNOT_ACCESS:
        return `Opération : ${operation} => Le système a bien trouvé le template : "${templatePath}" mais n'a pas les permissions pour y accéder.`;

      case EnumErrorCode.TEMPLATE_UNKNOWN_ERROR:
        return `Opération : ${operation} => Une erreur inconnue est survenue pour le template : "${templatePath}".`;

      case EnumErrorCode.TEMPLATE_PATH_INVALID:
        return `Opération : ${operation} => Le chemin du template "${templatePath}" est invalide (tentative de path traversal détectée).`;

      /** ---------- PRISMA --------------- */
      case EnumErrorCode.PRISMA_EMAIL_CREATE_ERROR: {
        const data = ctx.data as Record<string, unknown> | undefined;
        return `Opération : ${operation} => Impossible de créer l'email "${data?.subject}" pour "${data?.receivers}" à cause de l'erreur : ${ctx.prismaError}.`;
      }

      case EnumErrorCode.PRISMA_EMAIL_UPDATE_ERROR:
        return `Opération : ${operation} => Impossible de mettre à jour l'email ${ctx.id} à cause de l'erreur : ${ctx.prismaError}.`;

      case EnumErrorCode.PRISMA_EMAIL_DELETE_ERROR:
        return `Opération : ${operation} => Impossible de supprimer l'email ${ctx.id} à cause de l'erreur : ${ctx.prismaError}.`;

      /** ---------- NESTJSMAILER --------------- */
      case EnumErrorCode.NESTJSMAILER_SENDING_FAILED:
        return `Opération : ${operation} => Echec de l'envoi d'un email, expéditeur : ${ctx.sender || 'inconnu'} - destinataires ${ctx.receivers || 'inconnu'}, chemin : ${path}, variables : ${ctx.variables || 'inconnu'}.`;

      case EnumErrorCode.NESTJSMAILER_AUTHENTIFICATION_FAILED:
        return `Opération : ${operation} => Les identifiants de l'email utilisé sont incorrects, host: ${ctx.host}, email : ${ctx.sender}, token: ******.`;

      default:
        return `Erreur inconnue, code : ${code}`;
    }
  }

  private __formatException(
    message: string,
    code: string | undefined,
    context: Record<string, unknown> | undefined,
  ): RpcErrorResponseInterface {
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

  private __logException(operation: string, message: string): void {
    this.logger.error(
      `
      \n----------------------------------------------------------
      \n ❌ Operation  : ${operation}
      \n ❌ Error  : ${message}
      \n ❌ Timestamp  : ${new Date().toString()}
      \n ----------------------------------------------------------
      `,
    );
  }
}
