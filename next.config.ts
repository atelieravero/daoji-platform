import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

// Point the plugin to our request configuration file
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  // You can add other Next.js configurations here later
};

export default withNextIntl(nextConfig);