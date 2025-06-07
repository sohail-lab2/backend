import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const ConfigSchema = z.object({
  MONGODB_URI: z
    .string()
    .url()
    .default('mongodb://localhost:27017/learning-platform'),
  STORAGE_PATH: z
    .string()
    .default('./src/assets'),
  PORT: z.coerce.number().int().positive().default(3000),
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),
  REDIS_HOST: z.string().default('127.0.0.1'),
  REDIS_PORT: z.coerce.number().default(6379),
  NODE_ENV: z
    .enum(['development', 'production'])
    .default('development'),
  CASHFREE_APP_ID: z.string().default(''),
  CASHFREE_SECRET_KEY: z.string().default(''),
  CASHFREE_API_VERSION: z.string().default('2022-09-01'),
});

const parsedConfig = ConfigSchema.safeParse(process.env);

if (!parsedConfig.success) {
  console.error(
    '❌ Invalid environment variables:',
    parsedConfig.error.format(),
  );
  throw new Error('Invalid environment configuration');
}

export const config = {
  dbUri: parsedConfig.data.MONGODB_URI,
  port: parsedConfig.data.PORT,
  frontendUrl: parsedConfig.data.FRONTEND_URL,
  nodeEnv: parsedConfig.data.NODE_ENV,
  redisHost: parsedConfig.data.REDIS_HOST,
  redisPort: parsedConfig.data.REDIS_PORT,
  storagePath: parsedConfig.data.STORAGE_PATH,
  photoUploadPath: parsedConfig.data.STORAGE_PATH + "/profiles",
  coursePath: parsedConfig.data.STORAGE_PATH + "/courses",
  certificateStoragePath: parsedConfig.data.STORAGE_PATH + "/certificates",
  cashfreeAppId: parsedConfig.data.CASHFREE_APP_ID,
  cashfreeSecretKey: parsedConfig.data.CASHFREE_SECRET_KEY,
  cashfreeApiVersion: parsedConfig.data.CASHFREE_API_VERSION,
  firebase: {
    type: process.env.FIREBASE_TYPE,
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    clientId: process.env.FIREBASE_CLIENT_ID,
    authUri: process.env.FIREBASE_AUTH_URI,
    tokenUri: process.env.FIREBASE_TOKEN_URI,
    authProviderX509CertUrl: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
    clientX509CertUrl: process.env.FIREBASE_CLIENT_X509_CERT_URL,
    universeDomain: process.env.FIREBASE_UNIVERSE_DOMAIN
  }
} as const;
