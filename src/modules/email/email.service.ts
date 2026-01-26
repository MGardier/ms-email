import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RpcException } from '@nestjs/microservices';

import { ErrorCode } from 'src/common/enums/error-codes.enum';
import { EmailRepository } from './email.repository';
import { SendEmailDto } from './dto/send-email.dto';
import { TemplateService } from 'src/modules/template/template.service';
import { ProviderFactoryService } from './providers/provider-factory.service';
import { IEmailSendResult } from './types';
import { IEmailProviderOptions } from './providers/email-provider.interface';
import { ITemplateVersion } from 'src/modules/template/types';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly emailRepository: EmailRepository,
    private readonly templateService: TemplateService,
    private readonly providerFactory: ProviderFactoryService,
  ) {}

  async sendMail(
    payload: SendEmailDto,
    templateVersion: ITemplateVersion,
  ): Promise<IEmailSendResult> {
    const html = await this.templateService.buildTemplate(
      payload,
      templateVersion,
    );

    const email = await this.emailRepository.create(payload, ['id']);

    const providerResult = await this.__send({
      to: payload.recipients,
      subject: payload.subject,
      html,
      from: this.configService.get<string>('EMAIL_FROM'),
      cc: payload.cc,
      bcc: payload.bcc,
    });

    if (!providerResult.success)
      throw new RpcException({
        code: ErrorCode.PROVIDER_SENDING_FAILED,
        context: {
          operation: 'email-service-sendMail',
          emailId: email.id,
          error: providerResult.error,
        },
      });

    return {
      id: email.id as string,
      providerEmailId: providerResult.emailId,
    };
  }

  /** PRIVATE METHOD */

  private async __send(options: IEmailProviderOptions) {
    const provider = this.providerFactory.getProvider();
    return provider.sendMail(options);
  }
}
