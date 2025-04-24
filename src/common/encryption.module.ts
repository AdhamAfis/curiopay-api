import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EncryptionService } from './services/encryption.service';
import { EncryptionInterceptor } from './interceptors/encryption.interceptor';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [EncryptionService, EncryptionInterceptor],
  exports: [EncryptionService, EncryptionInterceptor],
})
export class EncryptionModule {}
