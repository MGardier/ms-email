import { Injectable, Logger } from '@nestjs/common';

import { RpcException } from '@nestjs/microservices';
import { EnumErrorCode } from 'src/enums/error-codes.enum';
import { ISendMailOptions, MailerService } from '@nestjs-modules/mailer';

import { EmailRepository } from './email.repository';
import { email, EmailStatus } from '@prisma/client';
import { SendEmailDto } from './dto/send-email-dto';
import { TemplateService } from '../template/template.service';

@Injectable()
export class EmailService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly emailRepository: EmailRepository,
    private readonly templateService: TemplateService,
  ) {}
  private readonly logger = new Logger(EmailService.name);

  /** Responsability : manage all step for sending an email */
  async sendMail(
    payload: SendEmailDto,
  ): Promise<Pick<email, 'id' | 'gatewayEmailId'>> {
    const path = await this.templateService.getPathIfExist(
      payload.templatePath,
    );
    const email = await this.emailRepository.create(payload, ['id']);

    const data = await this.__formatMailData(payload, path);
    //this.logger.log(`\n Sending email to ${payload.receivers.join(', ')} \n`);
    await this.__send(data);
    //this.logger.log(`\n Email sent successfully, ID: ${email.id} \n`);

    return await this.emailRepository.update(
      email.id,
      { status: EmailStatus.SEND, sendAt: new Date() },
      ['id', 'gatewayEmailId'],
    );
  }

  /** Responsability : call repository to remove an email */
  async delete(id: number) {
    return await this.emailRepository.delete(id);
  }

  /************************* PRIVATE FUNCTIONS  ************************************************************/

  /** Responsability : send email with NestJs Mailer */
  private __send = async (data: ISendMailOptions): Promise<boolean> => {
    try {
      return await this.mailerService.sendMail(data);
    } catch (error) {
      if (error.code === 'EAUTH')
        throw new RpcException({
          code: EnumErrorCode.NESTJSMAILER_AUTHENTIFICATION_FAILED,
          context: {
            operation: 'email-service-send',
            host: process.env.MAILER_HOST,
            sender: process.env.MAILER_SENDER,
          },
        });

      throw new RpcException({
        code: EnumErrorCode.NESTJSMAILER_SENDING_FAILED,
        context: {
          operation: 'email-service-send',
          receivers: JSON.stringify(data.to),
          sender: data.from,
          path: data.template,
          variables: JSON.stringify(data.context),
        },
      });
    }
  };

  /** Responsability : format payload from controller to payload for NestJs Mailer */
  private async __formatMailData(
    payload: SendEmailDto,
    path: string,
  ): Promise<ISendMailOptions> {
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
