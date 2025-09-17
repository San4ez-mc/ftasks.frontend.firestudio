
import { NextRequest } from 'next/server';
import * as jose from 'jose';

const JWT_SECRET = process.env.JWT_SECRET;
const PERMANENT_JWT_SECRET = process.env.PERMANENT_JWT_SECRET;

type AuthResult = {
  userId?: string;
  companyId?: string;
  rememberMe?: boolean;
  error?: string;
  status?: number;
};

async function getSecretKey(isPermanent: boolean): Promise<Uint8Array> {
    const secret = isPermanent ? PERMANENT_JWT_SECRET : JWT_SECRET;
    if (!secret) {
        const secretName = isPermanent ? 'PERMANENT_JWT_SECRET' : 'JWT_SECRET';
        console.error(`${secretName} is not defined in environment variables.`);
        throw new Error('Server configuration error');
    }
    return new TextEncoder().encode(secret);
}

export async function verifyToken(request: NextRequest, isPermanent = false): Promise<AuthResult> {
  const authHeader = request.headers.get('Authorization');
  let token: string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (isPermanent) {
    token = request.cookies.get('auth_token')?.value;
  }

  if (!token) {
    return { error: 'Authentication token not found', status: 401 };
  }
  
  try {
    const secretKey = await getSecretKey(isPermanent);
    const { payload } = await jose.jwtVerify(token, secretKey);
    const decoded = payload as { userId: string, companyId?: string, rememberMe?: boolean };
    return { userId: decoded.userId, companyId: decoded.companyId, rememberMe: decoded.rememberMe };
  } catch (err) {
    return { error: 'Invalid or expired token', status: 401 };
  }
}

export async function createPermanentToken(userId: string, companyId: string, rememberMe: boolean): Promise<string> {
    const secretKey = await getSecretKey(true);
    const expiresIn = rememberMe ? '30d' : '1d';
    
    return new jose.SignJWT({ userId, companyId, rememberMe })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(expiresIn)
      .sign(secretKey);
}

export async function validatePermanentToken(token: string): Promise<{ userId: string; companyId: string } | null> {
    try {
        const secretKey = await getSecretKey(true);
        const { payload } = await jose.jwtVerify(token, secretKey);
        const decoded = payload as { userId: string, companyId: string };
        
        if (typeof decoded === 'object' && decoded.userId && decoded.companyId) {
            return { userId: decoded.userId, companyId: decoded.companyId };
        }
        return null;
    } catch (error) {
        return null; // Token is invalid or expired
    }
}
