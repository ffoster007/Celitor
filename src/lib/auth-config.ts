const rawSecret = process.env.NEXTAUTH_SECRET
  || process.env.AUTH_SECRET
  || (process.env.NODE_ENV !== 'production' ? 'development-secret' : undefined);

if (!rawSecret && process.env.NODE_ENV === 'production') {
  throw new Error('NEXTAUTH_SECRET (or AUTH_SECRET) must be defined when running in production');
}

export const authSecret = rawSecret ?? 'development-secret';

if (!process.env.NEXTAUTH_URL && process.env.NODE_ENV !== 'production') {
  process.env.NEXTAUTH_URL = 'http://localhost:3000';
}