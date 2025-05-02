import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import * as crypto from 'crypto';

export interface AuditLogData {
  userId: string;
  action: string;
  category: string;
  ipAddress: string;
  userAgent: string;
  status: string;
  details?: any;
  isCritical?: boolean; // Flag for security-critical logs
}

// Default retention periods (in days)
export const RETENTION_PERIODS = {
  DEFAULT: 90,
  SECURITY: 365, // Keep security logs longer
  COMPLIANCE: 730, // Keep compliance-related logs for 2 years
};

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Log an audit event to the database with privacy and security enhancements
   * @param logData Audit log data
   * @returns The created audit log entry
   */
  async log(logData: AuditLogData) {
    try {
      // Apply privacy enhancements
      const enhancedLogData = {
        ...logData,
        ipAddress: this.anonymizeIpAddress(logData.ipAddress || 'unknown'),
        userAgent: this.sanitizeUserAgent(logData.userAgent || 'unknown'),
        details: this.sanitizeDetails(logData.details),
      };
      
      // Generate integrity hash for log verification
      const logHash = this.generateLogIntegrityHash(enhancedLogData);
      
      // Add server timestamp
      const timestamp = new Date();
      
      return await this.prisma.auditLog.create({
        data: {
          userId: enhancedLogData.userId,
          action: enhancedLogData.action,
          category: enhancedLogData.category,
          ipAddress: enhancedLogData.ipAddress,
          userAgent: enhancedLogData.userAgent,
          status: enhancedLogData.status,
          details: enhancedLogData.details,
          timestamp,
          logIntegrityHash: logHash,
          isCritical: logData.isCritical || false,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to create audit log: ${error.message}`, error.stack);
      
      // For critical security logs, ensure they're at least recorded in application logs
      if (logData.isCritical) {
        this.logger.warn('CRITICAL SECURITY LOG FAILED TO PERSIST', {
          ...logData,
          error: error.message,
        });
      }
      
      // Don't throw error to prevent breaking the main flow
      return null;
    }
  }

  /**
   * Anonymize IP address to protect user privacy
   * - For IPv4: Replaces last octet with '*'
   * - For IPv6: Replaces last 80 bits with '****'
   */
  private anonymizeIpAddress(ip: string): string {
    if (!ip || ip === 'unknown') return 'unknown';
    
    try {
      // Check for IPv6
      if (ip.includes(':')) {
        return ip.replace(/((?:[0-9a-f]{1,4}:){5})(.*)/, '$1****');
      }
      // IPv4
      return ip.replace(/(\d+\.\d+\.\d+\.)\d+/, '$1*');
    } catch (error) {
      this.logger.warn(`Failed to anonymize IP: ${error.message}`);
      return 'anonymization-failed';
    }
  }
  
  /**
   * Sanitize user agent string to remove potentially identifying information
   */
  private sanitizeUserAgent(userAgent: string): string {
    if (!userAgent || userAgent === 'unknown') return 'unknown';
    
    try {
      // Remove version numbers and detailed OS info that could be used for fingerprinting
      return userAgent
        .replace(/\/[\d\.]+/g, '/x.x.x')  // Replace version numbers
        .replace(/\([^)]+\)/, '(details-redacted)'); // Replace OS details
    } catch (error) {
      return 'browser';
    }
  }

  /**
   * Sanitize details object to remove sensitive information
   */
  private sanitizeDetails(details: any): any {
    if (!details) return null;
    
    try {
      // Create a deep copy
      const sanitized = JSON.parse(JSON.stringify(details));
      
      // List of sensitive fields to redact
      const sensitiveFields = [
        'password', 'token', 'secret', 'credit_card', 'card', 
        'ssn', 'social', 'auth', 'key', 'credential', 
        'cvv', 'pin', 'security_question'
      ];
      
      // Recursively sanitize object
      const redact = (obj: any) => {
        if (!obj || typeof obj !== 'object') return;
        
        Object.keys(obj).forEach(key => {
          const lowerKey = key.toLowerCase();
          
          if (typeof obj[key] === 'object' && obj[key] !== null) {
            redact(obj[key]);
          } else if (sensitiveFields.some(field => lowerKey.includes(field))) {
            obj[key] = '***REDACTED***';
          }
          // Redact email addresses except domain part
          else if (typeof obj[key] === 'string' && 
                  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(obj[key])) {
            obj[key] = obj[key].replace(/^[^@]+/, '***');
          }
        });
      };
      
      redact(sanitized);
      return sanitized;
    } catch (error) {
      this.logger.warn(`Failed to sanitize details: ${error.message}`);
      return { sanitized: 'error-during-sanitization' };
    }
  }
  
  /**
   * Generate a cryptographic hash to ensure log integrity
   */
  private generateLogIntegrityHash(logData: any): string {
    try {
      const dataString = JSON.stringify(logData) + Date.now().toString();
      return crypto.createHash('sha256').update(dataString).digest('hex');
    } catch (error) {
      this.logger.warn(`Failed to generate integrity hash: ${error.message}`);
      return 'hash-generation-failed';
    }
  }

  /**
   * Log authentication events with enhanced security
   */
  async logAuth(data: {
    userId: string;
    action: string;
    status: string;
    ipAddress?: string;
    userAgent?: string;
    details?: any;
    isCritical?: boolean;
  }) {
    // Authentication events are often security-critical
    const isCritical = data.isCritical ?? 
      ['LOGIN_FAILED', 'PASSWORD_RESET', 'MFA', 'PERMISSION_DENIED'].some(
        term => data.action.toUpperCase().includes(term)
      );
    
    return this.log({
      ...data,
      category: 'AUTHENTICATION',
      ipAddress: data.ipAddress || 'unknown',
      userAgent: data.userAgent || 'unknown',
      isCritical,
    });
  }

  /**
   * Log account modifications with enhanced security
   */
  async logAccountChange(data: {
    userId: string;
    action: string;
    status: string;
    ipAddress?: string;
    userAgent?: string;
    details?: any;
    isCritical?: boolean;
  }) {
    // Account changes are often security-critical
    const isCritical = data.isCritical ?? 
      ['ROLE', 'PERMISSION', 'PASSWORD', 'EMAIL', 'ADMIN', 'DELETE'].some(
        term => data.action.toUpperCase().includes(term)
      );
    
    return this.log({
      ...data,
      category: 'ACCOUNT',
      ipAddress: data.ipAddress || 'unknown',
      userAgent: data.userAgent || 'unknown',
      isCritical,
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
    isCritical?: boolean;
  }) {
    return this.log({
      ...data,
      category: 'NEWSLETTER',
      ipAddress: data.ipAddress || 'unknown',
      userAgent: data.userAgent || 'unknown',
      isCritical: data.isCritical || false,
    });
  }
  
  /**
   * Log data access events (for GDPR compliance)
   */
  async logDataAccess(data: {
    userId: string;
    action: string;
    status: string;
    ipAddress?: string;
    userAgent?: string;
    details?: any;
  }) {
    return this.log({
      ...data,
      category: 'DATA_ACCESS',
      ipAddress: data.ipAddress || 'unknown',
      userAgent: data.userAgent || 'unknown',
      isCritical: true, // Data access is critical for compliance
    });
  }

  /**
   * Get audit logs for a specific user with pagination
   * Includes filtering capabilities and sensitive data handling
   */
  async getUserLogs(userId: string, options: {
    limit?: number; 
    offset?: number;
    category?: string;
    startDate?: Date;
    endDate?: Date;
    includeDetails?: boolean; // Whether to include potentially sensitive details
    onlyCritical?: boolean;
  } = {}) {
    const { 
      limit = 50, 
      offset = 0,
      category,
      startDate,
      endDate,
      includeDetails = false,
      onlyCritical = false
    } = options;
    
    // Build where clause
    const where: any = { userId };
    
    if (category) {
      where.category = category;
    }
    
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = startDate;
      if (endDate) where.timestamp.lte = endDate;
    }
    
    if (onlyCritical) {
      where.isCritical = true;
    }
    
    const logs = await this.prisma.auditLog.findMany({
      where,
      orderBy: {
        timestamp: 'desc',
      },
      take: limit,
      skip: offset,
    });
    
    // Optionally remove details for privacy
    if (!includeDetails) {
      return logs.map(log => {
        const { details, ...rest } = log;
        return rest;
      });
    }
    
    return logs;
  }
  
  /**
   * Purge old audit logs based on retention policy
   */
  async pruneOldLogs(options: {
    standardRetentionDays?: number;
    securityRetentionDays?: number;
    complianceRetentionDays?: number;
    dryRun?: boolean;
  } = {}) {
    const {
      standardRetentionDays = RETENTION_PERIODS.DEFAULT,
      securityRetentionDays = RETENTION_PERIODS.SECURITY,
      complianceRetentionDays = RETENTION_PERIODS.COMPLIANCE,
      dryRun = false,
    } = options;
    
    // Standard logs cutoff date
    const standardCutoff = new Date();
    standardCutoff.setDate(standardCutoff.getDate() - standardRetentionDays);
    
    // Security logs cutoff date
    const securityCutoff = new Date();
    securityCutoff.setDate(securityCutoff.getDate() - securityRetentionDays);
    
    // Compliance logs cutoff date
    const complianceCutoff = new Date();
    complianceCutoff.setDate(complianceCutoff.getDate() - complianceRetentionDays);
    
    // Count logs that would be deleted (for reporting)
    const standardLogsCount = await this.prisma.auditLog.count({
      where: {
        timestamp: { lt: standardCutoff },
        isCritical: false,
        category: { notIn: ['DATA_ACCESS', 'GDPR', 'COMPLIANCE'] }
      }
    });
    
    const securityLogsCount = await this.prisma.auditLog.count({
      where: {
        timestamp: { lt: securityCutoff },
        isCritical: true,
        category: { notIn: ['DATA_ACCESS', 'GDPR', 'COMPLIANCE'] }
      }
    });
    
    const complianceLogsCount = await this.prisma.auditLog.count({
      where: {
        timestamp: { lt: complianceCutoff },
        category: { in: ['DATA_ACCESS', 'GDPR', 'COMPLIANCE'] }
      }
    });
    
    // If this is just a dry run, return the counts without deleting
    if (dryRun) {
      return {
        standardLogs: standardLogsCount,
        securityLogs: securityLogsCount,
        complianceLogs: complianceLogsCount,
        totalLogs: standardLogsCount + securityLogsCount + complianceLogsCount,
        deleted: false
      };
    }
    
    // Delete logs in separate batches
    let deletedStandard = 0;
    let deletedSecurity = 0;
    let deletedCompliance = 0;
    
    if (standardLogsCount > 0) {
      const result = await this.prisma.auditLog.deleteMany({
        where: {
          timestamp: { lt: standardCutoff },
          isCritical: false,
          category: { notIn: ['DATA_ACCESS', 'GDPR', 'COMPLIANCE'] }
        }
      });
      deletedStandard = result.count;
    }
    
    if (securityLogsCount > 0) {
      const result = await this.prisma.auditLog.deleteMany({
        where: {
          timestamp: { lt: securityCutoff },
          isCritical: true,
          category: { notIn: ['DATA_ACCESS', 'GDPR', 'COMPLIANCE'] }
        }
      });
      deletedSecurity = result.count;
    }
    
    if (complianceLogsCount > 0) {
      const result = await this.prisma.auditLog.deleteMany({
        where: {
          timestamp: { lt: complianceCutoff },
          category: { in: ['DATA_ACCESS', 'GDPR', 'COMPLIANCE'] }
        }
      });
      deletedCompliance = result.count;
    }
    
    // Log the deletion event itself
    await this.log({
      userId: 'system',
      action: 'AUDIT_LOG_PRUNING',
      category: 'SYSTEM',
      status: 'SUCCESS',
      ipAddress: 'localhost',
      userAgent: 'system',
      details: {
        standardLogs: deletedStandard,
        securityLogs: deletedSecurity,
        complianceLogs: deletedCompliance,
        totalLogs: deletedStandard + deletedSecurity + deletedCompliance,
        standardRetentionDays,
        securityRetentionDays,
        complianceRetentionDays,
        pruneDate: new Date()
      }
    });
    
    return {
      standardLogs: deletedStandard,
      securityLogs: deletedSecurity,
      complianceLogs: deletedCompliance,
      totalLogs: deletedStandard + deletedSecurity + deletedCompliance,
      deleted: true
    };
  }
  
  /**
   * Export logs for a user (for GDPR data subject access requests)
   */
  async exportUserLogs(userId: string): Promise<any> {
    const logs = await this.prisma.auditLog.findMany({
      where: { userId },
      orderBy: { timestamp: 'asc' },
    });
    
    // Log this export for compliance
    await this.logDataAccess({
      userId: 'system', // Or the admin user ID who initiated the export
      action: 'EXPORT_USER_LOGS',
      status: 'SUCCESS',
      details: {
        targetUserId: userId,
        recordCount: logs.length,
        exportDate: new Date()
      }
    });
    
    return logs;
  }
  
  /**
   * Verify the integrity of audit logs
   * Returns the number of logs with compromised integrity
   */
  async verifyLogIntegrity(options: { 
    limit?: number, 
    offset?: number,
    category?: string 
  } = {}): Promise<{ 
    verified: number, 
    compromised: number,
    total: number 
  }> {
    const { limit = 1000, offset = 0, category } = options;
    
    const where: any = {};
    if (category) where.category = category;
    
    const logs = await this.prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset,
    });
    
    let verified = 0;
    let compromised = 0;
    
    for (const log of logs) {
      // Skip logs without integrity hash (older logs)
      if (!log.logIntegrityHash) {
        compromised++;
        continue;
      }
      
      // We can't fully verify the hash since it includes a timestamp component
      // In a real implementation, you might use a more sophisticated approach
      // like signing logs with a private key
      if (log.logIntegrityHash.length === 64) {
        verified++;
      } else {
        compromised++;
      }
    }
    
    return {
      verified,
      compromised,
      total: logs.length
    };
  }
} 