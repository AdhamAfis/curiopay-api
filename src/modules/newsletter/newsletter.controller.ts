import { Body, Controller, Delete, Get, Post, Put, UseGuards, Req, HttpCode } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiResponse, ApiHeader, ApiSecurity } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { NewsletterService } from './newsletter.service';
import { NewsletterPreferencesDto } from './dto/newsletter-preferences.dto';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { Request } from 'express';
import { ThrottlerGuard } from '@nestjs/throttler';

@ApiTags('Newsletter')
@Controller('newsletter')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class NewsletterController {
  constructor(private readonly newsletterService: NewsletterService) {}

  @Post('subscribe')
  @ApiOperation({ 
    summary: 'Subscribe to newsletter',
    description: 'Subscribe to the newsletter with optional preferences. If no preferences are provided, defaults to all types enabled.'
  })
  @ApiResponse({ status: 201, description: 'Successfully subscribed to newsletter' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async subscribe(
    @GetUser('id') userId: string,
    @Body() preferences?: NewsletterPreferencesDto,
  ) {
    return this.newsletterService.subscribe(userId, preferences);
  }

  @Delete('unsubscribe')
  @ApiOperation({ 
    summary: 'Unsubscribe from newsletter',
    description: 'Unsubscribe from all newsletter types and set unsubscribe timestamp'
  })
  @ApiResponse({ status: 200, description: 'Successfully unsubscribed from newsletter' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  async unsubscribe(@GetUser('id') userId: string) {
    return this.newsletterService.unsubscribe(userId);
  }

  @Put('preferences')
  @ApiOperation({ 
    summary: 'Update newsletter preferences',
    description: 'Update subscription preferences for different types of newsletters'
  })
  @ApiResponse({ status: 200, description: 'Successfully updated preferences' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  async updatePreferences(
    @GetUser('id') userId: string,
    @Body() preferences: NewsletterPreferencesDto,
  ) {
    return this.newsletterService.updatePreferences(userId, preferences);
  }

  @Get('status')
  @ApiOperation({ 
    summary: 'Get newsletter subscription status',
    description: 'Get current subscription status and preferences'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns subscription status and preferences',
    schema: {
      type: 'object',
      properties: {
        isSubscribed: { type: 'boolean' },
        preferences: {
          type: 'object',
          properties: {
            weeklyDigest: { type: 'boolean' },
            promotionalEmails: { type: 'boolean' },
            productUpdates: { type: 'boolean' }
          }
        },
        unsubscribedAt: { 
          type: 'string',
          format: 'date-time',
          nullable: true
        }
      }
    }
  })
  async getSubscriptionStatus(@GetUser('id') userId: string) {
    return this.newsletterService.getSubscriptionStatus(userId);
  }

  @Post('send')
  @UseGuards(ApiKeyGuard, ThrottlerGuard)
  @Roles(Role.SUPER_ADMIN)
  @HttpCode(200)
  @ApiOperation({
    summary: 'Send newsletter to all subscribers',
    description: 'Trigger sending of newsletter to all active subscribers. Super Admin only.'
  })
  @ApiSecurity('X-API-Key')
  @ApiResponse({ status: 200, description: 'Newsletter sending initiated' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid API key' })
  @ApiResponse({ status: 403, description: 'Forbidden - Super Admin only' })
  @ApiResponse({ status: 429, description: 'Too Many Requests' })
  async sendNewsletter(
    @GetUser('id') userId: string,
    @Req() request: Request,
  ) {
    const clientIp = request.ip || request.socket.remoteAddress || 'unknown';
    const userAgent = request.headers['user-agent'] || 'unknown';

    return this.newsletterService.sendNewsletterToAllSubscribers(
      userId,
      clientIp,
      userAgent,
    );
  }

  @Post('check-inactive')
  @UseGuards(ApiKeyGuard, ThrottlerGuard)
  @Roles(Role.SUPER_ADMIN)
  @HttpCode(200)
  @ApiOperation({
    summary: 'Check and notify inactive users',
    description: 'Send "we miss you" emails to users who have not logged in for over a month. Super Admin only.'
  })
  @ApiSecurity('X-API-Key')
  @ApiResponse({ status: 200, description: 'Inactive user check completed' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid API key' })
  @ApiResponse({ status: 403, description: 'Forbidden - Super Admin only' })
  @ApiResponse({ status: 429, description: 'Too Many Requests' })
  async checkInactiveUsers(
    @GetUser('id') userId: string,
    @Req() request: Request,
  ) {
    const clientIp = request.ip || request.socket.remoteAddress || 'unknown';
    const userAgent = request.headers['user-agent'] || 'unknown';

    return this.newsletterService.checkAndNotifyInactiveUsers(
      userId,
      clientIp,
      userAgent,
    );
  }
} 