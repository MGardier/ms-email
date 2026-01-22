import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  PrismaHealthIndicator,
} from '@nestjs/terminus';
import { RabbitMQHealthIndicator } from './rabbitmq.health';
import { PrismaService } from '../../../prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly rabbitMQHealth: RabbitMQHealthIndicator,
    private readonly prismaHealth: PrismaHealthIndicator,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.rabbitMQHealth.isHealthy('rabbitmq'),
      () => this.prismaHealth.pingCheck('database', this.prisma),
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
}
