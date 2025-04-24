import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST'),
      port: this.configService.get('SMTP_PORT'),
      secure: true,
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASS'),
      },
    });
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const resetLink = `${this.configService.get<string>('FRONTEND_URL')}/reset-password?token=${token}`;
    
    await this.transporter.sendMail({
      from: this.configService.get<string>('SMTP_FROM'),
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
  }

  async sendMfaSetupEmail(email: string, qrCodeUrl: string, secret: string): Promise<void> {
    await this.transporter.sendMail({
      from: this.configService.get<string>('SMTP_FROM'),
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
          <a href="${this.configService.get('APP_URL')}/login" 
             style="background-color: #4CAF50; color: white; padding: 14px 20px; text-decoration: none; border-radius: 4px;">
            Log In to CurioPay
          </a>
        </div>
        <p>Best regards,<br>The CurioPay Team</p>
      </div>
    `;

    return this.transporter.sendMail({
      from: this.configService.get('SMTP_FROM'),
      to: email,
      subject,
      html,
    });
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
          <a href="${this.configService.get('APP_URL')}/dashboard" 
             style="background-color: #4CAF50; color: white; padding: 14px 20px; text-decoration: none; border-radius: 4px;">
            View Your Dashboard
          </a>
        </div>

        <p>Stay on top of your finances!<br>The CurioPay Team</p>
      </div>
    `;

    return this.transporter.sendMail({
      from: this.configService.get('SMTP_FROM'),
      to: email,
      subject,
      html,
    });
  }
} 