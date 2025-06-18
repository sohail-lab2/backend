import * as admin from 'firebase-admin';
import { config } from './variables.config';

const serviceAccount = {
  type: config.firebase.type,
  project_id: config.firebase.projectId,
  private_key_id: config.firebase.privateKeyId,
  private_key: config.firebase.privateKey.replace(/\\n/g, '\n'),
  client_email: config.firebase.clientEmail,
  client_id: config.firebase.clientId,
  auth_uri: config.firebase.authUri,
  token_uri: config.firebase.tokenUri,
  auth_provider_x509_cert_url: config.firebase.authProviderX509CertUrl,
  client_x509_cert_url: config.firebase.clientX509CertUrl,
  universe_domain: config.firebase.universeDomain
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
});

export const auth = admin.auth();
export const firestore = admin.firestore();

export const verifyToken = async (token: string) => {
  try {
    const decodedToken = await auth.verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    throw new Error('Invalid token');
  }
};

export const getUserRole = async (uid: string) => {
  try {
    const user = await auth.getUser(uid);
    return user.customClaims?.role || null;
  } catch (error) {
    throw new Error('Error fetching user role');
  }
};
