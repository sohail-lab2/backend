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
<<<<<<< HEAD
  GOOGLE_SCRIPT_URL: z.string().url().optional(),
  GOOGLE_SCRIPT_VERIFICATION_CODE: z.string().optional(),
  // Firebase configuration
  FIREBASE_TYPE: z.string().default('service_account'),
  FIREBASE_PROJECT_ID: z.string(),
  FIREBASE_PRIVATE_KEY_ID: z.string(),
  FIREBASE_PRIVATE_KEY: z.string(),
  FIREBASE_CLIENT_EMAIL: z.string().email(),
  FIREBASE_CLIENT_ID: z.string(),
  FIREBASE_AUTH_URI: z.string().url(),
  FIREBASE_TOKEN_URI: z.string().url(),
  FIREBASE_AUTH_PROVIDER_X509_CERT_URL: z.string().url(),
  FIREBASE_CLIENT_X509_CERT_URL: z.string().url(),
  FIREBASE_UNIVERSE_DOMAIN: z.string().default('googleapis.com'),
=======
  FIREBASE_TYPE: z.string(),
  FIREBASE_PROJECT_ID: z.string(),
  FIREBASE_PRIVATE_KEY_ID: z.string(),
  FIREBASE_PRIVATE_KEY: z.string(),
  FIREBASE_CLIENT_EMAIL: z.string(),
  FIREBASE_CLIENT_ID: z.string(),
  FIREBASE_AUTH_URI: z.string(),
  FIREBASE_TOKEN_URI: z.string(),
  FIREBASE_AUTH_PROVIDER_X509_CERT_URL: z.string(),
  FIREBASE_CLIENT_X509_CERT_URL: z.string(),
  FIREBASE_UNIVERSE_DOMAIN: z.string(),
>>>>>>> df60681d70ae1bb524012301a45ca9880f84fbdc
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
<<<<<<< HEAD
  googleScriptUrl: parsedConfig.data.GOOGLE_SCRIPT_URL,
  googleScriptVerificationCode: parsedConfig.data.GOOGLE_SCRIPT_VERIFICATION_CODE,
  // Firebase configuration
=======
>>>>>>> df60681d70ae1bb524012301a45ca9880f84fbdc
  firebase: {
    type: parsedConfig.data.FIREBASE_TYPE,
    projectId: parsedConfig.data.FIREBASE_PROJECT_ID,
    privateKeyId: parsedConfig.data.FIREBASE_PRIVATE_KEY_ID,
    privateKey: parsedConfig.data.FIREBASE_PRIVATE_KEY,
    clientEmail: parsedConfig.data.FIREBASE_CLIENT_EMAIL,
    clientId: parsedConfig.data.FIREBASE_CLIENT_ID,
    authUri: parsedConfig.data.FIREBASE_AUTH_URI,
    tokenUri: parsedConfig.data.FIREBASE_TOKEN_URI,
    authProviderX509CertUrl: parsedConfig.data.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
    clientX509CertUrl: parsedConfig.data.FIREBASE_CLIENT_X509_CERT_URL,
    universeDomain: parsedConfig.data.FIREBASE_UNIVERSE_DOMAIN,
  },
} as const;
