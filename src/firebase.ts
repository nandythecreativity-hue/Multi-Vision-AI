import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { initializeFirestore, doc, getDoc, setDoc, updateDoc, onSnapshot, getDocFromServer, increment, query, where, getDocs, collection, deleteDoc, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';

// Import the provisioned Firebase configuration
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Use initializeFirestore with the provisioned database ID
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, firebaseConfig.firestoreDatabaseId || '(default)');

// Analytics is disabled in this environment to prevent "Failed to fetch" errors in the sandboxed iframe.
export const analytics = null;

export const googleProvider = new GoogleAuthProvider();

// Auth functions
export const loginWithGoogle = () => signInWithPopup(auth, googleProvider);
export const logout = () => signOut(auth);

// Firestore Error Handling
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test connection
async function testConnection() {
  try {
    // Attempt to get a document from a non-existent collection to test connectivity
    await getDocFromServer(doc(db, '_connection_test_', 'ping'));
  } catch (error) {
    if (error instanceof Error && (error.message.includes('the client is offline') || error.message.includes('Failed to get document'))) {
      console.error("CRITICAL: Firestore is unreachable. Please ensure you have created the Firestore database in the Firebase Console for project 'multy-vision-ai'.");
    }
  }
}
testConnection();

export { onAuthStateChanged, increment, doc, getDoc, setDoc, updateDoc, onSnapshot, query, where, getDocs, collection, deleteDoc, orderBy, addDoc, serverTimestamp };
export type { FirebaseUser };
