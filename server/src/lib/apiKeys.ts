import { createHash, randomBytes } from 'node:crypto';

export const API_KEY_PREFIX = 'lsk_';

export const hashApiKey = (token: string) => createHash('sha256').update(token).digest('hex');

/** A new key; only the hash is stored, the token is shown to the user once. */
export function generateApiKey() {
  const token = API_KEY_PREFIX + randomBytes(24).toString('base64url');
  return { token, prefix: token.slice(0, 10), hash: hashApiKey(token) };
}
