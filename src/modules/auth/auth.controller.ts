import { Controller, Post, Body, HttpCode, UseGuards, Get, UseInterceptors, Req, Res, Param } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RequestPasswordResetDto, ResetPasswordDto } from './dto/reset-password.dto';
import { EnableMfaDto, VerifyMfaDto, DisableMfaDto, CompleteLoginWithMfaDto } from './dto/mfa.dto';
import { VerifyEmailDto, RequestEmailVerificationDto } from './dto/verify-email.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { EncryptionInterceptor } from '../../common/interceptors/encryption.interceptor';
import { BaseController } from '../../common/base.controller';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { User } from './interfaces/user.interface';
import { LinkAccountDto } from './dto/link-account.dto';

@ApiTags('auth')
@Controller('auth')
@UseInterceptors(EncryptionInterceptor)
export class AuthController extends BaseController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {
    super();
  }

  @Public()
  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ 
    status: 200, 
    description: 'Login successful',
    schema: {
      type: 'object',
      properties: {
        accessToken: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          description: 'JWT token to be used for authenticated requests. Extended expiration if rememberMe is true.',
        },
        requireMfa: {
          type: 'boolean',
          example: 'false',
          description: 'Whether MFA verification is required to complete login'
        },
        tempToken: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1...',
          description: 'Temporary token to be used for MFA verification'
        },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto, @Req() req) {
    const ipAddress = req.ip || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    return this.authService.login(loginDto, ipAddress, userAgent);
  }

  @Public()
  @Post('login/mfa/complete')
  @HttpCode(200)
  @ApiOperation({ summary: 'Complete login with MFA verification' })
  @ApiResponse({ 
    status: 200, 
    description: 'MFA verification successful and login completed',
    schema: {
      type: 'object',
      properties: {
        accessToken: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          description: 'JWT token to be used for authenticated requests',
        },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid MFA code or token' })
  async completeLoginWithMfa(@Body() dto: CompleteLoginWithMfaDto, @Req() req) {
    const ipAddress = req.ip || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    return this.authService.completeLoginWithMfa(dto, ipAddress, userAgent);
  }

  @Public()
  @Post('register')
  @HttpCode(201)
  @ApiOperation({ summary: 'Register new user' })
  @ApiResponse({ 
    status: 201, 
    description: 'User created successfully',
    schema: {
      type: 'object',
      properties: {
        accessToken: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          description: 'JWT token for the newly registered user',
        },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async register(@Body() registerDto: RegisterDto) {
    console.log('Register Request DTO (before service):', JSON.stringify(registerDto, null, 2));
    const result = await this.authService.register(registerDto);
    console.log('Register Response (after service):', JSON.stringify(result, null, 2));
    return result;
  }

  @Public()
  @Post('password-reset/request')
  @HttpCode(200)
  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({ status: 200, description: 'Reset instructions sent' })
  async requestPasswordReset(@Body() dto: RequestPasswordResetDto) {
    return this.authService.requestPasswordReset(dto);
  }

  @Public()
  @Post('password-reset/reset')
  @HttpCode(200)
  @ApiOperation({ summary: 'Reset password using token' })
  @ApiResponse({ status: 200, description: 'Password reset successful' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Get('mfa/generate')
  @ApiOperation({ summary: 'Generate MFA secret and QR code' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns MFA secret and QR code',
    schema: {
      type: 'object',
      properties: {
        secret: { type: 'string' },
        qrCode: { type: 'string' },
      },
    },
  })
  async generateMfaSecret(@CurrentUser() user: any) {
    return this.authService.generateMfaSecret(user.id);
  }

  @Post('mfa/enable')
  @HttpCode(200)
  @ApiOperation({ summary: 'Enable MFA' })
  @ApiResponse({ status: 200, description: 'MFA enabled successfully' })
  @ApiResponse({ status: 400, description: 'Invalid MFA code' })
  async enableMfa(@CurrentUser() user: any, @Body() dto: EnableMfaDto) {
    return this.authService.enableMfa(user.id, dto);
  }

  @Post('mfa/verify')
  @HttpCode(200)
  @ApiOperation({ summary: 'Verify MFA code' })
  @ApiResponse({ status: 200, description: 'MFA code verified' })
  @ApiResponse({ status: 400, description: 'Invalid MFA code' })
  async verifyMfa(@CurrentUser() user: any, @Body() dto: VerifyMfaDto) {
    return this.authService.verifyMfa(user.id, dto);
  }

  @Post('mfa/disable')
  @HttpCode(200)
  @ApiOperation({ summary: 'Disable MFA' })
  @ApiResponse({ status: 200, description: 'MFA disabled successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  async disableMfa(@CurrentUser() user: any, @Body() dto: DisableMfaDto) {
    return this.authService.disableMfa(user.id, dto);
  }

  @Public()
  @Post('email/request-verification')
  @HttpCode(200)
  @ApiOperation({ summary: 'Request email verification' })
  @ApiResponse({ status: 200, description: 'Verification email sent' })
  async requestEmailVerification(@Body() dto: RequestEmailVerificationDto) {
    return this.authService.requestEmailVerification(dto);
  }

  @Public()
  @Post('email/verify')
  @HttpCode(200)
  @ApiOperation({ summary: 'Verify email with token' })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto);
  }

  @Public()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth login' })
  @ApiResponse({ status: 200, description: 'Redirects to Google login' })
  googleAuth() {
    // This route will redirect to Google
    return;
  }

  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth callback' })
  @ApiResponse({ 
    status: 200, 
    description: 'Google login successful',
    schema: {
      type: 'object',
      properties: {
        accessToken: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          description: 'JWT token to be used for authenticated requests',
        },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
          },
        },
      },
    }
  })
  async googleAuthCallback(@Req() req, @Res() res) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    try {
      const { accessToken, user } = await this.authService.oauthLogin(req.user, req.ip, req.headers['user-agent']);
      // Redirect to frontend with token
      return res.redirect(`${frontendUrl}/auth/callback?token=${accessToken}&userId=${user.id}`);
    } catch (error) {
      return res.redirect(`${frontendUrl}/auth/callback?error=${encodeURIComponent(error.message)}`);
    }
  }

  @Post('link-account')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  @ApiOperation({ summary: 'Link current account with OAuth provider' })
  @ApiResponse({ status: 200, description: 'Account linked successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request or provider' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async linkAccount(@CurrentUser() user: User, @Body() linkAccountDto: LinkAccountDto, @Req() req) {
    const ipAddress = req.ip || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    return this.authService.linkAccount(user.id, linkAccountDto, ipAddress, userAgent);
  }

  @Post('unlink-provider/:provider')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  @ApiOperation({ summary: 'Unlink an OAuth provider from current account' })
  @ApiResponse({ status: 200, description: 'Provider unlinked successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request or cannot unlink last login method' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async unlinkProvider(@CurrentUser() user: User, @Param('provider') provider: string, @Req() req) {
    const ipAddress = req.ip || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    return this.authService.unlinkProvider(user.id, provider, ipAddress, userAgent);
  }

  @Public()
  @Get('github')
  @UseGuards(AuthGuard('github'))
  @ApiOperation({ summary: 'GitHub OAuth login' })
  @ApiResponse({ status: 200, description: 'Redirects to GitHub login' })
  githubAuth() {
    // This route will redirect to GitHub
    return;
  }

  @Public()
  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  @ApiOperation({ summary: 'GitHub OAuth callback' })
  @ApiResponse({ 
    status: 200, 
    description: 'GitHub login successful',
    schema: {
      type: 'object',
      properties: {
        accessToken: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          description: 'JWT token to be used for authenticated requests',
        },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
          },
        },
      },
    },
  })
  async githubAuthCallback(@Req() req, @Res() res) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    try {
      const { accessToken, user } = await this.authService.oauthLogin(req.user, req.ip, req.headers['user-agent']);
      // Redirect to frontend with token
      return res.redirect(`${frontendUrl}/auth/callback?token=${accessToken}&userId=${user.id}`);
    } catch (error) {
      return res.redirect(`${frontendUrl}/auth/callback?error=${encodeURIComponent(error.message)}`);
    }
  }

  /*
  // Microsoft OAuth routes - Commented out
  @Public()
  @Get('microsoft')
  @UseGuards(AuthGuard('microsoft'))
  @ApiOperation({ summary: 'Microsoft OAuth login' })
  @ApiResponse({ status: 200, description: 'Redirects to Microsoft login' })
  microsoftAuth() {
    // This route will redirect to Microsoft
    return;
  }

  @Public()
  @Get('microsoft/callback')
  @UseGuards(AuthGuard('microsoft'))
  @ApiOperation({ summary: 'Microsoft OAuth callback' })
  @ApiResponse({ 
    status: 200, 
    description: 'Microsoft login successful',
    schema: {
      type: 'object',
      properties: {
        accessToken: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          description: 'JWT token to be used for authenticated requests',
        },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
          },
        },
      },
    },
  })
  async microsoftAuthCallback(@Req() req, @Res() res) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    try {
      const { accessToken, user } = await this.authService.oauthLogin(req.user, req.ip, req.headers['user-agent']);
      // Redirect to frontend with token
      return res.redirect(`${frontendUrl}/auth/callback?token=${accessToken}&userId=${user.id}`);
    } catch (error) {
      return res.redirect(`${frontendUrl}/auth/callback?error=${encodeURIComponent(error.message)}`);
    }
  }
  */
}
