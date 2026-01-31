// Production providers 
export const PRODUCTION_PROVIDERS = {
  RESEND: 'resend',
  MAILJET: 'mailjet',
} as const;

// Test providers 
export const TEST_PROVIDERS = {
  MAILPIT: 'mailpit',
} as const;

// Combined 
export const EMAIL_PROVIDERS = {
  ...PRODUCTION_PROVIDERS,
  ...TEST_PROVIDERS,
} as const;



export type ProductionProviderType =
  (typeof PRODUCTION_PROVIDERS)[keyof typeof PRODUCTION_PROVIDERS];

export type TestProviderType =
  (typeof TEST_PROVIDERS)[keyof typeof TEST_PROVIDERS];

export type EmailProviderType =
  (typeof EMAIL_PROVIDERS)[keyof typeof EMAIL_PROVIDERS];
