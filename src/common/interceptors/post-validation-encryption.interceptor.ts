import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { EncryptionService } from '../services/encryption.service';

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
export class PostValidationEncryptionInterceptor implements NestInterceptor {
  constructor(private readonly encryptionService: EncryptionService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();

    // Only encrypt after validation has passed
    if (request.body) {
      const encryptedBody = await this.encryptSensitiveData(request.body);
      request.body = encryptedBody;
    }

    return next.handle();
  }

  private async encryptSensitiveData(data: any): Promise<any> {
    if (!data) return data;

    // Handle arrays
    if (Array.isArray(data)) {
      return Promise.all(data.map((item) => this.encryptSensitiveData(item)));
    }

    // Handle objects
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
