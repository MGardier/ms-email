import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  HealthIndicatorService,
  HealthIndicatorResult,
} from '@nestjs/terminus';
import * as amqplib from 'amqplib';
import { DEFAULTS } from '../constants/defaults';

@Injectable()
export class RabbitMQHealthIndicator {
  private readonly logger = new Logger(RabbitMQHealthIndicator.name);

  constructor(
    private readonly healthIndicatorService: HealthIndicatorService,
    private readonly configService: ConfigService,
  ) {}

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const indicator = this.healthIndicatorService.check(key);
    const url = this.configService.get<string>(
      'RABBITMQ_URL',
      DEFAULTS.RABBITMQ_URL,
    );
    const queue = this.configService.get<string>(
      'RABBITMQ_QUEUE',
      DEFAULTS.RABBITMQ_QUEUE,
    );

    try {
      const connection = await amqplib.connect(url);
      await connection.close();

      return indicator.up({
        message: 'RabbitMQ connection is healthy',
        queue,
      });
    } catch (error) {
      this.logger.error(
        `RabbitMQ health check failed: ${(error as Error).message}`,
      );
      return indicator.down({
        message: 'RabbitMQ connection failed',
        queue,
        error: (error as Error).message,
      });
    }
  }
}
