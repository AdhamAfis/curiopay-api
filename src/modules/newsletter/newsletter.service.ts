import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NewsletterPreferencesDto } from './dto/newsletter-preferences.dto';
import { EmailService } from '../../common/services/email.service';
import { AuditService } from '../../common/services/audit.service';
import { subMonths } from 'date-fns';

@Injectable()
export class NewsletterService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private auditService: AuditService,
  ) {}

  async subscribe(userId: string, preferences?: NewsletterPreferencesDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.newsletterSubscription.upsert({
      where: { userId },
      create: {
        userId,
        weeklyDigest: preferences?.weeklyDigest ?? true,
        promotionalEmails: preferences?.promotionalEmails ?? true,
        productUpdates: preferences?.productUpdates ?? true,
      },
      update: {
        weeklyDigest: preferences?.weeklyDigest ?? true,
        promotionalEmails: preferences?.promotionalEmails ?? true,
        productUpdates: preferences?.productUpdates ?? true,
        unsubscribedAt: null,
      },
    });
  }

  async unsubscribe(userId: string) {
    const subscription = await this.prisma.newsletterSubscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    return this.prisma.newsletterSubscription.update({
      where: { userId },
      data: {
        unsubscribedAt: new Date(),
        weeklyDigest: false,
        promotionalEmails: false,
        productUpdates: false,
      },
    });
  }

  async updatePreferences(
    userId: string,
    preferences: NewsletterPreferencesDto,
  ) {
    const subscription = await this.prisma.newsletterSubscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    return this.prisma.newsletterSubscription.update({
      where: { userId },
      data: {
        weeklyDigest: preferences.weeklyDigest,
        promotionalEmails: preferences.promotionalEmails,
        productUpdates: preferences.productUpdates,
        unsubscribedAt: null,
      },
    });
  }

  async getSubscriptionStatus(userId: string) {
    const subscription = await this.prisma.newsletterSubscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      return {
        isSubscribed: false,
        preferences: {
          weeklyDigest: false,
          promotionalEmails: false,
          productUpdates: false,
        },
      };
    }

    return {
      isSubscribed: !subscription.unsubscribedAt,
      preferences: {
        weeklyDigest: subscription.weeklyDigest,
        promotionalEmails: subscription.promotionalEmails,
        productUpdates: subscription.productUpdates,
      },
      unsubscribedAt: subscription.unsubscribedAt,
    };
  }

  async sendNewsletterToAllSubscribers(
    adminUserId: string,
    ipAddress: string,
    userAgent: string,
  ) {
    try {
      const activeSubscriptions =
        await this.prisma.newsletterSubscription.findMany({
          where: {
            unsubscribedAt: null,
            weeklyDigest: true,
          },
          include: {
            user: {
              select: {
                email: true,
                firstName: true,
              },
            },
          },
        });

      const results = await Promise.allSettled(
        activeSubscriptions.map((subscription) =>
          this.emailService.sendNewsletter(
            subscription.user.email,
            subscription.user.firstName,
          ),
        ),
      );

      const summary = {
        totalAttempted: results.length,
        succeeded: results.filter((r) => r.status === 'fulfilled').length,
        failed: results.filter((r) => r.status === 'rejected').length,
      };

      await this.auditService.logNewsletterOperation({
        userId: adminUserId,
        action: 'SEND_NEWSLETTER',
        ipAddress,
        userAgent,
        status: 'SUCCESS',
        details: summary,
      });

      return summary;
    } catch (error) {
      await this.auditService.logNewsletterOperation({
        userId: adminUserId,
        action: 'SEND_NEWSLETTER',
        ipAddress,
        userAgent,
        status: 'FAILURE',
        details: { error: error.message },
      });
      throw error;
    }
  }

  async checkAndNotifyInactiveUsers(
    adminUserId: string,
    ipAddress: string,
    userAgent: string,
  ) {
    try {
      const oneMonthAgo = subMonths(new Date(), 1);

      const inactiveUsers = await this.prisma.user.findMany({
        where: {
          lastLoginAt: {
            lt: oneMonthAgo,
          },
          newsletterSubscription: {
            promotionalEmails: true,
            unsubscribedAt: null,
          },
        },
        select: {
          id: true,
          email: true,
          firstName: true,
        },
      });

      const results = await Promise.allSettled(
        inactiveUsers.map((user) =>
          this.emailService.sendMissYouEmail(user.email, user.firstName),
        ),
      );

      const summary = {
        totalAttempted: results.length,
        succeeded: results.filter((r) => r.status === 'fulfilled').length,
        failed: results.filter((r) => r.status === 'rejected').length,
      };

      await this.auditService.logNewsletterOperation({
        userId: adminUserId,
        action: 'CHECK_INACTIVE',
        ipAddress,
        userAgent,
        status: 'SUCCESS',
        details: summary,
      });

      return summary;
    } catch (error) {
      await this.auditService.logNewsletterOperation({
        userId: adminUserId,
        action: 'CHECK_INACTIVE',
        ipAddress,
        userAgent,
        status: 'FAILURE',
        details: { error: error.message },
      });
      throw error;
    }
  }
}
