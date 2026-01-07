// Cookie options - adapts to development/production environment
// Note: This file should only be imported AFTER env vars are loaded (see src/env.ts)
const isProduction = process.env.NODE_ENV === 'production';

export const cookiesOptions = {
  httpOnly: true,
  secure: isProduction, // true in production (HTTPS), false in development (HTTP)
  sameSite: isProduction ? ("strict" as const) : ("lax" as const), // less strict for development
  domain: isProduction ? process.env.COOKIE_DOMAIN : undefined, // only set domain in production
};
