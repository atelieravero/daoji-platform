import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

// This intercepts incoming requests and redirects them to the correct locale
export default createMiddleware(routing);
 
export const config = {
  // Match only internationalized pathnames. 
  // We explicitly ignore our /api routes, /admin routes, and static files.
  matcher: [
    '/', 
    '/(zh|en)/:path*',
    // Match all pathnames except for
    // - /api (API routes)
    // - /admin (Admin Portal - which shouldn't be localized)
    // - _next (Next.js internals)
    // - public files (e.g. images, fonts)
    '/((?!api|admin|_next|_vercel|.*\\..*).*)'
  ]
};