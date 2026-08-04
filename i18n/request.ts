import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

/**
 * This function is called once per request by Next.js.
 * It dynamically loads the correct JSON dictionary based on the URL locale.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }
 
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default
  };
});