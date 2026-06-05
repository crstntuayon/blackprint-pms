import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    outputFileTracingIncludes: {
      "/api/health": ["./node_modules/.prisma/client/**/*"],
      "/api/register": ["./node_modules/.prisma/client/**/*"],
      "/api/login": ["./node_modules/.prisma/client/**/*"],
      "/api/print": ["./node_modules/.prisma/client/**/*"],
      "/api/messages": ["./node_modules/.prisma/client/**/*"],
      "/api/receipts": ["./node_modules/.prisma/client/**/*"],
      "/api/settings": ["./node_modules/.prisma/client/**/*"],
      "/api/users": ["./node_modules/.prisma/client/**/*"],
      "/api/admin": ["./node_modules/.prisma/client/**/*"],
      "/api/stats": ["./node_modules/.prisma/client/**/*"],
      "/api/cron": ["./node_modules/.prisma/client/**/*"],
    },
  },
};

export default nextConfig;
