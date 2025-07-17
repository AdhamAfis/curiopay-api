/**
 * Microsoft OAuth Strategy - Commented out
 * 
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-microsoft';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { User } from '../interfaces/user.interface';

@Injectable()
export class MicrosoftStrategy extends PassportStrategy(Strategy, 'microsoft') {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    const options = {
      clientID: configService.get<string>('MICROSOFT_CLIENT_ID') || '',
      clientSecret: configService.get<string>('MICROSOFT_CLIENT_SECRET') || '',
      callbackURL: configService.get<string>('MICROSOFT_CALLBACK_URL') || '',
      scope: ['user.read', 'openid', 'profile', 'email'],
      tenant: 'common',
    };
    
    super(options);
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: Function,
  ): Promise<any> {
    try {
      const { id, displayName, name, emails, photos } = profile;
      
      if (!emails || emails.length === 0) {
        return done(new Error('Email not provided by Microsoft'), false);
      }

      // Extract request object to get IP and user agent
      const req = this.getRequest();
      const ipAddress = req?.ip || 'unknown';
      const userAgent = req?.headers?.['user-agent'] || 'unknown';

      // Microsoft profile typically has structured name data
      const firstName = name?.givenName || displayName || 'Microsoft';
      const lastName = name?.familyName || 'User';
      
      const user = await this.authService.validateOAuthUser({
        email: emails[0].value,
        firstName,
        lastName,
        provider: 'microsoft',
        providerAccountId: id,
        photoUrl: photos && photos.length > 0 ? photos[0].value : undefined,
      }, ipAddress, userAgent);

      return done(null, user as User);
    } catch (error) {
      return done(error, false);
    }
  }

  // Helper method to get request object from passport context
  private getRequest() {
    const context = this.getPassportExecutionContext();
    if (!context) return null;
    
    return context.switchToHttp().getRequest();
  }

  // This is implementation-dependent and might need to be adjusted
  private getPassportExecutionContext() {
    try {
      // @ts-ignore - accessing private property to get execution context
      return this._executionContext;
    } catch (e) {
      return null;
    }
  }
}
*/

// Export an empty class to satisfy imports
export class MicrosoftStrategy {}
