export const DEFAULTS = {
  // RabbitMQ
  RABBITMQ_URL: 'amqp://root:root@localhost:5672',
  RABBITMQ_QUEUE: 'email_queue',
  RABBITMQ_PREFETCH: '1',

  // HTTP
  HTTP_PORT: 3000,

  // Mailpit (test provider)
  MAILPIT_HOST: 'localhost',
  MAILPIT_PORT: 1025,

  // Test mode
  EMAIL_USE_TEST_PROVIDER: false,
  EMAIL_TEST_PROVIDER: 'mailpit',

  // Retry configuration
  EMAIL_RETRY_COUNT: 3,
  EMAIL_RETRY_DELAY_MS: 1000,
  EMAIL_RETRY_BACKOFF_MULTIPLIER: 2,
  EMAIL_RETRY_MAX_DELAY_MS: 30000,
 
} as const;


