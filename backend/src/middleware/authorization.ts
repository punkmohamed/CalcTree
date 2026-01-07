import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload, TokenExpiredError } from 'jsonwebtoken';

// Extend Request interface to include user property
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

// Helper function to create error objects
const createError = (statusCode: number, message: string, code?: string) => {
  const error = new Error(message) as any;
  error.statusCode = statusCode;
  error.code = code;
  return error;
};


// Middleware to check authorization (supports both cookies and Bearer tokens)
// Automatically validates sessions when sessionId is present in token
export const authorize = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    let token: string | undefined;

    // Try to get token from cookies first (primary method)
    if (req.cookies && req.cookies.accessToken) {
        token = req.cookies.accessToken;
    }
    // Fallback to Authorization header (for API clients)
    else if (req.headers['authorization'] && req.headers['authorization'].startsWith('Bearer ')) {
        token = req.headers['authorization'].split(' ')[1];
    }

    if (!token) {
        return next(createError(401, 'Access denied: No authentication token provided' ,'NO_AUTHENTICATION_TOKEN_PROVIDED'));
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;



            req.user = decoded;


        next();
    } catch (error) {
        if (error instanceof TokenExpiredError) {
            return next(createError(401, 'Unauthorized: Token has expired' ,'TOKEN_EXPIRED'));
        }
        next(createError(401, 'Unauthorized: Invalid token' ,'INVALID_TOKEN'));
    }
};


