export const EMAIL_PROVIDERS = {
  MAILPIT: 'mailpit',
  RESEND: 'resend',
  MAILJET: 'mailjet',
} as const;

export type EmailProviderType =
  (typeof EMAIL_PROVIDERS)[keyof typeof EMAIL_PROVIDERS];
