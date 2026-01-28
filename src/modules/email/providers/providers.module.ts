import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { MailpitProvider } from './mailpit.provider';
import { MailjetProvider } from './mailjet.provider';
import { ResendProvider } from './resend.provider';
import { ProviderFactoryService } from './provider-factory.service';
import { RetryService } from './retry.service';
import { ProviderOrchestratorService } from './provider-orchestrator.service';

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
