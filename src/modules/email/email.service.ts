import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailProvider } from '@prisma/client';

import { EmailRepository } from './email.repository';
import { SendEmailDto } from './dto/send-email.dto';
import { TemplateService } from 'src/modules/template/template.service';
import { ProviderOrchestratorService } from './providers/provider-orchestrator.service';
import { IEmailSendResult,IEmailProviderOptions,  IOrchestratorResult, } from './types';

import { ITemplateVersion } from 'src/modules/template/types';
import { RpcException } from '@nestjs/microservices';
import { ErrorCode } from 'src/common/enums/error-codes.enum';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly emailRepository: EmailRepository,
    private readonly templateService: TemplateService,
    private readonly providerOrchestrator: ProviderOrchestratorService,
  ) {}

  async sendMail(payload: SendEmailDto): Promise<IEmailSendResult> {
    const templateVersion = await this.resolveTemplate(payload);
    const html = await this.templateService.buildTemplate(
      payload,
      templateVersion,
    );

    // 1. Create email BEFORE sending (for tracability)
    const email = await this.emailRepository.create(payload, ['id']);
    const emailId = email.id as string;

    // 2. Send email with retry and fallback
    const orchestratorResult = await this.send({
      to: payload.recipients,
      subject: payload.subject,
      html,
      from: this.configService.get<string>('EMAIL_FROM'),
      cc: payload.cc,
      bcc: payload.bcc,
    });

    // 3. Log the result
    const provider = orchestratorResult.provider as EmailProvider;

    if (orchestratorResult.usedFallback) {
      this.logger.warn(
        `Email ${emailId} sent via fallback provider: ${provider}`,
      );
    }

    await this.emailRepository.createLog(
      emailId,
      'sent',
      orchestratorResult.usedFallback ? 'warning' : 'info',
      provider,
      orchestratorResult.emailId,
      orchestratorResult.allErrors.length > 0
        ? { previousErrors: orchestratorResult.allErrors }
        : undefined,
    );

    return {
      id: emailId,
      providerEmailId: orchestratorResult.emailId,
    };
  }

  /** PRIVATE METHODS */

  private async resolveTemplate(
    payload: SendEmailDto,
  ): Promise<ITemplateVersion> {
    const hasHtml = !!payload.html;
    const hasTemplateId = !!payload.templateVersionId;

    if (hasHtml && hasTemplateId) {
      throw new RpcException({
        code: ErrorCode.INVALID_PAYLOAD,
        context: {
          operation: 'email-service-resolveTemplate',
          reason: 'Cannot provide both html and templateVersionId',
          recipients: payload.recipients,
          subject: payload.subject,
        },
      });
    }

    if (!hasHtml && !hasTemplateId) {
      throw new RpcException({
        code: ErrorCode.INVALID_PAYLOAD,
        context: {
          operation: 'email-service-resolveTemplate',
          reason: 'Must provide either html or templateVersionId',
          recipients: payload.recipients,
          subject: payload.subject,
        },
      });
    }

    if (hasHtml) {
      return this.templateService.getTemplateVersionBySlug('raw');
    }

    return this.templateService.getTemplateVersionById(
      payload.templateVersionId as number,
    );
  }

  private async send(
    options: IEmailProviderOptions,
  ): Promise<IOrchestratorResult> {
    return this.providerOrchestrator.sendWithRetryAndFallback(options);
  }
}
