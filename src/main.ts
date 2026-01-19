import { NestFactory } from '@nestjs/core';
import {
  MicroserviceOptions,
  RpcException,
  Transport,
} from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';

import { AppModule } from './app.module';
import { ErrorCode } from 'src/common/enums/error-codes.enum';
import { RpcExceptionFilter } from 'src/common/exceptions/rpc-exception.filter';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.NATS,
      options: {
        inheritAppConfig: true,
        servers: [process.env.NATS_URL],

        queue: 'email-service',
        maxReconnectAttempts: 10,
        reconnectTimeWait: 1000,
        debug: true,
        verbose: true,
        noResponders: true,
      },
    },
  );
  app.useGlobalFilters(new RpcExceptionFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors) => {
        const result = {
          code: ErrorCode.INVALID_PAYLOAD,
          errors: errors.map((error) => ({
            property: error.property,
            constraintsViolations: error.constraints,
            valueNotValid: error.value || 'undefined',
          })),
        };
        return new RpcException(result);
      },
    }),
  );
  await app.listen();
}
bootstrap();
