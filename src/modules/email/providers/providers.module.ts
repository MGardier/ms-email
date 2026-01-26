import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { MailpitProvider } from './mailpit.provider';
import { ProviderFactoryService } from './provider-factory.service';

@Module({
  imports: [ConfigModule],
  providers: [MailpitProvider, ProviderFactoryService],
  exports: [ProviderFactoryService],
})
export class ProvidersModule {}
