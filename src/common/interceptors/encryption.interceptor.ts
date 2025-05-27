import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { EncryptionService } from '../services/encryption.service';

// Define sensitive field patterns
const SENSITIVE_FIELDS = [
  'firstName',
  'lastName',
  'phone',
  'description',
  'notes',
  'voidReason',
  'password',
  'passwordSalt',
  'passwordResetToken',
  'mfaSecret',
  'backupCodes',
  'sensitiveField',
];

@Injectable()
export class EncryptionInterceptor implements NestInterceptor {
  constructor(private readonly encryptionService: EncryptionService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const isRegisterEndpoint = request.path === '/api/v1/auth/register';

    // For registration endpoint, let validation happen first
    if (!isRegisterEndpoint && request.body) {
      // Decrypt incoming sensitive data for non-registration endpoints
      await this.decryptSensitiveData(request.body);
    }

    return next.handle().pipe(
      map(async (data) => {
        if (!data) return data;

        // For all responses, encrypt sensitive data
        const processedData = await this.encryptSensitiveData(data);
        return processedData;
      }),
    );
  }

  private async decryptSensitiveData(data: any): Promise<void> {
    if (!data) return;

    if (Array.isArray(data)) {
      await Promise.all(data.map((item) => this.decryptSensitiveData(item)));
      return;
    }

    if (typeof data === 'object') {
      for (const [key, value] of Object.entries(data)) {
        if (typeof value === 'object' && value !== null) {
          await this.decryptSensitiveData(value);
        } else if (
          typeof value === 'string' &&
          (SENSITIVE_FIELDS.includes(key) ||
            key.toLowerCase().includes('sensitive')) &&
          this.isEncrypted(value)
        ) {
          data[key] = await this.encryptionService.decrypt(value);
        }
      }
    }
  }

  private async encryptSensitiveData(data: any): Promise<any> {
    if (!data) return data;

    if (Array.isArray(data)) {
      return Promise.all(data.map((item) => this.encryptSensitiveData(item)));
    }

    if (typeof data === 'object') {
      const processed = { ...data };
      for (const [key, value] of Object.entries(data)) {
        if (typeof value === 'object' && value !== null) {
          processed[key] = await this.encryptSensitiveData(value);
        } else if (
          typeof value === 'string' &&
          (SENSITIVE_FIELDS.includes(key) ||
            key.toLowerCase().includes('sensitive')) &&
          !this.isEncrypted(value)
        ) {
          processed[key] = await this.encryptionService.encrypt(value);
        }
      }
      return processed;
    }

    return data;
  }

  private isEncrypted(value: string): boolean {
    if (!value || typeof value !== 'string') return false;
    return value.startsWith('encrypted_');
  }
}
