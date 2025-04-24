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
  'backupCodes'
];

@Injectable()
export class EncryptionInterceptor implements NestInterceptor {
  constructor(private readonly encryptionService: EncryptionService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    
    // Encrypt request body if it contains sensitive data
    if (request.body) {
      await this.encryptSensitiveData(request.body);
    }

    return next.handle().pipe(
      map(async (data) => {
        // Decrypt response data if it contains sensitive data
        if (data) {
          await this.decryptSensitiveData(data);
        }
        return data;
      })
    );
  }

  private async encryptSensitiveData(data: any): Promise<void> {
    if (!data || typeof data !== 'object') return;

    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'object' && value !== null) {
        await this.encryptSensitiveData(value);
      } else if (
        typeof value === 'string' &&
        SENSITIVE_FIELDS.includes(key) &&
        !this.isEncrypted(value)
      ) {
        data[key] = await this.encryptionService.encrypt(value);
      }
    }
  }

  private async decryptSensitiveData(data: any): Promise<void> {
    if (!data || typeof data !== 'object') return;

    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'object' && value !== null) {
        await this.decryptSensitiveData(value);
      } else if (
        typeof value === 'string' &&
        SENSITIVE_FIELDS.includes(key) &&
        this.isEncrypted(value)
      ) {
        data[key] = await this.encryptionService.decrypt(value);
      }
    }
  }

  private isEncrypted(value: string): boolean {
    try {
      const buffer = Buffer.from(value, 'base64');
      // Check if the string is base64 encoded and has the minimum length for our encryption format
      return buffer.toString('base64') === value && buffer.length >= 64;
    } catch {
      return false;
    }
  }
}
