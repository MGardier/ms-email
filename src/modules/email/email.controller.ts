import { Controller, Logger } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';

import { EmailService } from './email.service';
import { SendEmailDto } from './dto/send-email.dto';
import { IEmailSendResult } from './types';

@Controller()
export class EmailController {
  private readonly logger = new Logger(EmailController.name);

  constructor(private readonly emailService: EmailService) {}

  @MessagePattern('send_email')
  async sendEmail(@Payload() data: SendEmailDto) {
    const result = await this.processSendEmail(data, 'send_email');

    return {
      from: 'send_email',
      paramsValue: result,
      status: 'ok',
    };
  }

  @EventPattern('send_email_async')
  async sendEmailAsync(@Payload() data: SendEmailDto): Promise<void> {
    try {
      await this.processSendEmail(data, 'send_email_async');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      this.logger.error(
        `[FAILED] send_email_async | recipients: ${data.recipients.join(', ')} | userId: ${data.userId} | origin: ${data.origin} | error: ${errorMessage}`,
      );
    }
  }

  private async processSendEmail(
    data: SendEmailDto,
    pattern: string,
  ): Promise<IEmailSendResult> {
    this.logger.log(
      `[RECEIVED] ${pattern} | recipients: ${data.recipients.join(', ')} | userId: ${data.userId} | origin: ${data.origin}`,
    );

    const result = await this.emailService.sendMail(data);

    this.logger.log(
      `[SUCCESS] Email sent | id: ${result.id} | messageId: ${result.providerEmailId || 'N/A'}`,
    );

    return result;
  }
}
