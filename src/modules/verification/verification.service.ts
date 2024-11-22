import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { AccountIdentifier } from '@prisma/client';
import { DatabaseService } from '@/database/database.service';

@Injectable()
export class VerificationService {
  constructor(private readonly databaseService: DatabaseService) {}

  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
  
  async createVerification(userId: string, type: AccountIdentifier) {
    const code = this.generateOTP();
    const expires_at = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now

    // Delete any existing verification codes for this user and type
    await this.databaseService.verification.deleteMany({
      where: {
        userId,
        type,
      },
    });

    // Create new verification
    return this.databaseService.verification.create({
      data: {
        code,
        type,
        userId,
        expires_at,
      },
    });
  }

  async verifyCode(userId: string, code: string, type: AccountIdentifier) {
    const verification = await this.databaseService.verification.findFirst({
      where: {
        userId,
        code,
        type,
        expires_at: {
          gt: new Date(),
        },
      },
    });

    if (!verification) {
      throw new HttpException(
        {
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          message: 'Invalid or expired verification code',
        },
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    // Delete the verification code after successful verification
    await this.databaseService.verification.delete({
      where: {
        id: verification.id,
      },
    });

    // Update user's verification status
    await this.databaseService.user.update({
      where: {
        id: userId,
      },
      data: {
        // verified_email: type === AccountIdentifier.EMAIL ? true : undefined,
        // verified_phone: type === AccountIdentifier.PHONE ? true : undefined,
        [`verified_${type.toLowerCase()}`]: true,
      },
    });

    return {
      message: 'Verification successful',
    };
  }
}
