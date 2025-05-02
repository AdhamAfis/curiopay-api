import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, Profile, StrategyOptions } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { User } from '../interfaces/user.interface';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    const options: StrategyOptions = {
      clientID: configService.get<string>('GOOGLE_CLIENT_ID') || '',
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET') || '',
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL') || '',
      scope: ['email', 'profile'],
    };
    
    super(options);
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<any> {
    try {
      const { name, emails, photos } = profile;
      
      if (!emails || emails.length === 0) {
        return done(new Error('Email not provided by Google'), false);
      }

      const user = await this.authService.validateOAuthUser({
        email: emails[0].value,
        firstName: name?.givenName || 'Google',
        lastName: name?.familyName || 'User',
        provider: 'google',
        providerAccountId: profile.id,
        photoUrl: photos && photos.length > 0 ? photos[0].value : undefined,
      });

      return done(null, user as User);
    } catch (error) {
      return done(error, false);
    }
  }
} 