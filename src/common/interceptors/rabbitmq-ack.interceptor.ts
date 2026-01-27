import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { RmqContext } from '@nestjs/microservices';
import { Observable, tap, catchError } from 'rxjs';

@Injectable()
export class RabbitMqAckInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RabbitMqAckInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    // Only handle RPC context (RabbitMQ messages)
    if (context.getType() !== 'rpc') {
      return next.handle();
    }

    const rmqContext = context.switchToRpc().getContext<RmqContext>();
    const channel = rmqContext.getChannelRef();
    const message = rmqContext.getMessage();

    return next.handle().pipe(
      tap(() => {
        // ACK on success
        channel.ack(message);
        this.logger.debug('[ACK] Message acknowledged successfully');
      }),
      catchError((error) => {
        // ACK on error (message processed, but failed - don't requeue)
        // Use NACK with requeue=false to send to dead-letter queue if configured
        channel.ack(message);
        this.logger.debug(
          '[ACK] Message acknowledged after error (will not retry)',
        );
        throw error;
      }),
    );
  }
}
