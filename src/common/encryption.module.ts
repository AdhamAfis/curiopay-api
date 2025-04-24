import { Module, Global } from '@nestjs/common';
import { EncryptionService } from './services/encryption.service';
import { EncryptionInterceptor } from './interceptors/encryption.interceptor';

@Global()
@Module({
  providers: [EncryptionService, EncryptionInterceptor],
  exports: [EncryptionService, EncryptionInterceptor],
})
export class EncryptionModule {}
