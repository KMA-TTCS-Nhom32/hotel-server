import { AccountIdentifier, UserRole } from '@prisma/client';

export type JwtPayload = {
  sub: string;
  role: UserRole;
  identifierType: AccountIdentifier;  // use Prisma's AccountIdentifier enum
  identifier: string;  // the actual email or phone value
};

export type JwtUser = {
  userId: string;
  role: UserRole;
  identifierType: AccountIdentifier;
  identifier: string;
};
