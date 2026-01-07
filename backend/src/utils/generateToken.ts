import jwt, { JwtPayload } from 'jsonwebtoken';

// Helper function to convert JWT expiration time to milliseconds
export const getTokenExpiryInMs = (expirationTime: string): number => {
    const timeValue = parseInt(expirationTime.slice(0, -1));
    const timeUnit = expirationTime.slice(-1).toLowerCase();

    switch (timeUnit) {
        case 's': return timeValue * 1000;           // seconds
        case 'm': return timeValue * 60 * 1000;      // minutes
        case 'h': return timeValue * 60 * 60 * 1000; // hours
        case 'd': return timeValue * 24 * 60 * 60 * 1000; // days
        default: return 60 * 60 * 1000; // Default: 1 hour
    }
};

// Interface for email verification token payload
export interface EmailVerificationPayload extends JwtPayload {
    userId: string;
    email: string;
    type: 'email_verification';
}

// Generate access token with session ID
export const generateAccessToken = (userId: string, role: string, sessionId?: string): string => {
    const payload: any = { userId, role };

    // Include session ID if provided (for session-aware tokens)
    if (sessionId) {
        payload.sessionId = sessionId;
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET is not defined in environment variables');
    }

    const accessToken = jwt.sign(payload, secret, {
        expiresIn: (process.env.JWT_EXPIRATION_TIME || '1h') as any,
    });
    return accessToken;
};

// Generate refresh token with session ID
export const generateRefreshToken = (userId: string, sessionId?: string): string => {
    const payload: any = { userId };

    // Include session ID if provided (for session-aware tokens)
    if (sessionId) {
        payload.sessionId = sessionId;
    }

    const secret = process.env.JWT_REFRESH_SECRET;
    if (!secret) {
        throw new Error('JWT_REFRESH_SECRET is not defined in environment variables');
    }

    const refreshToken = jwt.sign(payload, secret, {
        expiresIn: (process.env.JWT_REFRESH_EXPIRATION_TIME || '7d') as any,
    });
    return refreshToken;
};

// Generate email verification token
export const generateEmailVerificationToken = (userId: string, email: string): string => {
    const payload = {
        userId,
        email,
        type: 'email_verification'
    };
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET is not defined in environment variables');
    }

    const verificationToken = jwt.sign(payload, secret, {
        expiresIn: (process.env.JWT_EMAIL_VERIFICATION_EXPIRATION || '24h') as any,
    });
    return verificationToken;
};

// Verify email verification token
export const verifyEmailVerificationToken = (token: string): EmailVerificationPayload => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET is not defined in environment variables');
    }

    try {
        const decoded = jwt.verify(token, secret) as EmailVerificationPayload;

        // Verify token type
        if (decoded.type !== 'email_verification') {
            throw new Error('Invalid token type');
        }

        return decoded;
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            throw new Error('Verification token has expired');
        } else if (error instanceof jwt.JsonWebTokenError) {
            throw new Error('Invalid verification token');
        } else {
            throw error;
        }
    }
};

// Verify refresh token
export const verifyRefreshToken = (token: string): JwtPayload => {
    const secret = process.env.JWT_REFRESH_SECRET;
    if (!secret) {
        throw new Error('JWT_REFRESH_SECRET is not defined in environment variables');
    }

    try {
        const decoded = jwt.verify(token, secret) as JwtPayload;
        return decoded;
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            throw new Error('Refresh token has expired');
        } else if (error instanceof jwt.JsonWebTokenError) {
            throw new Error('Invalid refresh token');
        } else {
            throw error;
        }
    }
};