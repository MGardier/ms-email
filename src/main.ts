import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { Logger, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { RabbitMqAckInterceptor } from './common/interceptors/rabbitmq-ack.interceptor';
import { DEFAULTS } from './common/constants/defaults';

async function bootstrap() {
  const logger = new Logger('NestApplication');

  // HTTP app for health checks
  const httpApp = await NestFactory.create(AppModule);
  httpApp.enableShutdownHooks();

  const port = process.env.PORT || DEFAULTS.HTTP_PORT;
  await httpApp.listen(port);

  logger.log(`HTTP app started on port ${port}`);
  logger.log(`Health check available at http://localhost:${port}/health`);

  // RabbitMQ microservice
  const microserviceApp =
    await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
      transport: Transport.RMQ,
      options: {
        urls: [process.env.RABBITMQ_URL || DEFAULTS.RABBITMQ_URL],
        queue: process.env.RABBITMQ_QUEUE || DEFAULTS.RABBITMQ_QUEUE,
        queueOptions: {
          durable: true,
        },
        prefetchCount: parseInt(process.env.RABBITMQ_PREFETCH || DEFAULTS.RABBITMQ_PREFETCH, 10),
        noAck: false,
      },
    });

  microserviceApp.useGlobalInterceptors(new RabbitMqAckInterceptor());
  microserviceApp.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  microserviceApp.useGlobalFilters(new AllExceptionsFilter());
  microserviceApp.enableShutdownHooks();

  await microserviceApp.listen();

  logger.log(
    `RabbitMQ microservice listening on queue: ${process.env.RABBITMQ_QUEUE || 'email_queue'}`,
  );
}

bootstrap();
