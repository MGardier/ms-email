import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  MicroserviceOptions,
  RpcException,
  Transport,
} from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';

import { EnumErrorCode } from './enums/error-codes.enum';
import { RpcExceptionFilter } from './filters/rpc-exception.filter';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.NATS,
      options: {
        inheritAppConfig: true,
        servers: [process.env.NATS_URL],
        // ✅ Options supplémentaires
        queue: 'email-service', // Important pour load balancing
        maxReconnectAttempts: 10,
        reconnectTimeWait: 1000,
        debug: true,
        verbose: true,
        // ✅ Gestion des réponses
        noResponders: true,
      },
    },
  );
  // app.useGlobalInterceptors(new RpcExceptionInterceptor());
  app.useGlobalFilters(new RpcExceptionFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors) => {
        const result = {
          code: EnumErrorCode.INVALID_PAYLOAD,
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
