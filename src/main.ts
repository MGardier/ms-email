import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { RpcExceptionFilter } from './common/filters/rpc-exception.filter';

async function bootstrap() {
  const logger = new Logger('NestApplication');

  // HTTP app for health checks
  const app = await NestFactory.create(AppModule);

  // RabbitMQ microservice
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL || 'amqp://root:root@localhost:5672'],
      queue: process.env.RABBITMQ_QUEUE || 'email_queue',
      queueOptions: {
        durable: true,
      },
      prefetchCount: parseInt(process.env.RABBITMQ_PREFETCH || '1', 10),
      noAck: false,
    },
  });

  // Global pipes and filters
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new RpcExceptionFilter());

  app.enableShutdownHooks();

  await app.startAllMicroservices();

  const port = process.env.PORT || 3000;
  await app.listen(port);

  logger.log(`Email microservice started on port ${port}`);
  logger.log(`Health check available at http://localhost:${port}/health`);
  logger.log(
    `RabbitMQ consumer listening on queue: ${process.env.RABBITMQ_QUEUE || 'email_queue'}`,
  );
}

bootstrap();
