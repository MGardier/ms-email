import { Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { ISendMailOptions, MailerService } from '@nestjs-modules/mailer';
import { EmailStatus } from '@prisma/client';
import { ErrorCode } from 'src/common/enums/error-codes.enum';
import { EmailRepository } from './email.repository';
import { SendEmailRequestDto } from './dto/request/send-email.request.dto';
import { TemplateService } from 'src/modules/template/template.service';
import { IEmailSendResult } from './types';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private readonly mailerService: MailerService,
    private readonly emailRepository: EmailRepository,
    private readonly templateService: TemplateService,
  ) {}

  async sendMail(payload: SendEmailRequestDto): Promise<IEmailSendResult> {
    const path = await this.templateService.getPathIfExist(
      payload.templatePath,
    );
    const email = await this.emailRepository.create(payload, ['id']);

    const data = this.formatMailData(payload, path);
    this.logger.log(`Sending email to ${payload.receivers.join(', ')}`);
    await this.send(data);
    this.logger.log(`Email sent successfully, ID: ${email.id}`);

    const result = await this.emailRepository.update(
      email.id as number,
      { status: EmailStatus.SEND, sendAt: new Date() },
      ['id', 'gatewayEmailId'],
    );

    return {
      id: result.id as number,
      gatewayEmailId: result.gatewayEmailId ?? undefined,
    };
  }

  async delete(id: number) {
    return await this.emailRepository.delete(id);
  }

  private async send(data: ISendMailOptions): Promise<boolean> {
    try {
      return await this.mailerService.sendMail(data);
    } catch (error) {
      if (error.code === 'EAUTH') {
        throw new RpcException({
          code: ErrorCode.NESTJSMAILER_AUTHENTICATION_FAILED,
          context: {
            operation: 'email-service-send',
            host: process.env.MAILER_HOST,
            sender: process.env.MAILER_SENDER,
          },
        });
      }

      throw new RpcException({
        code: ErrorCode.NESTJSMAILER_SENDING_FAILED,
        context: {
          operation: 'email-service-send',
          receivers: JSON.stringify(data.to),
          sender: data.from,
          path: data.template,
          variables: JSON.stringify(data.context),
        },
      });
    }
  }

  private formatMailData(
    payload: SendEmailRequestDto,
    path: string,
  ): ISendMailOptions {
    return {
      to: payload.receivers,
      subject: payload.subject,
      sender: payload.sender || process.env.MAILER_SENDER,
      template: path,
      context: payload.templateVariables,
      cc: payload.cc,
      bcc: payload.bcc,
    };
  }
}
