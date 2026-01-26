import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { EmailService } from './email.service';
import { SendEmailDto } from './dto/send-email.dto';

@Controller()
export class EmailController {
  private readonly logger = new Logger(EmailController.name);

  constructor(private readonly emailService: EmailService) {}

  @MessagePattern('send_email')
  async handleSendEmail(@Payload() data: SendEmailDto) {
    this.logger.log(
      `[RECEIVED] send_email | recipients: ${data.recipients.join(', ')} | userId: ${data.userId} | origin: ${data.origin}`,
    );

    const result = await this.emailService.sendMail(data);

    this.logger.log(
      `[SUCCESS] Email sent | id: ${result.id} | messageId: ${result.providerEmailId || 'N/A'}`,
    );

    return {
      from: 'send_email',
      paramsValue: result,
      status: 'ok',
    };
  }
}
