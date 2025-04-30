import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  
  constructor() {
    super({
      log:
        process.env.NODE_ENV === 'development'
          ? ['query', 'info', 'warn', 'error']
          : ['error'],
      // Connection pooling is managed through the DATABASE_URL
    });
  }

  async onModuleInit() {
    try {
      this.logger.log('Connecting to database...');
      await this.$connect();
      this.logger.log('Successfully connected to database');
      
      // Enable query performance logging in development
      if (process.env.NODE_ENV === 'development') {
        this.$use(async (params, next) => {
          const before = Date.now();
          const result = await next(params);
          const after = Date.now();
          const executionTime = after - before;
          
          if (executionTime > 500) { // Log slow queries (>500ms)
            this.logger.warn(
              `Slow query detected (${executionTime}ms): ${params.model}.${params.action}`
            );
          }
          
          return result;
        });
      }
    } catch (error) {
      this.logger.error('Failed to connect to database', error.stack);
      throw error;
    }
  }

  async onModuleDestroy() {
    this.logger.log('Disconnecting from database...');
    await this.$disconnect();
    this.logger.log('Successfully disconnected from database');
  }

  /**
   * Helper method for handling transactions
   * Uses Prisma.TransactionClient as the correct type for transaction context
   */
  async executeInTransaction<T>(
    callback: (prisma: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.$transaction(callback, {
      maxWait: 5000,  // Max time to wait for a transaction (ms)
      timeout: 10000   // Max time for transaction to complete (ms)
    });
  }
}
