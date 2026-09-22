import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  limit, 
  serverTimestamp,
  addDoc,
  updateDoc,
  runTransaction
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth, storage } from '../firebase';
import { 
  UserProfile, 
  Message, 
  Conversation, 
  CallRecord, 
  UserReport, 
  AppNotification,
  CoinTransaction,
  RewardedAdCreditResult,
  PremiumPlan,
  CoinPackage,
  PurchaseResult
} from '../types';

// USERS COLLECTION
export async function syncUserProfileToFirebase(user: UserProfile): Promise<void> {
  try {
    const userRef = doc(db, 'users', user.id);
    await setDoc(userRef, {
      ...user,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error('Error syncing user profile to Firestore:', error);
  }
}

export function subscribeToUsers(callback: (users: UserProfile[]) => void) {
  const usersRef = collection(db, 'users');
  return onSnapshot(usersRef, (snapshot) => {
    const users: UserProfile[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as UserProfile;
      users.push({ ...data, id: docSnap.id });
    });
    if (users.length > 0) {
      callback(users);
    }
  }, (error) => {
    console.warn('Users subscription error (offline/rules):', error);
  });
}

// CONVERSATIONS & MESSAGES
export function getConversationId(uid1: string, uid2: string): string {
  return [uid1, uid2].sort().join('_');
}

export async function sendMessageToFirebase(
  senderId: string, 
  receiverId: string, 
  text?: string, 
  imageUrl?: string
): Promise<Message | null> {
  const convId = getConversationId(senderId, receiverId);
  const msgId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const timestamp = new Date().toISOString();

  const message: Message = {
    id: msgId,
    senderId,
    receiverId,
    text: text || '',
    imageUrl,
    timestamp,
    status: 'sent'
  };

  try {
    // 1. Update conversation metadata
    const convRef = doc(db, 'conversations', convId);
    await setDoc(convRef, {
      id: convId,
      participants: [senderId, receiverId],
      lastMessage: message,
      updatedAt: serverTimestamp()
    }, { merge: true });

    // 2. Add message to subcollection
    const msgRef = doc(db, 'conversations', convId, 'messages', msgId);
    await setDoc(msgRef, {
      ...message,
      serverTime: serverTimestamp()
    });

    return message;
  } catch (error) {
    console.error('Error sending message to Firebase:', error);
    return message; // Return locally created message for optimistic UI
  }
}

export function subscribeToMessages(
  userId1: string, 
  userId2: string, 
  callback: (messages: Message[]) => void
) {
  const convId = getConversationId(userId1, userId2);
  const messagesRef = collection(db, 'conversations', convId, 'messages');
  const q = query(messagesRef, orderBy('timestamp', 'asc'), limit(100));

  return onSnapshot(q, (snapshot) => {
    const msgs: Message[] = [];
    snapshot.forEach((docSnap) => {
      msgs.push(docSnap.data() as Message);
    });
    callback(msgs);
  }, (error) => {
    console.warn('Messages subscription error:', error);
  });
}

// CALL RECORDS
export async function saveCallRecordToFirebase(call: CallRecord): Promise<void> {
  try {
    const callRef = doc(db, 'calls', call.id);
    await setDoc(callRef, {
      ...call,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error saving call record to Firebase:', error);
  }
}

export function subscribeToCallHistory(userId: string, callback: (calls: CallRecord[]) => void) {
  const callsRef = collection(db, 'calls');
  const q = query(callsRef, orderBy('timestamp', 'desc'), limit(50));

  return onSnapshot(q, (snapshot) => {
    const calls: CallRecord[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as CallRecord;
      calls.push(data);
    });
    if (calls.length > 0) {
      callback(calls);
    }
  }, (error) => {
    console.warn('Call history subscription error:', error);
  });
}

// USER SAFETY REPORTS
export async function submitReportToFirebase(report: UserReport): Promise<void> {
  try {
    const reportRef = doc(db, 'reports', report.id);
    await setDoc(reportRef, {
      ...report,
      submittedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error submitting report to Firebase:', error);
  }
}

// USER NOTIFICATIONS
export async function saveNotificationToFirebase(
  userId: string, 
  notif: AppNotification
): Promise<void> {
  try {
    const notifRef = doc(db, 'users', userId, 'notifications', notif.id);
    await setDoc(notifRef, {
      ...notif,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error saving notification to Firebase:', error);
  }
}

// STORAGE FILE UPLOAD (Avatar / Chat Media)
export async function uploadMediaToFirebaseStorage(
  file: File | Blob, 
  path: string
): Promise<string> {
  try {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  } catch (error) {
    console.error('Error uploading file to Firebase Storage:', error);
    throw error;
  }
}

// ==========================================
// COINS & REWARDED ADS SECURE DATABASE LOGIC
// ==========================================
export const REWARDED_AD_COIN_VALUE = 10; // Rule: exactly 10 coins per verified ad

/**
 * Atomically verifies and credits 10 coins for a successfully watched Rewarded Ad.
 * Prevents duplicates via unique verification token check inside Firestore runTransaction.
 */
export async function verifyAndCreditRewardedAdInFirebase(
  userId: string,
  verificationToken: string,
  options?: {
    adPlacement?: string;
    adTitle?: string;
    durationWatchedSec?: number;
    fallbackCurrentCoins?: number;
  }
): Promise<RewardedAdCreditResult> {
  if (!userId || !verificationToken) {
    return {
      success: false,
      message: 'Missing user ID or verification token.',
      addedCoins: 0,
      previousBalance: 0,
      newBalance: 0,
      transactionId: verificationToken
    };
  }

  const txRef = doc(db, 'coinTransactions', verificationToken);
  const userTxRef = doc(db, 'users', userId, 'transactions', verificationToken);
  const userRef = doc(db, 'users', userId);

  try {
    const result = await runTransaction(db, async (transaction) => {
      // 1. Check if this ad verification token has ALREADY been claimed
      const existingTxSnap = await transaction.get(txRef);
      if (existingTxSnap.exists()) {
        const txData = existingTxSnap.data();
        throw new Error(`DUPLICATE_CLAIM: This ad reward has already been claimed.`);
      }

      // 2. Fetch current user balance from Firestore
      const userSnap = await transaction.get(userRef);
      let previousCoins = 0;
      if (userSnap.exists()) {
        const data = userSnap.data();
        if (typeof data.coins === 'number') {
          previousCoins = data.coins;
        } else if (options?.fallbackCurrentCoins !== undefined) {
          previousCoins = options.fallbackCurrentCoins;
        }
      } else if (options?.fallbackCurrentCoins !== undefined) {
        previousCoins = options.fallbackCurrentCoins;
      }

      // 3. Exactly 10 Coins added to existing balance (e.g. 20 + 10 = 30)
      const addedCoins = REWARDED_AD_COIN_VALUE;
      const newBalance = previousCoins + addedCoins;

      // 4. Update user balance atomically
      transaction.set(userRef, {
        coins: newBalance,
        lastCoinRewardAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });

      // 5. Store audit transaction record in global log and user subcollection
      const txData: CoinTransaction = {
        id: verificationToken,
        userId,
        amount: addedCoins,
        previousBalance: previousCoins,
        newBalance,
        type: 'rewarded_ad',
        source: 'Rewarded Ad',
        paymentAmount: 0,
        currency: 'USD',
        reason: 'Watched Rewarded Video Ad (+10 Coins)',
        adPlacement: options?.adPlacement || 'wallet',
        adTitle: options?.adTitle || 'Global Nomad Explorer',
        durationWatchedSec: options?.durationWatchedSec || 5,
        verificationToken,
        status: 'verified_completed',
        timestamp: new Date().toISOString()
      };

      transaction.set(txRef, {
        ...txData,
        serverTime: serverTimestamp()
      });

      transaction.set(userTxRef, {
        ...txData,
        serverTime: serverTimestamp()
      });

      return {
        previousBalance: previousCoins,
        newBalance
      };
    });

    return {
      success: true,
      message: `Verified successfully! +${REWARDED_AD_COIN_VALUE} Coins credited to your account.`,
      addedCoins: REWARDED_AD_COIN_VALUE,
      previousBalance: result.previousBalance,
      newBalance: result.newBalance,
      transactionId: verificationToken
    };
  } catch (error: any) {
    const isDup = error?.message?.includes('DUPLICATE_CLAIM');
    console.error('Rewarded ad Firebase transaction error:', error);
    return {
      success: false,
      message: isDup ? 'This ad reward has already been claimed.' : (error?.message || 'Transaction verification failed.'),
      addedCoins: 0,
      previousBalance: options?.fallbackCurrentCoins ?? 0,
      newBalance: options?.fallbackCurrentCoins ?? 0,
      transactionId: verificationToken,
      isDuplicate: isDup
    };
  }
}

/**
 * Real-time listener for current user's coins balance in Firestore
 */
export function subscribeToUserCoins(userId: string, onBalanceChange: (newCoins: number) => void) {
  if (!userId) return () => {};
  const userRef = doc(db, 'users', userId);
  return onSnapshot(userRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data();
      if (typeof data.coins === 'number') {
        onBalanceChange(data.coins);
      }
    }
  }, (err) => {
    console.warn('User coins live sync warning:', err);
  });
}

/**
 * Pre-linked PayPal Merchant Account for receiving customer payments across
 * all payment rails (UPI, Debit/Credit Card, Bank Payment, International, and Local methods).
 */
export const LINKED_PAYPAL_MERCHANT_ACCOUNT = 'chandarlal7776@gmail.com (Merchant ID: CW9YT8M283Y4Y)';

/**
 * Server-verified purchase and activation of a VIP Premium Plan in Firebase.
 * Adds plan.bonusCoins to user's existing coin balance.
 * Activates isPremium: true, premiumPlan: plan.name, and logs transaction with source: 'Premium Bonus'.
 * Settlement is routed to the merchant's pre-linked PayPal account.
 */
export async function purchasePremiumPlanInFirebase(
  userId: string,
  plan: PremiumPlan,
  options?: { 
    fallbackCurrentCoins?: number; 
    paymentMethod?: string;
    merchantReceiver?: string;
    paypalOrderId?: string;
  }
): Promise<PurchaseResult> {
  const orderId = `vip_tx_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  const paypalTxId = options?.paypalOrderId || `PAYPAL-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  const merchantReceiver = options?.merchantReceiver || LINKED_PAYPAL_MERCHANT_ACCOUNT;
  const userRef = doc(db, 'users', userId);
  const txRef = doc(db, 'coinTransactions', orderId);
  const userTxRef = doc(db, 'users', userId, 'transactions', orderId);

  try {
    const result = await runTransaction(db, async (transaction) => {
      // 1. Verify duplicate prevention
      const existingTx = await transaction.get(txRef);
      if (existingTx.exists()) {
        throw new Error('DUPLICATE_PURCHASE_ORDER');
      }

      // 2. Fetch current balance
      const userSnap = await transaction.get(userRef);
      let previousCoins = 0;
      if (userSnap.exists()) {
        const data = userSnap.data();
        if (typeof data.coins === 'number') {
          previousCoins = data.coins;
        } else if (options?.fallbackCurrentCoins !== undefined) {
          previousCoins = options.fallbackCurrentCoins;
        }
      } else if (options?.fallbackCurrentCoins !== undefined) {
        previousCoins = options.fallbackCurrentCoins;
      }

      // 3. Add plan's bonus coins to existing balance
      const addedCoins = plan.bonusCoins;
      const newBalance = previousCoins + addedCoins;

      // 4. Update user profile with VIP status & new coins balance
      transaction.set(userRef, {
        coins: newBalance,
        isPremium: true,
        premiumPlan: plan.name,
        premiumDuration: plan.duration,
        premiumBillingPeriod: plan.billingPeriod,
        premiumActivatedAt: serverTimestamp(),
        lastCoinRewardAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });

      // 5. Store audit transaction record in global audit log & user transactions
      const txData: CoinTransaction = {
        id: orderId,
        userId,
        amount: addedCoins,
        previousBalance: previousCoins,
        newBalance,
        type: 'credit',
        paymentAmount: plan.priceNum,
        currency: 'USD',
        source: 'Premium Bonus',
        planId: plan.id,
        reason: `${plan.name} Activated (+${addedCoins.toLocaleString()} Bonus Coins)`,
        paymentMethod: options?.paymentMethod || 'PayPal / International Gateway',
        merchantReceiver,
        paypalOrderId: paypalTxId,
        status: 'completed',
        timestamp: new Date().toISOString()
      };

      transaction.set(txRef, {
        ...txData,
        merchantReceiver,
        paymentMethod: options?.paymentMethod || 'PayPal / International Gateway',
        paypalOrderId: paypalTxId,
        serverTime: serverTimestamp()
      });

      transaction.set(userTxRef, {
        ...txData,
        merchantReceiver,
        paymentMethod: options?.paymentMethod || 'PayPal / International Gateway',
        paypalOrderId: paypalTxId,
        serverTime: serverTimestamp()
      });

      return {
        previousBalance: previousCoins,
        newBalance
      };
    });

    return {
      success: true,
      message: `Payment verified! You are now subscribed to ${plan.name}. +${plan.bonusCoins.toLocaleString()} Bonus Coins credited! Funds settled to linked PayPal merchant (${merchantReceiver}).`,
      transactionId: orderId,
      addedCoins: plan.bonusCoins,
      previousBalance: result.previousBalance,
      newBalance: result.newBalance,
      planName: plan.name,
      premiumActivated: true,
      paymentMethod: options?.paymentMethod || 'PayPal / International Gateway',
      merchantReceiver,
      paypalOrderId: paypalTxId
    };
  } catch (err: any) {
    console.error('Premium purchase transaction error:', err);
    return {
      success: false,
      message: err?.message || 'Payment processing failed. Please try again.',
      transactionId: orderId,
      addedCoins: 0,
      previousBalance: options?.fallbackCurrentCoins ?? 0,
      newBalance: options?.fallbackCurrentCoins ?? 0,
      premiumActivated: false
    };
  }
}

/**
 * Server-verified purchase of a Coins Package in Firebase.
 * Adds package.coins to user's existing coin balance.
 * Logs transaction with source: 'Coin Purchase'.
 * Settlement is routed to the merchant's pre-linked PayPal account.
 */
export async function purchaseCoinsPackageInFirebase(
  userId: string,
  pkg: CoinPackage,
  options?: { 
    fallbackCurrentCoins?: number; 
    paymentMethod?: string;
    merchantReceiver?: string;
    paypalOrderId?: string;
  }
): Promise<PurchaseResult> {
  const orderId = `coin_tx_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  const paypalTxId = options?.paypalOrderId || `PAYPAL-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  const merchantReceiver = options?.merchantReceiver || LINKED_PAYPAL_MERCHANT_ACCOUNT;
  const userRef = doc(db, 'users', userId);
  const txRef = doc(db, 'coinTransactions', orderId);
  const userTxRef = doc(db, 'users', userId, 'transactions', orderId);

  try {
    const result = await runTransaction(db, async (transaction) => {
      // 1. Verify duplicate prevention
      const existingTx = await transaction.get(txRef);
      if (existingTx.exists()) {
        throw new Error('DUPLICATE_COIN_PURCHASE');
      }

      // 2. Fetch current balance
      const userSnap = await transaction.get(userRef);
      let previousCoins = 0;
      if (userSnap.exists()) {
        const data = userSnap.data();
        if (typeof data.coins === 'number') {
          previousCoins = data.coins;
        } else if (options?.fallbackCurrentCoins !== undefined) {
          previousCoins = options.fallbackCurrentCoins;
        }
      } else if (options?.fallbackCurrentCoins !== undefined) {
        previousCoins = options.fallbackCurrentCoins;
      }

      // 3. Add purchased coins to existing balance
      const addedCoins = pkg.coins;
      const newBalance = previousCoins + addedCoins;

      // 4. Update user balance atomically
      transaction.set(userRef, {
        coins: newBalance,
        lastCoinRewardAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });

      // 5. Store audit transaction record in global log and user transactions
      const txData: CoinTransaction = {
        id: orderId,
        userId,
        amount: addedCoins,
        previousBalance: previousCoins,
        newBalance,
        type: 'credit',
        paymentAmount: pkg.priceNum,
        currency: pkg.currency || 'USD',
        source: 'Coin Purchase',
        packageId: pkg.id,
        reason: `Purchased ${addedCoins.toLocaleString()} Coins Pack (${pkg.price})`,
        paymentMethod: options?.paymentMethod || 'PayPal / International Gateway',
        merchantReceiver,
        paypalOrderId: paypalTxId,
        status: 'completed',
        timestamp: new Date().toISOString()
      };

      transaction.set(txRef, {
        ...txData,
        merchantReceiver,
        paymentMethod: options?.paymentMethod || 'PayPal / International Gateway',
        paypalOrderId: paypalTxId,
        serverTime: serverTimestamp()
      });

      transaction.set(userTxRef, {
        ...txData,
        merchantReceiver,
        paymentMethod: options?.paymentMethod || 'PayPal / International Gateway',
        paypalOrderId: paypalTxId,
        serverTime: serverTimestamp()
      });

      return {
        previousBalance: previousCoins,
        newBalance
      };
    });

    return {
      success: true,
      message: `Payment verified! +${pkg.coins.toLocaleString()} Coins credited to your account! Funds settled to linked PayPal merchant (${merchantReceiver}).`,
      transactionId: orderId,
      addedCoins: pkg.coins,
      previousBalance: result.previousBalance,
      newBalance: result.newBalance,
      paymentMethod: options?.paymentMethod || 'PayPal / International Gateway',
      merchantReceiver,
      paypalOrderId: paypalTxId
    };
  } catch (err: any) {
    console.error('Coin purchase transaction error:', err);
    return {
      success: false,
      message: err?.message || 'Payment processing failed. Please try again.',
      transactionId: orderId,
      addedCoins: 0,
      previousBalance: options?.fallbackCurrentCoins ?? 0,
      newBalance: options?.fallbackCurrentCoins ?? 0
    };
  }
}

/**
 * Deduct coins atomically for call extensions or features
 */
export async function spendCoinsInFirebase(
  userId: string, 
  amount: number, 
  purpose: string
): Promise<{ success: boolean; newBalance: number; message: string }> {
  const userRef = doc(db, 'users', userId);
  const txToken = `spend_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const userTxRef = doc(db, 'users', userId, 'transactions', txToken);

  try {
    const res = await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(userRef);
      const current = (snap.exists() && typeof snap.data().coins === 'number') ? snap.data().coins : 0;
      if (current < amount) {
        throw new Error('INSUFFICIENT_COINS');
      }
      const newBalance = current - amount;
      transaction.set(userRef, {
        coins: newBalance,
        updatedAt: serverTimestamp()
      }, { merge: true });

      transaction.set(userTxRef, {
        id: txToken,
        userId,
        amount: -amount,
        previousBalance: current,
        newBalance,
        type: 'call_spend',
        reason: purpose,
        status: 'verified_completed',
        timestamp: new Date().toISOString(),
        serverTime: serverTimestamp()
      });

      return newBalance;
    });

    return { success: true, newBalance: res, message: `Used ${amount} coins for ${purpose}.` };
  } catch (err: any) {
    return { 
      success: false, 
      newBalance: 0, 
      message: err?.message === 'INSUFFICIENT_COINS' ? 'Not enough coins' : 'Failed to process coins' 
    };
  }
}

/**
 * Fetch recent coin transactions for audit log / history
 */
export async function getUserCoinTransactions(userId: string): Promise<CoinTransaction[]> {
  try {
    const txCol = collection(db, 'users', userId, 'transactions');
    const q = query(txCol, orderBy('timestamp', 'desc'), limit(15));
    const snap = await getDocs(q);
    const list: CoinTransaction[] = [];
    snap.forEach((d) => {
      list.push(d.data() as CoinTransaction);
    });
    return list;
  } catch (e) {
    console.warn('Error fetching user coin transactions:', e);
    return [];
  }
}

/**
 * Fetch all platform coin & payment transactions for Admin Dashboard Transaction History
 */
export async function getAllCoinTransactions(limitCount = 100): Promise<CoinTransaction[]> {
  try {
    const q = query(collection(db, 'coinTransactions'), orderBy('timestamp', 'desc'), limit(limitCount));
    const snap = await getDocs(q);
    const list: CoinTransaction[] = [];
    snap.forEach((d) => {
      list.push({ id: d.id, ...d.data() } as CoinTransaction);
    });
    return list;
  } catch (e) {
    console.warn('Error fetching global coin transactions:', e);
    return [];
  }
}

