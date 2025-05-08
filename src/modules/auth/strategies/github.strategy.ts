import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, StrategyOptions } from 'passport-github2';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { User } from '../interfaces/user.interface';

@Injectable()
export class GitHubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    const options: StrategyOptions = {
      clientID: configService.get<string>('GITHUB_CLIENT_ID') || '',
      clientSecret: configService.get<string>('GITHUB_CLIENT_SECRET') || '',
      callbackURL: configService.get<string>('GITHUB_CALLBACK_URL') || '',
      scope: ['user:email'],
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
      // GitHub profile structure is different from Google
      const { id, displayName, username, emails, photos } = profile;
      
      if (!emails || emails.length === 0) {
        return done(new Error('Email not provided by GitHub'), false);
      }

      // Extract request object to get IP and user agent
      const req = this.getRequest();
      const ipAddress = req?.ip || 'unknown';
      const userAgent = req?.headers?.['user-agent'] || 'unknown';

      // Parse name - GitHub may provide full name in displayName
      let firstName = displayName || username || 'GitHub';
      let lastName = 'User';
      
      if (displayName && displayName.includes(' ')) {
        const nameParts = displayName.split(' ');
        firstName = nameParts[0];
        lastName = nameParts.slice(1).join(' ');
      }

      const user = await this.authService.validateOAuthUser({
        email: emails[0].value,
        firstName,
        lastName,
        provider: 'github',
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