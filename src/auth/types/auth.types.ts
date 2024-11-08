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

export type RefreshTokenPayload = {
  jti: string;  // Token ID
  sub: string;  // User ID
};

export type TokenResponse = {
  accessToken: string;
  accessTokenExpires: number;
  refreshToken: string;
};

export type ActiveSession = {
  id: string;
  device: string | null;
  ip: string | null;
  lastUsed: Date;
  expiresAt: Date;
  isCurrentSession?: boolean;
};
