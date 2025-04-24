import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { EncryptionService } from '../services/encryption.service';

// Define sensitive fields for each model
const SENSITIVE_FIELDS = {
  User: ['firstName', 'lastName'],
  UserAuth: [
    'password',
    'passwordSalt',
    'passwordResetToken',
    'mfaSecret',
    'backupCodes',
  ],
  UserContact: ['firstName', 'lastName', 'phone'],
  Expense: ['description', 'notes', 'voidReason'],
  Income: ['description', 'notes', 'voidReason'],
};

@Injectable()
export class EncryptionInterceptor implements NestInterceptor {
  constructor(private readonly encryptionService: EncryptionService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    // Encrypt request body if it contains sensitive data
    if (request.body) {
      const modelName = this.getModelName(request.path);
      if (modelName && SENSITIVE_FIELDS[modelName]) {
        request.body = this.encryptionService.encryptObject(
          request.body,
          SENSITIVE_FIELDS[modelName],
        );
      }
    }

    // Decrypt response data
    return next.handle().pipe(
      map((data) => {
        if (!data) return data;

        // Handle arrays
        if (Array.isArray(data)) {
          return data.map((item) => this.decryptItem(item));
        }

        // Handle single objects
        return this.decryptItem(data);
      }),
    );
  }

  private decryptItem(item: any): any {
    if (!item || typeof item !== 'object') return item;

    const modelName = this.getModelNameFromData(item);
    if (modelName && SENSITIVE_FIELDS[modelName]) {
      return this.encryptionService.decryptObject(
        item,
        SENSITIVE_FIELDS[modelName],
      );
    }

    return item;
  }

  private getModelName(path: string): string | null {
    // Extract model name from path (e.g., /api/users -> User)
    const pathSegments = path.split('/');
    const lastSegment = pathSegments[pathSegments.length - 1];

    // Map plural to singular and capitalize
    const modelMapping = {
      users: 'User',
      expenses: 'Expense',
      incomes: 'Income',
      contacts: 'UserContact',
      auth: 'UserAuth',
    };

    return modelMapping[lastSegment] || null;
  }

  private getModelNameFromData(data: any): string | null {
    // Try to determine model type from data structure
    if (data.email && data.role) return 'User';
    if (data.password && data.userId) return 'UserAuth';
    if (data.phone && data.userId) return 'UserContact';
    if (data.amount && data.categoryId && data.recurring) {
      return data.type === 'INCOME' ? 'Income' : 'Expense';
    }
    return null;
  }
}
