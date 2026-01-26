import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  PrismaHealthIndicator,
} from '@nestjs/terminus';

import { PrismaService } from '../../../prisma/prisma.service';
import { RabbitMQHealthIndicator } from './rabbitmq.health';
import { MailpitHealthIndicator } from './mailpit.health';

@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly rabbitMQHealth: RabbitMQHealthIndicator,
    private readonly mailpitHealth: MailpitHealthIndicator,
    private readonly prismaHealth: PrismaHealthIndicator,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.rabbitMQHealth.isHealthy('rabbitmq'),
      () => this.prismaHealth.pingCheck('database', this.prisma),
      () => this.mailpitHealth.isHealthy('mailpit'),
    ]);
  }

  @Get('rabbitmq')
  @HealthCheck()
  checkRabbitMQ() {
    return this.health.check([() => this.rabbitMQHealth.isHealthy('rabbitmq')]);
  }

  @Get('database')
  @HealthCheck()
  checkDatabase() {
    return this.health.check([
      () => this.prismaHealth.pingCheck('database', this.prisma),
    ]);
  }

  @Get('mailpit')
  @HealthCheck()
  checkMailpit() {
    return this.health.check([() => this.mailpitHealth.isHealthy('mailpit')]);
  }
}
