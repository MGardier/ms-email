import { z } from 'zod';

const ProductionProviderEnum = z.enum(['resend', 'mailjet']);
const TestProviderEnum = z.enum(['mailpit']);

export const envSchema = z
  .object({
    // Database
    DATABASE_URL: z.url({ error: 'You must provide DATABASE_URL.' }),

    // RabbitMQ
    RABBITMQ_URL: z.url({ error: 'You must provide RABBITMQ_URL.' }),
    RABBITMQ_QUEUE: z.string().default('email_queue'),
    RABBITMQ_PREFETCH: z.coerce.number().int().positive().default(1),

    // HTTP
    PORT: z.coerce.number().int().positive().default(3000),

    // Email General
    EMAIL_FROM: z.email({ error: 'You must provide a valid EMAIL_FROM.' }),

    // Providers (both required)
    EMAIL_PROVIDER_PRIMARY: ProductionProviderEnum,
    EMAIL_PROVIDER_SECONDARY: ProductionProviderEnum,

    // Test Mode
    EMAIL_USE_TEST_PROVIDER: z.enum(['true', 'false', '1', '0']).catch('false') .transform((val) => val === 'true' || val === '1'),
    EMAIL_TEST_PROVIDER: TestProviderEnum.default('mailpit'),

    // Retry Configuration
    EMAIL_RETRY_COUNT: z.coerce.number().int().min(0).max(10).default(3),
    EMAIL_RETRY_DELAY_MS: z.coerce
      .number()
      .int()
      .min(100)
      .max(30000)
      .default(1000),
    EMAIL_RETRY_BACKOFF_MULTIPLIER: z.coerce.number().min(1).max(5).default(2),

    // Provider credentials
    RESEND_API_KEY: z.string().optional(),
    MAILJET_API_KEY: z.string().optional(),
    MAILJET_API_SECRET: z.string().optional(),
    MAILPIT_HOST: z.string().default('localhost'),
    MAILPIT_PORT: z.coerce.number().int().positive().default(1025),
  })
  .superRefine((data, ctx) => {
    // Validation: primary and secondary must be different
    if (data.EMAIL_PROVIDER_PRIMARY === data.EMAIL_PROVIDER_SECONDARY) {
      ctx.addIssue({
        code: 'custom',
        message:
          'EMAIL_PROVIDER_PRIMARY and EMAIL_PROVIDER_SECONDARY must be different',
        path: ['EMAIL_PROVIDER_SECONDARY'],
      });
    }

    // Validation: Resend credentials required if used (and not in test mode)
    if (!data.EMAIL_USE_TEST_PROVIDER) {
      const usesResend =
        data.EMAIL_PROVIDER_PRIMARY === 'resend' ||
        data.EMAIL_PROVIDER_SECONDARY === 'resend';

      if (usesResend && !data.RESEND_API_KEY) {
        ctx.addIssue({
          code: 'custom',
          message:
            'RESEND_API_KEY is required when Resend is configured as a provider',
          path: ['RESEND_API_KEY'],
        });
      }

      // Validation: Mailjet credentials required if used (and not in test mode)
      const usesMailjet =
        data.EMAIL_PROVIDER_PRIMARY === 'mailjet' ||
        data.EMAIL_PROVIDER_SECONDARY === 'mailjet';

      if (usesMailjet && !data.MAILJET_API_KEY) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            'MAILJET_API_KEY is required when Mailjet is configured as a provider',
          path: ['MAILJET_API_KEY'],
        });
      }

      if (usesMailjet && !data.MAILJET_API_SECRET) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            'MAILJET_API_SECRET is required when Mailjet is configured as a provider',
          path: ['MAILJET_API_SECRET'],
        });
      }
    }
  });

export type EnvConfig = z.infer<typeof envSchema>;
