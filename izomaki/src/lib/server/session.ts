import { env } from '$env/dynamic/private';
import crypto from 'crypto';

const SECRET = env.SESSION_SECRET!;
const COOKIE_NAME = 'izomaki-session';

export { COOKIE_NAME };

export function createSessionToken(userId: string): string {
  const payload = JSON.stringify({ userId, exp: Date.now() + 30 * 24 * 60 * 60 * 1000 });
  const signature = crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
  return Buffer.from(payload).toString('base64') + '.' + signature;
}

export function verifySessionToken(token: string): { userId: string } | null {
  const [payloadB64, signature] = token.split('.');
  if (!payloadB64 || !signature) return null;
  const payload = Buffer.from(payloadB64, 'base64').toString();
  const expected = crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
  if (signature !== expected) return null;
  const data = JSON.parse(payload);
  if (data.exp < Date.now()) return null;
  return { userId: data.userId };
}
