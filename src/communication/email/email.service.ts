import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import handlebars from 'handlebars';
import { readFileSync } from 'fs';
import { join } from 'path';

import {
  otpForgotPasswordTemplateValues,
  otpLoginTemplateValues,
} from './templates/template-values';
import { VerificationEmailDto } from './dtos';
import { EmailOptions } from './interfaces';
import { EmailTypeEnum } from './types';

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: nodemailer.Transporter;
  private readonly otpTemplate: handlebars.TemplateDelegate;

  constructor(
    @InjectQueue('email-queue') private readonly emailQueue: Queue,
    private readonly configService: ConfigService,
  ) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      host: this.configService.get('SMTP_HOST'),
      port: this.configService.get('SMTP_PORT'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASSWORD'),
      },
    });

    // const templatePath = join(__dirname, 'templates', 'otp.template.hbs');
    const templatePath = join(
      process.cwd(),
      'src',
      'communication',
      'email',
      'templates',
      'otp.template.hbs',
    );
    const templateContent = readFileSync(templatePath, 'utf-8');
    this.otpTemplate = handlebars.compile(templateContent);
  }

  async onModuleInit() {
    try {
      // Test queue connection
      await this.emailQueue.isReady();
      this.logger.log('Successfully connected to Redis Cloud');
    } catch (error) {
      this.logger.error('Failed to connect to Redis Cloud:', error);
    }
  }

  async queueVerificationEmail(verificationDto: VerificationEmailDto) {
    try {
      this.logger.debug(`Attempting to queue email to: ${verificationDto.to}`);
      const job = await this.emailQueue.add('verification-email', verificationDto, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000, // 2 seconds
        },
      });
      this.logger.debug(`Verification email queued successfully. Job ID: ${job.id}`);
      return true;
    } catch (error) {
      this.logger.error('Failed to queue verification email:', {
        error: error.message,
        stack: error.stack,
        data: verificationDto,
      });
      return false;
    }
  }

  async sendVerificationEmail(verificationDto: VerificationEmailDto) {
    const { to, code, lang = 'en', type } = verificationDto;
    this.logger.debug(`Preparing to send verification email to: ${to}`);

    try {
      const templateValues =
        type === EmailTypeEnum.VERIFY_ACCOUNT
          ? otpLoginTemplateValues[lang]
          : otpForgotPasswordTemplateValues[lang];
      const mailOptions: EmailOptions = {
        from: {
          name: this.configService.get('SMTP_FROM_NAME'),
          address: this.configService.get('SMTP_FROM_EMAIL'),
        },
        to,
        subject: templateValues.title,
        html: this.otpTemplate({
          ...templateValues,
          code,
        }),
        attachments: [
          {
            filename: 'logo.png',
            //   path: join(__dirname, 'templates/assets/logo_dark_rec.png'),
            path: join(
              process.cwd(),
              'src',
              'communication',
              'email',
              'templates',
              'assets',
              'logo_dark_rec.png',
            ),
            cid: 'unique@nodemailer.com',
          },
        ],
      };

      const result = await this.transporter.sendMail(mailOptions);
      this.logger.debug(`Email sent successfully to ${to}. MessageId: ${result.messageId}`);
      return true;
    } catch (error) {
      this.logger.error('Error in sendVerificationEmail:', {
        error: error.message,
        stack: error.stack,
        to,
        code,
      });
      return false;
    }
  }
}
