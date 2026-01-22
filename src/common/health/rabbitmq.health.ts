import { Injectable, Logger } from '@nestjs/common';
import {
  HealthIndicatorService,
  HealthIndicatorResult,
} from '@nestjs/terminus';
import * as amqplib from 'amqplib';

@Injectable()
export class RabbitMQHealthIndicator {
  private readonly logger = new Logger(RabbitMQHealthIndicator.name);

  constructor(
    private readonly healthIndicatorService: HealthIndicatorService,
  ) {}

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const indicator = this.healthIndicatorService.check(key);
    const url = process.env.RABBITMQ_URL || 'amqp://root:root@localhost:5672';
    const queue = process.env.RABBITMQ_QUEUE || 'email_queue';

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
