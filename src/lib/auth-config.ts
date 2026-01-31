// Lazy evaluation for auth secret to avoid errors during middleware/proxy load
let _authSecret: string | undefined;

export function getAuthSecret(): string {
  if (_authSecret) return _authSecret;
  
  const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
  
  if (!secret) {
    throw new Error(
      'Missing NEXTAUTH_SECRET or AUTH_SECRET environment variable. ' +
      'Generate one with: openssl rand -base64 32'
    );
  }
  
  _authSecret = secret;
  return _authSecret;
}

// For backwards compatibility - use getAuthSecret() when possible
export const authSecret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || '';

if (!process.env.NEXTAUTH_URL && process.env.NODE_ENV !== 'production') {
  process.env.NEXTAUTH_URL = 'http://localhost:3000';
}