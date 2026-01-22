import { Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { ISendMailOptions, MailerService } from '@nestjs-modules/mailer';

import { ErrorCode } from 'src/common/enums/error-codes.enum';
import { EmailRepository } from './email.repository';
import { SendEmailDto } from './dto/send-email.dto';
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

  async sendMail(payload: SendEmailDto): Promise<IEmailSendResult> {
    // Get template path if templateVersionId is provided
    let templatePath: string | undefined;
    if (payload.templateVersionId) {
      templatePath = await this.templateService.getPathIfExist(
        payload.templateVersionId.toString(),
      );
    }

    // Create email record
    const email = await this.emailRepository.create(payload, ['id']);

    // Format and send email
    const data = this.formatMailData(payload, templatePath);
    this.logger.log(`Sending email to ${payload.recipients.join(', ')}`);
    await this.send(data);
    this.logger.log(`Email sent successfully, ID: ${email.id}`);

    return {
      id: email.id as string,
    };
  }

  async delete(id: string) {
    return await this.emailRepository.delete(id);
  }

  private async send(data: ISendMailOptions): Promise<boolean> {
    try {
      return await this.mailerService.sendMail(data);
    } catch (error) {
      const err = error as Error & { code?: string };
      if (err.code === 'EAUTH') {
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
    payload: SendEmailDto,
    templatePath?: string,
  ): ISendMailOptions {
    const mailOptions: ISendMailOptions = {
      to: payload.recipients,
      subject: payload.subject,
      from: process.env.MAILER_SENDER,
      cc: payload.cc,
      bcc: payload.bcc,
    };

    // Use HTML content if provided, otherwise use template
    if (payload.html) {
      mailOptions.html = payload.html;
    } else if (templatePath) {
      mailOptions.template = templatePath;
      mailOptions.context = payload.variables as Record<string, unknown>;
    }

    return mailOptions;
  }
}
