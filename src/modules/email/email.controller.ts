import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { EmailService } from './email.service';
import { DeleteEmailRequestDto } from './dto/request/delete-email.request.dto';
import { SendEmailRequestDto } from './dto/request/send-email.request.dto';

@Controller()
export class EmailController {
  private readonly logger = new Logger(EmailController.name);

  constructor(private readonly emailService: EmailService) {}

  @MessagePattern('email.send')
  async emailSend(@Payload() payload: SendEmailRequestDto) {
    const response = await this.emailService.sendMail(payload);
    this.logger.log(`Email sent: ${JSON.stringify(response)}`);
    return { from: 'email.send', paramsValue: response, status: 'ok' };
  }

  @MessagePattern('email.delete')
  async deleteEmail(@Payload() payload: DeleteEmailRequestDto) {
    return this.emailService.delete(payload.id);
  }
}
