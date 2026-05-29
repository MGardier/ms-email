import { DEFAULTS } from 'src/common/constants/defaults';

/**
 * Builds the RabbitMQ connection URL from its individual components.
 * Single source of truth: credentials live only in RABBITMQ_USER /
 * RABBITMQ_PASSWORD, never duplicated inside a pre-assembled URL.
 */
export function buildRabbitmqUrl(env: NodeJS.ProcessEnv = process.env): string {
  const user = env.RABBITMQ_USER ?? '';
  const password = env.RABBITMQ_PASSWORD ?? '';
  const host = env.RABBITMQ_HOST ?? DEFAULTS.RABBITMQ_HOST;
  const port = env.RABBITMQ_PORT ?? DEFAULTS.RABBITMQ_PORT;

  return `amqp://${user}:${password}@${host}:${port}`;
}
