const { withSentryConfig } = require('@sentry/nextjs')

/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV !== 'production'

const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },

  // Security headers
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        {
          key: 'X-Robots-Tag',
          value: 'noindex, nofollow, noarchive',
        },
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin',
        },
        {
          key: 'Permissions-Policy',
          value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
        },
        {
          key: 'Content-Security-Policy',
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://clerk.com https://*.clerk.accounts.dev https://embed.tawk.to https://*.tawk.to",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://embed.tawk.to https://*.tawk.to",
            "font-src 'self' https://fonts.gstatic.com",
            "img-src 'self' data: https: blob:",
            [
              "connect-src 'self' https://clerk.com https://*.clerk.accounts.dev https://clerk-telemetry.com https://*.sentry.io https://*.tawk.to wss: wss://*.tawk.to",
              ...(isDev ? ['http://127.0.0.1:7244'] : []),
            ].join(' '),
            "frame-src 'self' https://clerk.com https://*.clerk.accounts.dev https://*.tawk.to",
            "worker-src 'self' blob:",
            "frame-ancestors 'none'",
          ].join('; '),
        },
      ],
    },
  ],

  // Webpack configuration for argon2
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push({
        argon2: 'commonjs argon2',
      })
    }
    return config
  },
}

// Sentry configuration - only apply if SENTRY_DSN is set
const sentryWebpackPluginOptions = {
  org: process.env.SENTRY_ORG || 'vite-seo',
  project: process.env.SENTRY_PROJECT || 'viteseo-portal',
  silent: !process.env.CI,
}

const sentryOptions = {
  widenClientFileUpload: true,
  hideSourceMaps: true,
  tunnelRoute: '/monitoring',
  webpack: {
    treeshake: {
      removeDebugLogging: true,
    },
    automaticVercelMonitors: true,
  },
}

module.exports = process.env.SENTRY_DSN
  ? withSentryConfig(nextConfig, sentryWebpackPluginOptions, sentryOptions)
  : nextConfig
