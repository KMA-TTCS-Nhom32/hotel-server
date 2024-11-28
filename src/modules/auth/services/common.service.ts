import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { AccountIdentifier, User } from '@prisma/client';
import { VerificationService } from '@/modules/verification/verification.service';
import { EmailService } from '@/communication/email/email.service';
import { AuthErrorMessageEnum } from 'libs/common/enums';
import { EmailTemplateType } from '@/communication/email/types';

@Injectable()
export class CommonService {
  constructor(
    private readonly emailService: EmailService,
    private readonly verificationService: VerificationService,
  ) {}

  async sendVerificationCodeEmail(
    userId: string,
    userEmail: string,
    sendingType: EmailTemplateType,
  ) {
    const { code } = await this.verificationService.createVerification(
      userId,
      AccountIdentifier.EMAIL,
    );

    const sentEmail = await this.emailService.queueVerificationEmail({
      to: userEmail,
      code,
      type: sendingType,
    });

    if (!sentEmail) {
      throw new HttpException(
        {
          status: HttpStatus.SERVICE_UNAVAILABLE,
          message: AuthErrorMessageEnum.SentEmailFailed,
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}
