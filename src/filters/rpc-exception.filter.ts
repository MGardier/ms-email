import { Catch, ArgumentsHost, Logger } from '@nestjs/common';
import { BaseRpcExceptionFilter, RpcException } from '@nestjs/microservices';
import { EnumErrorCode } from 'src/enums/error-codes.enum';
import { RpcErrorResponseInterface } from 'src/interfaces/rpc-error-response.interface';
import { Observable, throwError } from 'rxjs';

//Formater les erreurs
// logger les erreurs

@Catch(RpcException)
export class RpcExceptionFilter extends BaseRpcExceptionFilter {
  private readonly logger = new Logger(RpcExceptionFilter.name);

  catch(exception: any): Observable<RpcErrorResponseInterface> {
    const context = exception.error?.context;
    const code = exception.error?.code;
    const message = this.__buildContextualMessage(code, context);

    this.__logException(context.operation, message);

    return throwError(() => this.__formatException(message, code, context));
  }

  private __buildContextualMessage(
    code: string,
    context: Record<string, any>,
  ): string {
    switch (code) {
      /** ---------- TEMPLATE --------------- */
      case EnumErrorCode.TEMPLATE_NOT_FOUND:
        return ` Opération : ${context.operation || 'inconnu'} => Template ${context.templatePath || 'inconnu'} introuvable dans ${context.path || 'chemin inconnu'}.`;

      case EnumErrorCode.TEMPLATE_CANNOT_ACCESS:
        return ` Opération : ${context.operation || 'inconnu'} => Le système a bien trouvé  le template : " ${context.templatePath || 'inconnu'} " mais n'a pas les permissions pour y accéder.`;

      case EnumErrorCode.TEMPLATE_UNKNOWN_ERROR:
        return ` Opération : ${context.operation || 'inconnu'} => Une erreur inconnue est survenue pour  le template : " ${context.templatePath || 'inconnu'} ".`;

      /** ---------- PRISMA --------------- */
      case EnumErrorCode.PRISMA_EMAIL_CREATE_ERROR:
        return `Opération : ${context.operation || 'inconnu'} =>  Impossible de créer l'email " ${context.data?.subject} " pour " ${context.data?.receivers} " à cause de l'erreur : ${context.prismaError}.`;

      case EnumErrorCode.PRISMA_EMAIL_UPDATE_ERROR:
        return `Opération : ${context.operation || 'inconnu'} =>  Impossible de mettre à jour l'email ${context.id}  à cause de l'erreur : ${context.prismaError}.`;

      /** ---------- NESTJSMAILER --------------- */
      case EnumErrorCode.NESTJSMAILER_SENDING_FAILED:
        return `Opération : ${context.operation || 'inconnu'} => Echec de l'envoi d'un email  , expéditeur :  ${context.sender || 'inconnu'} - destinataires ${context.receivers || ' inconnu'} , chemin : ${context.path || 'inconnu'},  variables : ${context.variables || 'inconnu'} .`;

      case EnumErrorCode.NESTJSMAILER_AUTHENTIFICATION_FAILED:
        return `Opération : ${context.operation || 'inconnu'} => Les identifiants de l'email utilisé sont incorrects , host: ${context.host} , email : ${context.sender}, token: ****** .`;

      default:
        return `Erreur inconnue,  code :${code}`;
    }
  }

  private __formatException(
    message: string,
    code: string,
    context: Record<string, any>,
  ): RpcErrorResponseInterface {
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

  private __logException(operation, message) {
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
