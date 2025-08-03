import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { EmailService } from './email.service';

import { DeleteEmailDto } from './dto/delete-email.dto';
import { SendEmailDto } from './dto/send-email-dto';

// Mettre des test unitaire et test dto

// Pourvoir tester le ms sans le gateway

//Secondaire - ajoute un autre mailer et un retry qui change de mailer si échec sur le plan A

// Secondaire - rajouter un intercepteur et plus de logs

//Secondaire passer en postgresql ou mongodb
@Controller()
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  /** Responsability : call emailService to send an email */
  @MessagePattern('email.send')
  async emailSend(@Payload() payload: SendEmailDto) {
    const response = await this.emailService.sendMail(payload);
    console.log(response);
    return { from: 'email.send', paramsValue: response, status: 'ok' };
  }

  /** Responsability : call emailService to delete an email */
  @MessagePattern('email.delete')
  async deleteEmail(@Payload() payload: DeleteEmailDto) {
    return this.emailService.delete(payload.id);
  }
}
