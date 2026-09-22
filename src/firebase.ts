import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged,
  User as FirebaseUser 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  getDocFromServer,
  collection, 
  query, 
  onSnapshot,
  orderBy,
  limit,
  serverTimestamp,
  addDoc,
  updateDoc
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getMessaging, isSupported } from 'firebase/messaging';
import firebaseConfig from '../firebase-applet-config.json';

// Ensure single Firebase App instance
export const app = getApps().length === 0 
  ? initializeApp(firebaseConfig) 
  : getApp();

// Firebase Auth
export const auth = getAuth(app);

// Firestore (support custom database ID if configured)
export const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Firebase Storage
export const storage = getStorage(app);

// Firebase Cloud Messaging (safely initialized if supported in current browser/webview context)
export let messaging: ReturnType<typeof getMessaging> | null = null;
isSupported().then((supported) => {
  if (supported && typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      messaging = getMessaging(app);
    } catch (e) {
      console.warn('Firebase Messaging init skipped:', e);
    }
  }
}).catch(() => {
  // Messaging not supported in current environment (e.g. sandbox iframe without SW permissions)
});

// Android Package Config verification reference
export const ANDROID_CLIENT_CONFIG = {
  packageName: 'com.globalmeet.app',
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket,
  databaseUrl: 'https://globalmeet-21815-default-rtdb.firebaseio.com'
};

export interface FirebaseConnectionStatus {
  connected: boolean;
  error?: string;
  projectId: string;
  databaseId: string;
  authenticated: boolean;
  userUid?: string;
  lastChecked: string;
}

// Connection test and bootstrap validation
export async function verifyFirebaseConnection(): Promise<FirebaseConnectionStatus> {
  const result: FirebaseConnectionStatus = {
    connected: false,
    projectId: firebaseConfig.projectId,
    databaseId: firebaseConfig.firestoreDatabaseId || '(default)',
    authenticated: !!auth.currentUser,
    userUid: auth.currentUser?.uid,
    lastChecked: new Date().toISOString()
  };

  try {
    // 1. Ensure user is authenticated (anonymously if not logged in)
    if (!auth.currentUser) {
      try {
        const userCred = await signInAnonymously(auth);
        result.authenticated = true;
        result.userUid = userCred.user.uid;
      } catch (authErr: any) {
        console.warn('Anonymous auth note:', authErr?.message);
      }
    }

    // 2. Write a verification heartbeat to Firestore to verify write permission
    const testDocRef = doc(db, 'test', 'connection');
    await setDoc(testDocRef, {
      status: 'active',
      client: 'GlobalMeet Android & Web',
      packageName: 'com.globalmeet.app',
      timestamp: serverTimestamp(),
      lastVerified: new Date().toISOString()
    }, { merge: true });

    // 3. Read back from server directly (per firebase-integration skill constraint)
    const snapshot = await getDocFromServer(testDocRef);
    if (snapshot.exists()) {
      result.connected = true;
    }
  } catch (error: any) {
    console.error('Firebase connection test failed:', error);
    result.error = error?.message || 'Failed to connect to Firestore server';
    // Fallback check: try reading doc
    try {
      const fallbackSnap = await getDoc(doc(db, 'test', 'connection'));
      if (fallbackSnap.exists()) {
        result.connected = true;
      }
    } catch {
      // Keep original error
    }
  }

  return result;
}

// Execute connection test on initialization
verifyFirebaseConnection().then((status) => {
  if (status.connected) {
    console.log('✅ GlobalMeet Firebase successfully connected to Firestore & Auth:', status.projectId);
  } else {
    console.warn('⚠️ GlobalMeet Firebase connection status:', status.error);
  }
});
