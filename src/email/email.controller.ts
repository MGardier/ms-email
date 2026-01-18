import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { EmailService } from './email.service';
import { DeleteEmailDto } from './dto/delete-email.dto';
import { SendEmailDto } from './dto/send-email-dto';

@Controller()
export class EmailController {
  private readonly logger = new Logger(EmailController.name);

  constructor(private readonly emailService: EmailService) {}

  @MessagePattern('email.send')
  async emailSend(@Payload() payload: SendEmailDto) {
    const response = await this.emailService.sendMail(payload);
    this.logger.log(`Email sent: ${JSON.stringify(response)}`);
    return { from: 'email.send', paramsValue: response, status: 'ok' };
  }

  @MessagePattern('email.delete')
  async deleteEmail(@Payload() payload: DeleteEmailDto) {
    return this.emailService.delete(payload.id);
  }
}
