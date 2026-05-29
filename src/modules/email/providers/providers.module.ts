import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { MailpitProvider } from './clients/mailpit.provider';
import { MailjetProvider } from './clients/mailjet.provider';
import { ResendProvider } from './clients/resend.provider';
import { ProviderFactoryService } from './services/provider-factory.service';
import { RetryService } from './services/retry.service';
import { ProviderOrchestratorService } from './services/provider-orchestrator.service';

@Module({
  imports: [ConfigModule],
  providers: [
    MailpitProvider,
    MailjetProvider,
    ResendProvider,
    ProviderFactoryService,
    RetryService,
    ProviderOrchestratorService,
  ],
  exports: [ProviderFactoryService, ProviderOrchestratorService],
})
export class ProvidersModule {}
