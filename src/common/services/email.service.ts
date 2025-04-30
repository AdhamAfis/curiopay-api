import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(EmailService.name);
  private testAccount: any;

  constructor(private configService: ConfigService) {
    this.initializeTransporter();
  }

  private async initializeTransporter() {
    const smtpHost = this.configService.get('SMTP_HOST');
    const smtpPort = this.configService.get('SMTP_PORT');
    const smtpUser = this.configService.get('SMTP_USER');
    const smtpPass = this.configService.get('SMTP_PASS');

    // Check if SMTP settings are configured
    if (smtpHost && smtpPort && smtpUser && smtpPass) {
      // Use real SMTP settings
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(smtpPort, 10),
        secure: parseInt(smtpPort, 10) === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });
      this.logger.log('Email service initialized with real SMTP settings');
    } else {
      // Use ethereal email for testing/development
      try {
        this.logger.warn('SMTP settings not found, using ethereal email for testing');
        this.testAccount = await nodemailer.createTestAccount();
        
        this.transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: this.testAccount.user,
            pass: this.testAccount.pass,
          },
        });
        
        this.logger.log(`Test email account created: ${this.testAccount.user}`);
      } catch (error) {
        this.logger.error('Failed to create test email account', error);
        // Create a fake transporter that logs instead of sending
        this.transporter = {
          sendMail: async (mailOptions) => {
            this.logger.warn(`Email would be sent: ${JSON.stringify(mailOptions)}`);
            return { messageId: 'fake-message-id' };
          }
        } as any;
      }
    }
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const resetLink = `${this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000'}/reset-password?token=${token}`;
    
    const info = await this.transporter.sendMail({
      from: this.configService.get<string>('SMTP_FROM') || 'noreply@curiopay.com',
      to: email,
      subject: 'Password Reset Request',
      html: `
        <h1>Password Reset Request</h1>
        <p>You have requested to reset your password. Click the link below to proceed:</p>
        <a href="${resetLink}">Reset Password</a>
        <p>If you did not request this password reset, please ignore this email.</p>
        <p>This link will expire in 1 hour.</p>
      `,
    });

    // Log preview URL for ethereal emails
    if (this.testAccount) {
      this.logger.log(`Password reset email preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }
  }

  async sendMfaSetupEmail(email: string, qrCodeUrl: string, secret: string): Promise<void> {
    const info = await this.transporter.sendMail({
      from: this.configService.get<string>('SMTP_FROM') || 'noreply@curiopay.com',
      to: email,
      subject: 'Multi-Factor Authentication Setup',
      html: `
        <h1>Multi-Factor Authentication Setup</h1>
        <p>You have enabled Multi-Factor Authentication for your account.</p>
        <p>Please scan the QR code below with your authenticator app:</p>
        <img src="${qrCodeUrl}" alt="QR Code" />
        <p>If you cannot scan the QR code, use this secret key in your authenticator app:</p>
        <code>${secret}</code>
        <p>Keep this information secure and do not share it with anyone.</p>
      `,
    });

    // Log preview URL for ethereal emails
    if (this.testAccount) {
      this.logger.log(`MFA setup email preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }
  }

  async sendMissYouEmail(email: string, firstName: string) {
    const subject = 'We Miss You at CurioPay! 💫';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Hi ${firstName}!</h2>
        <p>We noticed it's been a while since you last logged into CurioPay. We miss having you around! 🌟</p>
        <p>A lot can happen in a month with your finances. Would you like to:</p>
        <ul>
          <li>Check your latest expense trends? 📊</li>
          <li>Update your budget goals? 🎯</li>
          <li>Review your savings progress? 💰</li>
        </ul>
        <p>We're here to help you stay on top of your financial journey!</p>
        <div style="margin: 30px 0;">
          <a href="${this.configService.get('APP_URL') || 'http://localhost:3000'}/login" 
             style="background-color: #4CAF50; color: white; padding: 14px 20px; text-decoration: none; border-radius: 4px;">
            Log In to CurioPay
          </a>
        </div>
        <p>Best regards,<br>The CurioPay Team</p>
      </div>
    `;

    const info = await this.transporter.sendMail({
      from: this.configService.get('SMTP_FROM') || 'noreply@curiopay.com',
      to: email,
      subject,
      html,
    });

    // Log preview URL for ethereal emails
    if (this.testAccount) {
      this.logger.log(`Miss you email preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }
    
    return info;
  }

  async sendNewsletter(email: string, firstName: string) {
    const subject = 'Your CurioPay Financial Newsletter 📈';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Hello ${firstName}!</h2>
        <p>Welcome to your personalized CurioPay newsletter! 🌟</p>
        
        <h3>📊 Financial Tips of the Week</h3>
        <ul>
          <li>Track your daily expenses to identify spending patterns</li>
          <li>Set realistic savings goals for the month</li>
          <li>Review your recurring subscriptions</li>
        </ul>

        <h3>💡 Did You Know?</h3>
        <p>Using CurioPay's category tracking can help you save up to 20% on monthly expenses by identifying unnecessary spending!</p>

        <div style="margin: 30px 0;">
          <a href="${this.configService.get('APP_URL') || 'http://localhost:3000'}/dashboard" 
             style="background-color: #4CAF50; color: white; padding: 14px 20px; text-decoration: none; border-radius: 4px;">
            View Your Dashboard
          </a>
        </div>

        <p>Stay on top of your finances!<br>The CurioPay Team</p>
      </div>
    `;

    const info = await this.transporter.sendMail({
      from: this.configService.get('SMTP_FROM') || 'noreply@curiopay.com',
      to: email,
      subject,
      html,
    });

    // Log preview URL for ethereal emails
    if (this.testAccount) {
      this.logger.log(`Newsletter email preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }
    
    return info;
  }

  async sendEmailVerificationLink(email: string, token: string): Promise<void> {
    const verificationLink = `${this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000'}/verify-email?token=${token}`;
    
    const info = await this.transporter.sendMail({
      from: this.configService.get<string>('SMTP_FROM') || 'noreply@curiopay.com',
      to: email,
      subject: 'Verify Your Email Address',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1>Verify Your Email Address</h1>
          <p>Thank you for signing up with CurioPay! Please click the link below to verify your email address:</p>
          <div style="margin: 30px 0;">
            <a href="${verificationLink}" 
               style="background-color: #4CAF50; color: white; padding: 14px 20px; text-decoration: none; border-radius: 4px;">
              Verify Your Email
            </a>
          </div>
          <p>If you did not create an account, you can safely ignore this email.</p>
          <p>This link will expire in 24 hours.</p>
          <p>Best regards,<br>The CurioPay Team</p>
        </div>
      `,
    });

    // Log preview URL for ethereal emails
    if (this.testAccount) {
      this.logger.log(`Email verification preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }
  }
} 