import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

/**
 * We define our supported locales here. 
 * This object is shared between the middleware and the request configuration.
 */
export const routing = defineRouting({
  locales: ['en', 'zh'],
  defaultLocale: 'zh'
});

// We export these typed navigation utilities to use throughout our components
// instead of the default 'next/navigation' methods.
export const { Link, redirect, usePathname, useRouter } = createNavigation(routing);