import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.string().default('development'),
  PORT: z.coerce.number().default(5000),
  BASE_DEV_URL: z.string().default('http://0.0.0.0:5000/api'),
  BASE_CODEX_URL: z.string().default('https://conduit.replit.app/api'),
  DATABASE_URL: z.string().optional(),
  TEST_DATABASE_URL: z.string().optional(),
  SESSION_SECRET: z
    .string()
    .default('mining-syndicate-dev-secret-2025-very-secure-random-string-32chars-minimum'),
  HUBSPOT_API_KEY: z.string().optional(),
  AUTH_DISABLED: z.string().optional(),
  STORAGE_MODE: z.string().optional(),
  REPLIT_DOMAINS: z.string().optional(),
  REPLIT_DEV_DOMAIN: z.string().optional(),
  ISSUER_URL: z.string().optional(),
  REPL_ID: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_OAUTH_CALLBACK_URL: z.string().optional(),
  REPLIT_SIDECAR_ENDPOINT: z.string().optional(),
  PUBLIC_OBJECT_SEARCH_PATHS: z.string().optional(),
  PRIVATE_OBJECT_DIR: z.string().optional(),
  LOG_LEVEL: z.string().default('info'),
});

const env = envSchema.parse(process.env);

const authDisabled = env.AUTH_DISABLED === 'true';

const databaseUrl = env.NODE_ENV === 'test'
  ? env.TEST_DATABASE_URL ?? env.DATABASE_URL
  : env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL must be set. Did you forget to provision a database?');
}

if (!authDisabled) {
  if (!env.GOOGLE_CLIENT_ID) {
    throw new Error('GOOGLE_CLIENT_ID is required when authentication is enabled');
  }
  if (!env.GOOGLE_CLIENT_SECRET) {
    throw new Error('GOOGLE_CLIENT_SECRET is required when authentication is enabled');
  }
  if (!env.REPL_ID) {
    throw new Error('REPL_ID is required when authentication is enabled');
  }
}

const config = {
  nodeEnv: env.NODE_ENV,
  port: env.PORT,
  baseDevUrl: env.BASE_DEV_URL,
  baseCodexUrl: env.BASE_CODEX_URL,
  hubspotApiKey: env.HUBSPOT_API_KEY,
  authDisabled,
  storageMode: env.STORAGE_MODE,
  sessionSecret: env.SESSION_SECRET,
  databaseUrl,
  replit: {
    domains: (env.REPLIT_DOMAINS ?? env.REPLIT_DEV_DOMAIN ?? 'conduit.replit.app')
      .split(',')
      .map((d) => d.trim())
      .filter(Boolean),
    issuerUrl: env.ISSUER_URL ?? 'https://replit.com/oidc',
    replId: env.REPL_ID,
  },
  google: {
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
    oauthCallbackUrl:
      env.GOOGLE_OAUTH_CALLBACK_URL ?? 'https://conduit.replit.app/api/auth/google/callback',
  },
  objectStorage: {
    replitSidecarEndpoint: env.REPLIT_SIDECAR_ENDPOINT,
    publicObjectSearchPaths: env.PUBLIC_OBJECT_SEARCH_PATHS,
    privateObjectDir: env.PRIVATE_OBJECT_DIR,
  },
  logLevel: env.LOG_LEVEL,
};

export type Config = typeof config;
export { config };
