import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from './password.js';

describe('password hashing', () => {
  it('verifies the original password', async () => {
    const hash = await hashPassword('correct horse battery staple');
    expect(hash).toMatch(/^scrypt\$[\w-]+\$[\w-]+$/);
    expect(await verifyPassword('correct horse battery staple', hash)).toBe(true);
  });

  it('rejects a wrong password', async () => {
    const hash = await hashPassword('secret-one');
    expect(await verifyPassword('secret-two', hash)).toBe(false);
  });

  it('uses a random salt per hash', async () => {
    expect(await hashPassword('same')).not.toBe(await hashPassword('same'));
  });

  it('treats composed and decomposed unicode the same', async () => {
    const hash = await hashPassword('café');
    expect(await verifyPassword('café', hash)).toBe(true);
  });

  it('returns false for malformed hashes', async () => {
    expect(await verifyPassword('x', 'bcrypt$abc')).toBe(false);
    expect(await verifyPassword('x', '')).toBe(false);
  });
});
