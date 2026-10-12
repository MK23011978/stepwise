// Access tokens: short-lived signed JWTs (stateless — any Cloud Run instance can verify them).
// Refresh tokens: random opaque strings, stored hashed in auth_sessions so they can be rotated and revoked.
import { SignJWT, jwtVerify } from 'jose';
import { createHash, randomBytes } from 'node:crypto';

export interface AccessClaims { sub: string; role: string; sid: string }
const key = (secret: string) => new TextEncoder().encode(secret);

export async function signAccess(claims: AccessClaims, secret: string, ttlSeconds: number) {
  return new SignJWT({ role: claims.role, sid: claims.sid }).setProtectedHeader({ alg: 'HS256' }).setSubject(claims.sub)
    .setIssuedAt().setExpirationTime(`${ttlSeconds}s`).setIssuer('stepwise').sign(key(secret));
}
export async function verifyAccess(token: string, secret: string): Promise<AccessClaims | null> {
  try { const { payload } = await jwtVerify(token, key(secret), { issuer: 'stepwise' }); return { sub: String(payload.sub), role: String(payload.role), sid: String(payload.sid) }; }
  catch { return null; }
}
export const newRefreshToken = () => randomBytes(32).toString('base64url');
export const hashToken = (t: string) => createHash('sha256').update(t).digest('hex');
