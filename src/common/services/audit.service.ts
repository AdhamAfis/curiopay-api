import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

export interface AuditLogData {
  userId: string;
  action: string;
  category: string;
  ipAddress: string;
  userAgent: string;
  status: string;
  details?: any;
}

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  /**
   * Log an audit event to the database
   * @param logData Audit log data
   * @returns The created audit log entry
   */
  async log(logData: AuditLogData) {
    try {
      return await this.prisma.auditLog.create({
        data: {
          userId: logData.userId,
          action: logData.action,
          category: logData.category,
          ipAddress: logData.ipAddress || 'unknown',
          userAgent: logData.userAgent || 'unknown',
          status: logData.status,
          details: logData.details || null,
          timestamp: new Date(),
        },
      });
    } catch (error) {
      console.error('Failed to create audit log:', error);
      // Don't throw error to prevent breaking the main flow
      return null;
    }
  }

  /**
   * Log authentication events
   */
  async logAuth(data: {
    userId: string;
    action: string;
    status: string;
    ipAddress?: string;
    userAgent?: string;
    details?: any;
  }) {
    return this.log({
      ...data,
      category: 'AUTHENTICATION',
      ipAddress: data.ipAddress || 'unknown',
      userAgent: data.userAgent || 'unknown',
    });
  }

  /**
   * Log account modifications
   */
  async logAccountChange(data: {
    userId: string;
    action: string;
    status: string;
    ipAddress?: string;
    userAgent?: string;
    details?: any;
  }) {
    return this.log({
      ...data,
      category: 'ACCOUNT',
      ipAddress: data.ipAddress || 'unknown',
      userAgent: data.userAgent || 'unknown',
    });
  }
  
  /**
   * Log newsletter operations
   */
  async logNewsletterOperation(data: {
    userId: string;
    action: 'SEND_NEWSLETTER' | 'CHECK_INACTIVE' | 'SUBSCRIBE' | 'UNSUBSCRIBE';
    status: 'SUCCESS' | 'FAILURE';
    ipAddress?: string;
    userAgent?: string;
    details?: Record<string, any>;
  }) {
    return this.log({
      ...data,
      category: 'NEWSLETTER',
      ipAddress: data.ipAddress || 'unknown',
      userAgent: data.userAgent || 'unknown',
    });
  }

  /**
   * Get audit logs for a specific user
   */
  async getUserLogs(userId: string, limit = 50, offset = 0) {
    return this.prisma.auditLog.findMany({
      where: {
        userId,
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: limit,
      skip: offset,
    });
  }
} 