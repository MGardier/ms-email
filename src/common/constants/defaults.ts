export const DEFAULTS = {
  RABBITMQ_URL: 'amqp://root:root@localhost:5672',
  RABBITMQ_QUEUE: 'email_queue',
  RABBITMQ_PREFETCH: "1" ,
  MAILPIT_HOST: 'localhost',
  MAILPIT_PORT: 1025,
  EMAIL_PROVIDER: 'mailpit',
  HTTP_PORT: 3000,
} as const;