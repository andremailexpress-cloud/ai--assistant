import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

export function getMfaEncryptionKey(value = process.env.MFA_ENCRYPTION_KEY): Buffer {
  if (!value) {
    throw new Error('MFA_ENCRYPTION_KEY environment variable is required');
  }

  return parseMfaEncryptionKey(value);
}

export function parseMfaEncryptionKey(value: string): Buffer {
  const trimmedValue = value.trim();
  const hexKey = parseHexKey(trimmedValue);

  if (hexKey) {
    return hexKey;
  }

  const base64Key = parseBase64Key(trimmedValue);

  if (base64Key) {
    return base64Key;
  }

  const utf8Key = Buffer.from(trimmedValue, 'utf8');

  if (utf8Key.length === 32) {
    return utf8Key;
  }

  throw new Error('MFA_ENCRYPTION_KEY must decode to exactly 32 bytes');
}

export function encryptString(plaintext: string, key: Buffer): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted.toString('base64')}`;
}

export function decryptString(ciphertext: string, key: Buffer): string {
  const [ivBase64, authTagBase64, encryptedBase64] = ciphertext.split(':');

  if (!ivBase64 || !authTagBase64 || !encryptedBase64) {
    throw new Error('Encrypted value format is invalid');
  }

  const iv = Buffer.from(ivBase64, 'base64');
  const authTag = Buffer.from(authTagBase64, 'base64');
  const encrypted = Buffer.from(encryptedBase64, 'base64');
  const decipher = createDecipheriv(ALGORITHM, key, iv);

  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);

  return decrypted.toString('utf8');
}

function parseHexKey(value: string): Buffer | null {
  if (!/^[0-9a-fA-F]{64}$/.test(value)) {
    return null;
  }

  return Buffer.from(value, 'hex');
}

function parseBase64Key(value: string): Buffer | null {
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(value)) {
    return null;
  }

  const decoded = Buffer.from(value, 'base64');

  return decoded.length === 32 ? decoded : null;
}
