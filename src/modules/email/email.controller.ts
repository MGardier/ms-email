import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';

import { ErrorCode } from 'src/common/enums/error-codes.enum';
import { EmailService } from './email.service';
import { SendEmailDto } from './dto/send-email.dto';
import { TemplateService } from 'src/modules/template/template.service';
import { ITemplateVersion } from 'src/modules/template/types';

@Controller()
export class EmailController {
  private readonly logger = new Logger(EmailController.name);

  constructor(
    private readonly emailService: EmailService,
    private readonly templateService: TemplateService,
  ) {}

  
  @MessagePattern('send_email')
  async handleSendEmail(@Payload() data: SendEmailDto) {
    this.logger.log(
      `[RECEIVED] send_email | recipients: ${data.recipients.join(', ')} | subject: "${data.subject}" | origin: ${data.origin}`,
    );

    const templateVersion = await this.__validateTemplatePayload(data);
    const result = await this.emailService.sendMail(data, templateVersion);

    this.logger.log(
      `[SUCCESS] Email sent | id: ${result.id} | messageId: ${result.providerEmailId || 'N/A'}`,
    );

    return {
      from: 'send_email',
      paramsValue: result,
      status: 'ok',
    };
  }

  private async __validateTemplatePayload(
    data: SendEmailDto,
  ): Promise<ITemplateVersion> {
    const hasHtml = !!data.html;
    const hasTemplateId = !!data.templateVersionId;

    if (hasHtml && hasTemplateId) {
      throw new RpcException({
        code: ErrorCode.INVALID_PAYLOAD,
        context: {
          operation: 'email-controller-validatePayload',
          reason: 'Cannot provide both html and templateVersionId',
          recipients: data.recipients,
          subject: data.subject,
        },
      });
    }

    if (!hasHtml && !hasTemplateId) {
      throw new RpcException({
        code: ErrorCode.INVALID_PAYLOAD,
        context: {
          operation: 'email-controller-validatePayload',
          reason: 'Must provide either html or templateVersionId',
          recipients: data.recipients,
          subject: data.subject,
        },
      });
    }

    if (hasHtml) return this.templateService.getTemplateVersionBySlug('raw');
    else
      return this.templateService.getTemplateVersionById(
        data.templateVersionId,
      );
  }
}
