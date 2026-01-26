import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RpcException } from '@nestjs/microservices';
import { EmailProvider } from '@prisma/client';

import { ErrorCode } from 'src/common/enums/error-codes.enum';
import { EmailRepository } from './email.repository';
import { SendEmailDto } from './dto/send-email.dto';
import { TemplateService } from 'src/modules/template/template.service';
import { ProviderFactoryService } from './providers/provider-factory.service';
import { IEmailSendResult } from './types';
import {
  IEmailProviderOptions,
  IEmailProviderResult,
} from './providers/email-provider.interface';
import { ITemplateVersion } from 'src/modules/template/types';
import { DEFAULTS } from 'src/common/constants/defaults';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly emailRepository: EmailRepository,
    private readonly templateService: TemplateService,
    private readonly providerFactory: ProviderFactoryService,
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
    const provider = this.configService.get<EmailProvider>(
      'EMAIL_PROVIDER',
      DEFAULTS.EMAIL_PROVIDER as EmailProvider,
    );

    // 2. Send email
    const providerResult = await this.send({
      to: payload.recipients,
      subject: payload.subject,
      html,
      from: this.configService.get<string>('EMAIL_FROM'),
      cc: payload.cc,
      bcc: payload.bcc,
    });

    // 3. Create log based on result
    if (!providerResult.success) {
      await this.emailRepository.createLog(
        emailId,
        'failed',
        'error',
        provider,
        undefined,
        { error: providerResult.error },
      );

      throw new RpcException({
        code: ErrorCode.PROVIDER_SENDING_FAILED,
        context: {
          operation: 'email-service-sendMail',
          emailId,
          error: providerResult.error,
        },
      });
    }

    
    await this.emailRepository.createLog(
      emailId,
      'sent',
      'info',
      provider,
      providerResult.emailId,
    );

    return {
      id: emailId,
      providerEmailId: providerResult.emailId,
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
  ): Promise<IEmailProviderResult> {
    const provider = this.providerFactory.getProvider();
    return provider.sendMail(options);
  }
}
