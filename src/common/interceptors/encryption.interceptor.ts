import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, lastValueFrom } from 'rxjs';
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
  'sensitiveField'
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
        if (!data) return data;

        // Check if the data needs encryption or decryption
        const needsDecryption = this.containsEncryptedData(data);
        const processedData = await this.processData(data, !needsDecryption);
        return processedData;
      })
    );
  }

  private containsEncryptedData(data: any): boolean {
    if (!data || typeof data !== 'object') return false;

    if (Array.isArray(data)) {
      return data.some(item => this.containsEncryptedData(item));
    }

    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'object' && value !== null) {
        if (this.containsEncryptedData(value)) return true;
      } else if (
        typeof value === 'string' && 
        (SENSITIVE_FIELDS.includes(key) || key.toLowerCase().includes('sensitive')) &&
        this.isEncrypted(value)
      ) {
        return true;
      }
    }

    return false;
  }

  private async processData(data: any, isEncrypting: boolean): Promise<any> {
    if (!data) return data;

    // Handle arrays
    if (Array.isArray(data)) {
      return Promise.all(data.map(item => this.processData(item, isEncrypting)));
    }

    // Handle objects
    if (typeof data === 'object') {
      const processed = { ...data };
      for (const [key, value] of Object.entries(data)) {
        if (typeof value === 'object' && value !== null) {
          processed[key] = await this.processData(value, isEncrypting);
        } else if (
          typeof value === 'string' && 
          (SENSITIVE_FIELDS.includes(key) || key.toLowerCase().includes('sensitive'))
        ) {
          if (isEncrypting && !this.isEncrypted(value)) {
            processed[key] = await this.encryptionService.encrypt(value);
          } else if (!isEncrypting && this.isEncrypted(value)) {
            processed[key] = await this.encryptionService.decrypt(value);
          } else {
            processed[key] = value;
          }
        }
      }
      return processed;
    }

    return data;
  }

  private async encryptSensitiveData(data: any): Promise<void> {
    const processed = await this.processData(data, true);
    if (typeof data === 'object') {
      Object.assign(data, processed);
    }
  }

  private isEncrypted(value: string): boolean {
    if (!value || typeof value !== 'string') return false;
    return value.startsWith('encrypted_');
  }
}
