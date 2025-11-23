import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

const KEY_LENGTH = 32;

function derive(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password.normalize('NFKC'), salt, KEY_LENGTH, (err, key) =>
      err ? reject(err) : resolve(key),
    );
  });
}

/** Returns a self-describing hash: `scrypt$<salt>$<key>` (base64url). */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await derive(password, salt);
  return `scrypt$${salt.toString('base64url')}$${key.toString('base64url')}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, saltPart, keyPart] = stored.split('$');
  if (scheme !== 'scrypt' || !saltPart || !keyPart) return false;
  const expected = Buffer.from(keyPart, 'base64url');
  const actual = await derive(password, Buffer.from(saltPart, 'base64url'));
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
