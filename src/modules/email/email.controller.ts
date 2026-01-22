import { Controller, Logger } from '@nestjs/common';
import {
  Ctx,
  MessagePattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import { EmailService } from './email.service';
import { SendEmailDto } from './dto/send-email.dto';
import { DeleteEmailDto } from './dto/delete-email.dto';

@Controller()
export class EmailController {
  private readonly logger = new Logger(EmailController.name);

  constructor(private readonly emailService: EmailService) {}

  @MessagePattern('send_email')
  async handleSendEmail(
    @Payload() data: SendEmailDto,
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    this.logger.log('Received send_email message');

    const result = await this.emailService.sendMail(data);

    // Manual ACK - NestJS with noAck: false requires explicit acknowledgment
    channel.ack(originalMsg);
    this.logger.log('Email sent successfully');

    return {
      from: 'send_email',
      paramsValue: result,
      status: 'ok',
    };
  }

  @MessagePattern('delete_email')
  async handleDeleteEmail(
    @Payload() data: DeleteEmailDto,
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    this.logger.log(`Received delete_email message for id: ${data.id}`);

    const result = await this.emailService.delete(data.id);

    // Manual ACK - NestJS with noAck: false requires explicit acknowledgment
    channel.ack(originalMsg);
    this.logger.log('Email deleted successfully');

    return {
      from: 'delete_email',
      paramsValue: result,
      status: 'ok',
    };
  }
}
