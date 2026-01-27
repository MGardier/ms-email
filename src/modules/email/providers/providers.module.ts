import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { MailpitProvider } from './mailpit.provider';
import { MailjetProvider } from './mailjet.provider';
import { ResendProvider } from './resend.provider';
import { ProviderFactoryService } from './provider-factory.service';

@Module({
  imports: [ConfigModule],
  providers: [
    MailpitProvider,
    MailjetProvider,
    ResendProvider,
    ProviderFactoryService,
  ],
  exports: [ProviderFactoryService],
})
export class ProvidersModule {}
