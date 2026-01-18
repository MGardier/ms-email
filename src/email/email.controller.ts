import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { EmailService } from './email.service';

import { DeleteEmailDto } from './dto/delete-email.dto';
import { SendEmailDto } from './dto/send-email-dto';

@Controller()
export class EmailController {
  constructor(private readonly emailService: EmailService) {}


  @MessagePattern('email.send')
  async emailSend(@Payload() payload: SendEmailDto) {
    const response = await this.emailService.sendMail(payload);
    console.log(response);
    return { from: 'email.send', paramsValue: response, status: 'ok' };
  }

  @MessagePattern('email.delete')
  async deleteEmail(@Payload() payload: DeleteEmailDto) {
    return this.emailService.delete(payload.id);
  }
}
