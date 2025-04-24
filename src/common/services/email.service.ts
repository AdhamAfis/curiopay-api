import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT'),
      secure: true,
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASSWORD'),
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
} 