import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as crypto from 'crypto';

export interface AuditLogData {
  userId?: string; // Make userId optional
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
  private privateKey: string = '';
  private publicKey: string = '';

  constructor(private prisma: PrismaService) {
    this.initializeKeys();
  }

  private initializeKeys() {
    // Try to load keys from environment variables
    const envPrivateKey = process.env.AUDIT_PRIVATE_KEY;
    const envPublicKey = process.env.AUDIT_PUBLIC_KEY;

    // If keys are provided in environment, use them
    if (envPrivateKey && envPublicKey) {
      this.privateKey = envPrivateKey;
      this.publicKey = envPublicKey;
      this.logger.log(
        'Using audit log signing keys from environment variables',
      );
      return;
    }

    // If keys are not provided in environment, generate temporary ones
    // In production, keys should be managed securely and provided via environment
    this.logger.warn(
      'Audit log signing keys not found in environment. Generating temporary keys - NOT RECOMMENDED for production!',
    );

    const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      },
    });

    this.privateKey = privateKey;
    this.publicKey = publicKey;
  }

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

      // Check if userId is valid (not 'unknown' and not empty) before inserting into db
      if (!enhancedLogData.userId || enhancedLogData.userId === 'unknown') {
        // If userId is missing or 'unknown', just log to application logs
        this.logger.log(
          `Audit event without user: ${enhancedLogData.category}:${enhancedLogData.action} - ${enhancedLogData.status}`,
          { ...enhancedLogData, timestamp },
        );
        return null;
      }

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
      this.logger.error(
        `Failed to create audit log: ${error.message}`,
        error.stack,
      );

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
        .replace(/\/[\d.]+/g, '/x.x.x') // Replace version numbers
        .replace(/\([^)]+\)/, '(details-redacted)'); // Replace OS details
    } catch {
      // Ignore error and return generic value
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
        'password',
        'token',
        'secret',
        'credit_card',
        'card',
        'ssn',
        'social',
        'auth',
        'key',
        'credential',
        'cvv',
        'pin',
        'security_question',
      ];

      // Recursively sanitize object
      const redact = (obj: any) => {
        if (!obj || typeof obj !== 'object') return;

        Object.keys(obj).forEach((key) => {
          const lowerKey = key.toLowerCase();

          if (typeof obj[key] === 'object' && obj[key] !== null) {
            redact(obj[key]);
          } else if (
            sensitiveFields.some((field) => lowerKey.includes(field))
          ) {
            obj[key] = '***REDACTED***';
          }
          // Redact email addresses except domain part
          else if (
            typeof obj[key] === 'string' &&
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(obj[key])
          ) {
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
      // Create a deterministic string representation of the log data
      const logString = JSON.stringify(logData, Object.keys(logData).sort());

      // Create a signature using the private key
      const sign = crypto.createSign('SHA256');
      sign.update(logString);
      sign.end();
      const signature = sign.sign(this.privateKey, 'hex');

      return signature;
    } catch (error) {
      this.logger.error('Failed to generate log integrity hash', error);
      return crypto
        .createHash('sha256')
        .update(Date.now().toString())
        .digest('hex');
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
    const isCritical =
      data.isCritical ??
      ['LOGIN_FAILED', 'PASSWORD_RESET', 'MFA', 'PERMISSION_DENIED'].some(
        (term) => data.action.toUpperCase().includes(term),
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
    const isCritical =
      data.isCritical ??
      ['ROLE', 'PERMISSION', 'PASSWORD', 'EMAIL', 'ADMIN', 'DELETE'].some(
        (term) => data.action.toUpperCase().includes(term),
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
  async getUserLogs(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      category?: string;
      startDate?: Date;
      endDate?: Date;
      includeDetails?: boolean; // Whether to include potentially sensitive details
      onlyCritical?: boolean;
    } = {},
  ) {
    const {
      limit = 50,
      offset = 0,
      category,
      startDate,
      endDate,
      includeDetails = false,
      onlyCritical = false,
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
      return logs.map((log) => {
        // Destructure and omit the details field

        const { details, ...rest } = log;
        return rest;
      });
    }

    return logs;
  }

  /**
   * Purge old audit logs based on retention policy
   */
  async pruneOldLogs(
    options: {
      standardRetentionDays?: number;
      securityRetentionDays?: number;
      complianceRetentionDays?: number;
      dryRun?: boolean;
    } = {},
  ) {
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
    complianceCutoff.setDate(
      complianceCutoff.getDate() - complianceRetentionDays,
    );

    // Count logs that would be deleted (for reporting)
    const standardLogsCount = await this.prisma.auditLog.count({
      where: {
        timestamp: { lt: standardCutoff },
        isCritical: false,
        category: { notIn: ['DATA_ACCESS', 'GDPR', 'COMPLIANCE'] },
      },
    });

    const securityLogsCount = await this.prisma.auditLog.count({
      where: {
        timestamp: { lt: securityCutoff },
        isCritical: true,
        category: { notIn: ['DATA_ACCESS', 'GDPR', 'COMPLIANCE'] },
      },
    });

    const complianceLogsCount = await this.prisma.auditLog.count({
      where: {
        timestamp: { lt: complianceCutoff },
        category: { in: ['DATA_ACCESS', 'GDPR', 'COMPLIANCE'] },
      },
    });

    // If this is just a dry run, return the counts without deleting
    if (dryRun) {
      return {
        standardLogs: standardLogsCount,
        securityLogs: securityLogsCount,
        complianceLogs: complianceLogsCount,
        totalLogs: standardLogsCount + securityLogsCount + complianceLogsCount,
        deleted: false,
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
          category: { notIn: ['DATA_ACCESS', 'GDPR', 'COMPLIANCE'] },
        },
      });
      deletedStandard = result.count;
    }

    if (securityLogsCount > 0) {
      const result = await this.prisma.auditLog.deleteMany({
        where: {
          timestamp: { lt: securityCutoff },
          isCritical: true,
          category: { notIn: ['DATA_ACCESS', 'GDPR', 'COMPLIANCE'] },
        },
      });
      deletedSecurity = result.count;
    }

    if (complianceLogsCount > 0) {
      const result = await this.prisma.auditLog.deleteMany({
        where: {
          timestamp: { lt: complianceCutoff },
          category: { in: ['DATA_ACCESS', 'GDPR', 'COMPLIANCE'] },
        },
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
        pruneDate: new Date(),
      },
    });

    return {
      standardLogs: deletedStandard,
      securityLogs: deletedSecurity,
      complianceLogs: deletedCompliance,
      totalLogs: deletedStandard + deletedSecurity + deletedCompliance,
      deleted: true,
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
        exportDate: new Date(),
      },
    });

    return logs;
  }

  /**
   * Verify the integrity of audit logs
   * Returns the number of logs with compromised integrity
   */
  async verifyLogIntegrity(
    options: {
      limit?: number;
      offset?: number;
      category?: string;
    } = {},
  ): Promise<{
    verified: number;
    compromised: number;
    total: number;
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

      try {
        // Create a deterministic string representation of the log data without the hash
        const { logIntegrityHash, ...logDataWithoutHash } = log;
        const logString = JSON.stringify(
          logDataWithoutHash,
          Object.keys(logDataWithoutHash).sort(),
        );

        // Verify the signature using the public key
        const verify = crypto.createVerify('SHA256');
        verify.update(logString);
        verify.end();

        if (verify.verify(this.publicKey, logIntegrityHash, 'hex')) {
          verified++;
        } else {
          compromised++;
        }
      } catch (error) {
        this.logger.error(
          `Failed to verify log integrity for log ID ${log.id}`,
          error,
        );
        compromised++;
      }
    }

    return {
      verified,
      compromised,
      total: logs.length,
    };
  }
}
