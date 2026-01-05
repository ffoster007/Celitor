const rawSecret = process.env.NEXTAUTH_SECRET
  || process.env.AUTH_SECRET
  || 'development-secret-key-change-in-production';

export const authSecret = rawSecret;

if (!process.env.NEXTAUTH_URL && process.env.NODE_ENV !== 'production') {
  process.env.NEXTAUTH_URL = 'http://localhost:3000';
}