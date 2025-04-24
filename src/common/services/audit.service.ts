import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async logNewsletterOperation(data: {
    userId: string;
    action: 'SEND_NEWSLETTER' | 'CHECK_INACTIVE';
    ipAddress: string;
    userAgent: string;
    status: 'SUCCESS' | 'FAILURE';
    details?: Record<string, any>;
  }) {
    return this.prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        status: data.status,
        details: data.details,
        category: 'NEWSLETTER',
        timestamp: new Date(),
      },
    });
  }
} 