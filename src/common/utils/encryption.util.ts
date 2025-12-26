import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits
const ENCODING: BufferEncoding = 'hex';


export function validateKey(key: string, keyName: string): void {
    if (!key || typeof key !== 'string') {
        throw new Error(`${keyName} is required and must be a string`);
    }

    if (!/^[0-9a-fA-F]{64}$/.test(key)) {
        throw new Error(
            `${keyName} must be exactly 64 hex characters (32 bytes). Current length: ${key.length}`,
        );
    }
}


export function normalizeEmail(email: string): string {
    return email.toLowerCase().trim();
}


export function normalizePhone(phone: string): string {
    return phone.replace(/\D/g, '').trim();
}


export function encryptData(plaintext: string, encryptionKeyHex: string): string {
    validateKey(encryptionKeyHex, 'ENCRYPTION_KEY');

    const key = Buffer.from(encryptionKeyHex, 'hex');
    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
        authTagLength: AUTH_TAG_LENGTH,
    });

    let encrypted = cipher.update(plaintext, 'utf8', ENCODING);
    encrypted += cipher.final(ENCODING);

    const authTag = cipher.getAuthTag();

    return `${iv.toString(ENCODING)}:${authTag.toString(ENCODING)}:${encrypted}`;
}

/**
 * Decrypts data encrypted with AES-256-GCM
 * Expects format: iv:authTag:encryptedData (all hex encoded)
 */
export function decryptData(ciphertext: string, encryptionKeyHex: string): string {
    validateKey(encryptionKeyHex, 'ENCRYPTION_KEY');

    const parts = ciphertext.split(':');
    if (parts.length !== 3) {
        throw new Error('Invalid ciphertext format. Expected iv:authTag:encryptedData');
    }

    const [ivHex, authTagHex, encryptedHex] = parts;

    const key = Buffer.from(encryptionKeyHex, 'hex');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
        authTagLength: AUTH_TAG_LENGTH,
    });

    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, ENCODING, 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}

export function createSearchHash(plaintext: string, hmacKeyHex: string): string {
    validateKey(hmacKeyHex, 'HMAC_SECRET_KEY');

    const key = Buffer.from(hmacKeyHex, 'hex');
    const hmac = crypto.createHmac('sha256', key);

    hmac.update(plaintext, 'utf8');

    return hmac.digest('hex');
}


export function encryptEmail(email: string, encryptionKey: string): string {
    return encryptData(normalizeEmail(email), encryptionKey);
}


export function createEmailHash(email: string, hmacKey: string): string {
    return createSearchHash(normalizeEmail(email), hmacKey);
}


export function encryptPhone(phone: string, encryptionKey: string): string {
    return encryptData(normalizePhone(phone), encryptionKey);
}


export function createPhoneHash(phone: string, hmacKey: string): string {
    return createSearchHash(normalizePhone(phone), hmacKey);
}


export class EncryptionService {
    private readonly encryptionKey: string;
    private readonly hmacKey: string;

    constructor(encryptionKey: string, hmacKey: string) {
        validateKey(encryptionKey, 'ENCRYPTION_KEY');
        validateKey(hmacKey, 'HMAC_SECRET_KEY');

        this.encryptionKey = encryptionKey;
        this.hmacKey = hmacKey;
    }

    encrypt(plaintext: string): string {
        return encryptData(plaintext, this.encryptionKey);
    }

    decrypt(ciphertext: string): string {
        return decryptData(ciphertext, this.encryptionKey);
    }

    hash(plaintext: string): string {
        return createSearchHash(plaintext, this.hmacKey);
    }

    encryptEmail(email: string): { encrypted: string; hash: string } {
        const normalized = normalizeEmail(email);
        return {
            encrypted: encryptData(normalized, this.encryptionKey),
            hash: createSearchHash(normalized, this.hmacKey),
        };
    }

    decryptEmail(ciphertext: string): string {
        return decryptData(ciphertext, this.encryptionKey);
    }

    createEmailHash(email: string): string {
        return createSearchHash(normalizeEmail(email), this.hmacKey);
    }

    encryptPhone(phone: string): { encrypted: string; hash: string } {
        const normalized = normalizePhone(phone);
        return {
            encrypted: encryptData(normalized, this.encryptionKey),
            hash: createSearchHash(normalized, this.hmacKey),
        };
    }

    decryptPhone(ciphertext: string): string {
        return decryptData(ciphertext, this.encryptionKey);
    }

    createPhoneHash(phone: string): string {
        return createSearchHash(normalizePhone(phone), this.hmacKey);
    }
}
