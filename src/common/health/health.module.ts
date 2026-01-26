import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';

import { PrismaModule } from '../../../prisma/prisma.module';
import { HealthController } from './health.controller';
import { RabbitMQHealthIndicator } from './rabbitmq.health';
import { MailpitHealthIndicator } from './mailpit.health';

@Module({
  imports: [TerminusModule, PrismaModule, ConfigModule],
  controllers: [HealthController],
  providers: [RabbitMQHealthIndicator, MailpitHealthIndicator],
})
export class HealthModule {}
