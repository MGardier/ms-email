import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  HealthIndicatorService,
  HealthIndicatorResult,
} from '@nestjs/terminus';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailpitHealthIndicator {
  private readonly logger = new Logger(MailpitHealthIndicator.name);

  constructor(
    private readonly healthIndicatorService: HealthIndicatorService,
    private readonly configService: ConfigService,
  ) {}

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const indicator = this.healthIndicatorService.check(key);
    const host = this.configService.get<string>('MAILPIT_HOST', 'localhost');
    const port = this.configService.get<number>('MAILPIT_PORT', 1025);

    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: false,
      });

      await transporter.verify();
      transporter.close();

      return indicator.up({
        message: 'Mailpit SMTP server is healthy',
        host,
        port,
      });
    } catch (error) {
      this.logger.error(
        `Mailpit health check failed: ${(error as Error).message}`,
      );
      return indicator.down({
        message: 'Mailpit SMTP server is not reachable',
        host,
        port,
        error: (error as Error).message,
      });
    }
  }
}
