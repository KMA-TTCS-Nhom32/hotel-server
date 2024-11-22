import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';
import handlebars from 'handlebars';
import { from, catchError, retry, firstValueFrom } from 'rxjs';
import fs from 'fs';
import { join } from 'path';

import { otpLoginTemplateValues } from './templates/template-values';
import { RegisterVerificationEmailDto } from './dtos';
import { EmailOptions } from './interfaces';

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

    const templatePath = join(__dirname, 'templates', 'otp.template.hbs');
    const templateContent = fs.readFileSync(templatePath, 'utf-8');
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

  async queueVerificationEmail(registerVerificationDto: RegisterVerificationEmailDto) {
    try {
      const job = await this.emailQueue.add('verification-email', registerVerificationDto);
      this.logger.debug(`Verification email queued: ${job.id}`);
      return true;
    } catch (error) {
      this.logger.error('Failed to queue verification email', error);
      return false;
    }
  }

  async sendRegisterVerificationEmail(registerVerificationDto: RegisterVerificationEmailDto) {
    const { to, code, lang = 'en' } = registerVerificationDto;
    const templateValues = otpLoginTemplateValues[lang];
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
      attachments: [{
        filename: 'logo.png',
        path: join(__dirname, 'templates/assets/logo_light_rec.png'),
        cid: 'unique@nodemailer.com'
      }]
    };

    return firstValueFrom(from(this.transporter.sendMail(mailOptions)).pipe(
      retry(3), // Will retry 3 times before failing
      catchError((error) => {
        console.error('Error sending email after 3 retries:', error);
        return from([false]);
      })
    ));
  }
}
