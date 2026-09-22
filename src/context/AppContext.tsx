import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  UserProfile, 
  Message, 
  Conversation, 
  CallRecord, 
  UserReport, 
  AppNotification, 
  PrivacySettings, 
  AccountStatus,
  ReportCategory,
  CoinTransaction,
  RewardedAdCreditResult,
  PremiumPlan,
  CoinPackage,
  PurchaseResult 
} from '../types';
import { INITIAL_MOCK_USERS, INITIAL_REPORTS, INITIAL_CALL_HISTORY } from '../data/mockData';
import { 
  verifyFirebaseConnection, 
  FirebaseConnectionStatus, 
  db, 
  auth, 
  ANDROID_CLIENT_CONFIG 
} from '../firebase';
import { 
  syncUserProfileToFirebase,
  subscribeToUsers,
  sendMessageToFirebase,
  saveCallRecordToFirebase,
  submitReportToFirebase,
  saveNotificationToFirebase,
  verifyAndCreditRewardedAdInFirebase,
  subscribeToUserCoins,
  spendCoinsInFirebase,
  getUserCoinTransactions,
  getAllCoinTransactions,
  purchasePremiumPlanInFirebase,
  purchaseCoinsPackageInFirebase,
  LINKED_PAYPAL_MERCHANT_ACCOUNT,
  REWARDED_AD_COIN_VALUE
} from '../services/firebaseService';
import { doc, getDoc, setDoc, serverTimestamp, collection, getDocs, writeBatch } from 'firebase/firestore';

export interface ActiveCallState {
  peer: UserProfile;
  state: 'requesting' | 'ringing' | 'connected' | 'ended';
  duration: number; // in seconds
  isFreeTrial: boolean;
  freeTrialRemaining: number; // countdown 15s -> 0s
  isMuted: boolean;
  isVideoOff: boolean;
  isSpeakerOn: boolean;
  isFrontCam: boolean;
  isCallPausedDueToTimer: boolean;
}

interface AppContextType {
  // Auth & Onboarding
  currentUser: UserProfile;
  isLoggedIn: boolean;
  isAgeConfirmed: boolean;
  showSplash: boolean;
  showAuthModal: boolean;
  dismissSplash: () => void;
  confirmAge: () => void;
  loginUser: (userData: Partial<UserProfile>) => void;
  logoutUser: () => void;
  setShowAuthModal: (open: boolean) => void;
  updateCurrentUserProfile: (data: Partial<UserProfile>) => void;

  // Navigation
  activeTab: 'home' | 'discover' | 'messages' | 'calls' | 'profile' | 'admin';
  setActiveTab: (tab: 'home' | 'discover' | 'messages' | 'calls' | 'profile' | 'admin') => void;

  // Coins & Premium
  coins: number;
  addCoins: (amount: number, reason: string) => void;
  spendCoins: (amount: number, purpose: string) => boolean;
  isPremiumModalOpen: boolean;
  setPremiumModalOpen: (open: boolean) => void;
  upgradeToPremium: (planName: string) => void;
  cancelPremium: () => void;
  purchasePremiumPlan: (
    plan: PremiumPlan, 
    paymentMethod?: string, 
    checkoutOptions?: { merchantReceiver?: string; paypalOrderId?: string }
  ) => Promise<PurchaseResult>;
  purchaseCoinsPackage: (
    pkg: CoinPackage, 
    paymentMethod?: string, 
    checkoutOptions?: { merchantReceiver?: string; paypalOrderId?: string }
  ) => Promise<PurchaseResult>;
  linkedPayPalMerchant: string;
  updateLinkedPayPalMerchant: (email: string) => Promise<{ success: boolean; message: string }>;

  // Video Calling
  activeCall: ActiveCallState | null;
  startVideoCall: (peer: UserProfile) => void;
  endActiveCall: () => void;
  toggleMute: () => void;
  toggleVideo: () => void;
  toggleSpeaker: () => void;
  toggleCameraFlip: () => void;
  extendCallWithCoins: () => boolean;
  extendCallWithPremium: () => void;
  callHistory: CallRecord[];

  // Messaging
  conversations: Conversation[];
  messages: Record<string, Message[]>;
  activeChatUser: UserProfile | null;
  openChatWith: (user: UserProfile) => void;
  closeChat: () => void;
  sendMessage: (peerId: string, text?: string, imageUrl?: string) => void;

  // Safety & Moderation
  blockedUserIds: string[];
  blockUser: (userId: string) => void;
  unblockUser: (userId: string) => void;
  reports: UserReport[];
  submitReport: (reportedUser: UserProfile, category: ReportCategory, description: string) => void;
  reportModalUser: UserProfile | null;
  setReportModalUser: (user: UserProfile | null) => void;

  // Profile Viewer
  viewingProfile: UserProfile | null;
  setViewingProfile: (user: UserProfile | null) => void;

  // Rewarded Ads & Secure Coins
  isRewardedAdOpen: boolean;
  rewardedAdTriggerContext: 'call_extension' | 'wallet' | null;
  rewardedAdToken: string;
  isRewardVerifying: boolean;
  openRewardedAd: (context?: 'call_extension' | 'wallet') => void;
  closeRewardedAd: (earlySkip?: boolean) => void;
  completeRewardedAd: (tokenToVerify?: string) => Promise<RewardedAdCreditResult>;
  coinTransactions: CoinTransaction[];
  fetchCoinTransactions: () => Promise<CoinTransaction[]>;
  allSystemTransactions: CoinTransaction[];
  fetchAllSystemTransactions: () => Promise<CoinTransaction[]>;

  // Notifications
  notifications: AppNotification[];
  unreadNotificationCount: number;
  markAllNotificationsRead: () => void;
  addNotification: (notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;
  isNotificationCenterOpen: boolean;
  setIsNotificationCenterOpen: (open: boolean) => void;

  // Privacy & Settings
  privacySettings: PrivacySettings;
  updatePrivacySettings: (settings: Partial<PrivacySettings>) => void;

  // Admin Panel
  allUsers: UserProfile[];
  updateUserStatus: (userId: string, status: AccountStatus) => void;
  resolveReport: (reportId: string, actionText: string) => void;
  deleteUserPermanently: (userId: string) => void;

  // Firebase Live Sync & Diagnostics
  firebaseStatus: FirebaseConnectionStatus | null;
  isFirebaseConnected: boolean;
  testFirebaseReadWrite: () => Promise<{ success: boolean; message: string; readData?: any }>;
}

const DEFAULT_CURRENT_USER: UserProfile = {
  id: 'current-user-me',
  username: 'traveler_sam',
  name: 'Samir Verma',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80',
  age: 24,
  country: 'India',
  countryCode: 'IN',
  language: 'Hindi',
  languagesSpoken: ['Hindi', 'English'],
  gender: 'male',
  bio: 'Exploring cultures across the world! Friendly conversations, music and good vibes ✨',
  status: 'online',
  isVerified: true,
  isPremium: false,
  coins: 40,
  photos: [
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=600&auto=format&fit=crop&q=80'
  ],
  accountStatus: 'active',
  joinedAt: '2026-01-10',
};

const DEFAULT_PRIVACY: PrivacySettings = {
  whoCanMessage: 'everyone',
  whoCanCall: 'everyone',
  profileVisibility: 'public',
  showOnlineStatus: true,
  showAge: true,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Splash & Onboarding
  const [showSplash, setShowSplash] = useState<boolean>(() => {
    return localStorage.getItem('gm_splash_shown') !== 'true';
  });

  const [isAgeConfirmed, setIsAgeConfirmed] = useState<boolean>(() => {
    return localStorage.getItem('gm_age_confirmed') === 'true';
  });

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('gm_logged_in') === 'true';
  });

  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);

  // User state
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('gm_current_user');
    return saved ? JSON.parse(saved) : DEFAULT_CURRENT_USER;
  });

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'home' | 'discover' | 'messages' | 'calls' | 'profile' | 'admin'>('home');

  // Linked PayPal Account for Receiving Payments
  const [linkedPayPalMerchant, setLinkedPayPalMerchant] = useState<string>(() => {
    const saved = localStorage.getItem('globalmeet_paypal_merchant');
    if (!saved || saved.includes('mandavi7771')) {
      const def = 'chandarlal7776@gmail.com (Merchant ID: CW9YT8M283Y4Y)';
      localStorage.setItem('globalmeet_paypal_merchant', def);
      return def;
    }
    return saved;
  });

  const updateLinkedPayPalMerchant = async (email: string): Promise<{ success: boolean; message: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return {
        success: false,
        message: 'कृपया एक मान्य (valid) PayPal ईमेल पता दर्ज करें (उदा. username@domain.com)।'
      };
    }

    try {
      setLinkedPayPalMerchant(cleanEmail);
      localStorage.setItem('globalmeet_paypal_merchant', cleanEmail);

      // Save to Firestore systemSettings/payments
      try {
        await setDoc(doc(db, 'systemSettings', 'payments'), {
          paypalMerchantEmail: cleanEmail,
          updatedAt: serverTimestamp(),
          updatedBy: currentUser.id
        }, { merge: true });
      } catch (e) {
        console.warn('Could not persist to Firestore systemSettings:', e);
      }

      addNotification({
        type: 'system',
        title: 'PayPal Account Linked! 🅿️',
        message: `आपका PayPal अकाउंट (${cleanEmail}) पेमेंट रिसीव करने के लिए सफलतापूर्वक लिंक हो गया है।`
      });

      return {
        success: true,
        message: `PayPal अकाउंट (${cleanEmail}) सफलतापूर्वक लिंक हो गया है। अब सभी पेमेंट्स इसी खाते में रिसीव होंगे!`
      };
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || 'PayPal अकाउंट लिंक करने में त्रुटि आई।'
      };
    }
  };

  useEffect(() => {
    const loadPayPalConfig = async () => {
      try {
        const snap = await getDoc(doc(db, 'systemSettings', 'payments'));
        if (snap.exists() && snap.data().paypalMerchantEmail) {
          const remoteEmail = snap.data().paypalMerchantEmail;
          setLinkedPayPalMerchant(remoteEmail);
          localStorage.setItem('globalmeet_paypal_merchant', remoteEmail);
        }
      } catch (e) {
        // local fallback
      }
    };
    loadPayPalConfig();
  }, []);

  // Coins
  const [coins, setCoins] = useState<number>(() => {
    return currentUser.coins ?? 40;
  });

  // Premium Modal
  const [isPremiumModalOpen, setPremiumModalOpen] = useState(false);

  // Call state
  const [activeCall, setActiveCall] = useState<ActiveCallState | null>(null);
  const [callHistory, setCallHistory] = useState<CallRecord[]>(() => {
    const saved = localStorage.getItem('gm_call_history');
    return saved ? JSON.parse(saved) : INITIAL_CALL_HISTORY;
  });

  // Chat & Messaging
  const [allUsers, setAllUsers] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem('gm_all_users');
    return saved ? JSON.parse(saved) : INITIAL_MOCK_USERS;
  });

  const [activeChatUser, setActiveChatUser] = useState<UserProfile | null>(null);

  const [messages, setMessages] = useState<Record<string, Message[]>>(() => {
    return {
      'user-in-1': [
        { id: 'm1', senderId: 'user-in-1', receiverId: 'current-user-me', text: 'Hey Samir! Namaste! How is everything going?', timestamp: '10:42 AM', status: 'read' },
        { id: 'm2', senderId: 'current-user-me', receiverId: 'user-in-1', text: 'Namaste Aarav! All good here, checking out new people from different countries.', timestamp: '10:45 AM', status: 'read' },
      ],
      'user-bd-1': [
        { id: 'm3', senderId: 'user-bd-1', receiverId: 'current-user-me', text: 'Hi! Loved your profile bio. Do you like sketching?', timestamp: 'Yesterday', status: 'read' },
      ],
      'user-ae-1': [
        { id: 'm4', senderId: 'user-ae-1', receiverId: 'current-user-me', text: 'Hello brother! If you ever visit Dubai, let me know! 🌆', timestamp: '2 days ago', status: 'read' },
      ]
    };
  });

  const [conversations, setConversations] = useState<Conversation[]>(() => [
    {
      id: 'conv-1',
      participantId: 'user-in-1',
      lastMessage: { id: 'm2', senderId: 'current-user-me', receiverId: 'user-in-1', text: 'Namaste Aarav! All good here...', timestamp: '10:45 AM', status: 'read' },
      unreadCount: 0
    },
    {
      id: 'conv-2',
      participantId: 'user-bd-1',
      lastMessage: { id: 'm3', senderId: 'user-bd-1', receiverId: 'current-user-me', text: 'Hi! Loved your profile bio. Do you like sketching?', timestamp: 'Yesterday', status: 'read' },
      unreadCount: 1
    },
    {
      id: 'conv-3',
      participantId: 'user-ae-1',
      lastMessage: { id: 'm4', senderId: 'user-ae-1', receiverId: 'current-user-me', text: 'Hello brother! If you ever visit Dubai...', timestamp: '2 days ago', status: 'read' },
      unreadCount: 0
    }
  ]);

  // Safety: Blocked users & Reports
  const [blockedUserIds, setBlockedUserIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('gm_blocked_users');
    return saved ? JSON.parse(saved) : [];
  });

  const [reports, setReports] = useState<UserReport[]>(() => {
    const saved = localStorage.getItem('gm_reports');
    return saved ? JSON.parse(saved) : INITIAL_REPORTS;
  });

  const [reportModalUser, setReportModalUser] = useState<UserProfile | null>(null);
  const [viewingProfile, setViewingProfile] = useState<UserProfile | null>(null);

  // Rewarded Ad & Secure Coins
  const [isRewardedAdOpen, setIsRewardedAdOpen] = useState(false);
  const [rewardedAdTriggerContext, setRewardedAdTriggerContext] = useState<'call_extension' | 'wallet' | null>(null);
  const [rewardedAdToken, setRewardedAdToken] = useState<string>('');
  const [isRewardVerifying, setIsRewardVerifying] = useState<boolean>(false);
  const [coinTransactions, setCoinTransactions] = useState<CoinTransaction[]>([]);
  const [allSystemTransactions, setAllSystemTransactions] = useState<CoinTransaction[]>([]);

  const fetchAllSystemTransactions = async (): Promise<CoinTransaction[]> => {
    try {
      const list = await getAllCoinTransactions(100);
      setAllSystemTransactions(list);
      return list;
    } catch (e) {
      console.warn('Failed to fetch system transactions:', e);
      return [];
    }
  };

  useEffect(() => {
    fetchAllSystemTransactions();
  }, []);

  // Notifications
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([
    {
      id: 'n1',
      type: 'coin',
      title: 'Welcome Bonus Gift',
      message: 'You received +40 free coins for joining GlobalMeet! Enjoy video calls.',
      timestamp: 'Just now',
      read: false,
      rewardAmount: 40
    },
    {
      id: 'n2',
      type: 'view',
      title: 'Profile Viewed',
      message: 'Nusrat Jahan from Bangladesh visited your profile.',
      timestamp: '25m ago',
      read: false,
      actionUserId: 'user-bd-1'
    },
    {
      id: 'n3',
      type: 'system',
      title: 'Safety Guidelines Notice',
      message: 'GlobalMeet is strictly for 18+ users. Zero tolerance for abusive content.',
      timestamp: '1h ago',
      read: true
    }
  ]);

  // Privacy Settings
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>(() => {
    const saved = localStorage.getItem('gm_privacy_settings');
    return saved ? JSON.parse(saved) : DEFAULT_PRIVACY;
  });

  // Firebase Live Sync & Diagnostics State
  const [firebaseStatus, setFirebaseStatus] = useState<FirebaseConnectionStatus | null>(null);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(false);

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem('gm_current_user', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('gm_all_users', JSON.stringify(allUsers));
  }, [allUsers]);

  useEffect(() => {
    localStorage.setItem('gm_blocked_users', JSON.stringify(blockedUserIds));
  }, [blockedUserIds]);

  useEffect(() => {
    localStorage.setItem('gm_reports', JSON.stringify(reports));
  }, [reports]);

  useEffect(() => {
    localStorage.setItem('gm_call_history', JSON.stringify(callHistory));
  }, [callHistory]);

  useEffect(() => {
    localStorage.setItem('gm_privacy_settings', JSON.stringify(privacySettings));
  }, [privacySettings]);

  // Real Firebase Initialization & Health Check
  useEffect(() => {
    let isMounted = true;
    verifyFirebaseConnection()
      .then((status) => {
        if (isMounted) {
          setFirebaseStatus(status);
          setIsFirebaseConnected(status.connected);
        }
      })
      .catch((err) => {
        console.warn('Firebase verification error:', err);
      });
    return () => { isMounted = false; };
  }, []);

  // Sync Current User Profile to Firestore
  useEffect(() => {
    if (currentUser?.id) {
      syncUserProfileToFirebase(currentUser).catch(e => console.warn('User sync note:', e));
    }
  }, [currentUser]);

  // Real-time Firestore Coin Balance Sync for Current User
  useEffect(() => {
    if (!currentUser?.id) return;
    const unsubCoins = subscribeToUserCoins(currentUser.id, (firestoreCoins) => {
      setCoins(firestoreCoins);
      setCurrentUser(prev => {
        if (prev.coins !== firestoreCoins) {
          return { ...prev, coins: firestoreCoins };
        }
        return prev;
      });
    });

    // Also load recent transaction history
    getUserCoinTransactions(currentUser.id).then(setCoinTransactions).catch(console.warn);

    return () => {
      if (unsubCoins) unsubCoins();
    };
  }, [currentUser?.id]);

  // Firestore Real-time Users Subscription & Initial Seeding
  useEffect(() => {
    const unsubscribe = subscribeToUsers((firestoreUsers) => {
      if (firestoreUsers && firestoreUsers.length > 0) {
        setAllUsers(prev => {
          const map = new Map<string, UserProfile>();
          prev.forEach(u => map.set(u.id, u));
          firestoreUsers.forEach(u => map.set(u.id, u));
          return Array.from(map.values());
        });
      }
    });

    // Ensure initial users exist in Firestore for real data discovery
    const seedInitialDataIfNeeded = async () => {
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        if (usersSnap.empty) {
          const batch = writeBatch(db);
          INITIAL_MOCK_USERS.slice(0, 10).forEach(u => {
            const ref = doc(db, 'users', u.id);
            batch.set(ref, { ...u, updatedAt: serverTimestamp() });
          });
          await batch.commit();
        }
      } catch (err) {
        console.warn('Firestore initial check:', err);
      }
    };
    seedInitialDataIfNeeded();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Test real-time read and write to Firestore
  const testFirebaseReadWrite = async () => {
    try {
      const testDocRef = doc(db, 'test', 'read_write_verification');
      const writeData = {
        client: 'GlobalMeet Android & Web App',
        packageName: ANDROID_CLIENT_CONFIG.packageName,
        projectId: ANDROID_CLIENT_CONFIG.projectId,
        testTime: new Date().toISOString(),
        status: 'verified_active',
        verifiedBy: currentUser.username
      };
      await setDoc(testDocRef, writeData);
      const snap = await getDoc(testDocRef);
      if (snap.exists()) {
        setIsFirebaseConnected(true);
        return { 
          success: true, 
          message: `Successfully connected to Firebase Firestore (${ANDROID_CLIENT_CONFIG.projectId})! Live read/write verified.`,
          readData: snap.data()
        };
      }
      return { success: false, message: 'Write succeeded but readback failed.' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Read/write test failed' };
    }
  };

  // Dismiss splash
  const dismissSplash = () => {
    setShowSplash(false);
    localStorage.setItem('gm_splash_shown', 'true');
    if (!isAgeConfirmed) {
      // Prompt age confirmation
    }
  };

  const confirmAge = () => {
    setIsAgeConfirmed(true);
    localStorage.setItem('gm_age_confirmed', 'true');
  };

  const loginUser = (userData: Partial<UserProfile>) => {
    const updated = {
      ...currentUser,
      ...userData,
    };
    setCurrentUser(updated);
    setIsLoggedIn(true);
    setIsAgeConfirmed(true);
    setShowAuthModal(false);
    localStorage.setItem('gm_logged_in', 'true');
    localStorage.setItem('gm_age_confirmed', 'true');
    addNotification({
      type: 'system',
      title: 'Account Connected',
      message: `Welcome to GlobalMeet, ${updated.name}! You are connected from ${updated.country}.`
    });
  };

  const logoutUser = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('gm_logged_in');
    setShowAuthModal(true);
  };

  const updateCurrentUserProfile = (data: Partial<UserProfile>) => {
    setCurrentUser(prev => ({ ...prev, ...data }));
  };

  // Coins management
  const addCoins = (amount: number, reason: string) => {
    setCoins(prev => {
      const next = prev + amount;
      setCurrentUser(u => ({ ...u, coins: next }));
      return next;
    });
    addNotification({
      type: 'coin',
      title: 'Coins Earned! 🪙',
      message: `+${amount} coins added to your wallet (${reason}).`,
      rewardAmount: amount
    });
  };

  const spendCoins = (amount: number, purpose: string): boolean => {
    if (currentUser.isPremium) return true; // Premium has unlimited time
    if (coins < amount) return false;

    const next = coins - amount;
    setCoins(next);
    setCurrentUser(u => ({ ...u, coins: next }));

    spendCoinsInFirebase(currentUser.id, amount, purpose)
      .then(() => {
        getUserCoinTransactions(currentUser.id).then(setCoinTransactions).catch(console.warn);
      })
      .catch(e => console.warn('Spend coins Firestore sync error:', e));

    addNotification({
      type: 'coin',
      title: 'Coins Spent',
      message: `-${amount} coins used for ${purpose}.`,
      rewardAmount: -amount
    });
    return true;
  };

  const upgradeToPremium = (planName: string) => {
    setCurrentUser(prev => ({ 
      ...prev, 
      isPremium: true,
      premiumPlan: planName 
    }));
    setPremiumModalOpen(false);

    // If call was paused due to timer, unpause immediately
    if (activeCall) {
      setActiveCall(prev => {
        if (!prev) return null;
        return {
          ...prev,
          isFreeTrial: false,
          isCallPausedDueToTimer: false,
        };
      });
    }

    addNotification({
      type: 'premium',
      title: 'Premium VIP Activated! ⭐',
      message: `Congratulations! You now have Unlimited Video Calls, No Ads, and VIP Discovery (${planName}).`
    });
  };

  const cancelPremium = () => {
    setCurrentUser(prev => ({ 
      ...prev, 
      isPremium: false,
      premiumPlan: undefined 
    }));
    addNotification({
      type: 'system',
      title: 'VIP Subscription Updated',
      message: 'Your VIP subscription has been updated to Standard plan.'
    });
  };

  const purchasePremiumPlan = async (
    plan: PremiumPlan,
    paymentMethod: string = 'PayPal / International Gateway',
    checkoutOptions?: { merchantReceiver?: string; paypalOrderId?: string }
  ): Promise<PurchaseResult> => {
    try {
      const result = await purchasePremiumPlanInFirebase(currentUser.id, plan, {
        fallbackCurrentCoins: coins,
        paymentMethod,
        merchantReceiver: checkoutOptions?.merchantReceiver || linkedPayPalMerchant,
        paypalOrderId: checkoutOptions?.paypalOrderId
      });

      if (result.success) {
        setCoins(result.newBalance);
        setCurrentUser(prev => ({
          ...prev,
          coins: result.newBalance,
          isPremium: true,
          premiumPlan: plan.name
        }));

        if (activeCall) {
          setActiveCall(prev => {
            if (!prev) return null;
            return {
              ...prev,
              isFreeTrial: false,
              isCallPausedDueToTimer: false,
            };
          });
        }

        getUserCoinTransactions(currentUser.id).then(setCoinTransactions).catch(console.warn);

        addNotification({
          type: 'premium',
          title: `VIP Membership Activated! ⭐`,
          message: `${plan.name} active! +${plan.bonusCoins.toLocaleString()} Bonus Coins credited. Paid via ${paymentMethod} to PayPal Merchant (${result.merchantReceiver || linkedPayPalMerchant}).`,
          rewardAmount: plan.bonusCoins
        });
      }
      return result;
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || 'Payment processing failed.',
        transactionId: '',
        addedCoins: 0,
        previousBalance: coins,
        newBalance: coins
      };
    }
  };

  const purchaseCoinsPackage = async (
    pkg: CoinPackage,
    paymentMethod: string = 'PayPal / International Gateway',
    checkoutOptions?: { merchantReceiver?: string; paypalOrderId?: string }
  ): Promise<PurchaseResult> => {
    try {
      const result = await purchaseCoinsPackageInFirebase(currentUser.id, pkg, {
        fallbackCurrentCoins: coins,
        paymentMethod,
        merchantReceiver: checkoutOptions?.merchantReceiver || linkedPayPalMerchant,
        paypalOrderId: checkoutOptions?.paypalOrderId
      });

      if (result.success) {
        setCoins(result.newBalance);
        setCurrentUser(prev => ({
          ...prev,
          coins: result.newBalance
        }));

        getUserCoinTransactions(currentUser.id).then(setCoinTransactions).catch(console.warn);

        addNotification({
          type: 'coin',
          title: `Coins Credited! 🪙`,
          message: `+${pkg.coins.toLocaleString()} Coins added to your account! Paid via ${paymentMethod} to PayPal Merchant (${result.merchantReceiver || LINKED_PAYPAL_MERCHANT_ACCOUNT}).`,
          rewardAmount: pkg.coins
        });
      }
      return result;
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || 'Payment processing failed.',
        transactionId: '',
        addedCoins: 0,
        previousBalance: coins,
        newBalance: coins
      };
    }
  };

  // Call timer effect
  useEffect(() => {
    if (!activeCall || activeCall.state !== 'connected' || activeCall.isCallPausedDueToTimer) return;

    const interval = setInterval(() => {
      setActiveCall(prev => {
        if (!prev || prev.state !== 'connected') return prev;

        const newDuration = prev.duration + 1;

        // If user is premium, no free trial limit applies!
        if (currentUser.isPremium) {
          return {
            ...prev,
            duration: newDuration,
            isFreeTrial: false,
          };
        }

        // For free users, check 15-second free trial
        if (prev.isFreeTrial) {
          const nextRemaining = prev.freeTrialRemaining - 1;
          if (nextRemaining <= 0) {
            // Free trial ended! Pause call and trigger options modal
            return {
              ...prev,
              duration: newDuration,
              freeTrialRemaining: 0,
              isCallPausedDueToTimer: true,
            };
          }
          return {
            ...prev,
            duration: newDuration,
            freeTrialRemaining: nextRemaining,
          };
        }

        return {
          ...prev,
          duration: newDuration,
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeCall?.state, activeCall?.isFreeTrial, activeCall?.isCallPausedDueToTimer, currentUser.isPremium]);

  // Video Call Actions
  const startVideoCall = (peer: UserProfile) => {
    if (blockedUserIds.includes(peer.id)) {
      alert('This user is blocked.');
      return;
    }

    // Free trial gives 15 seconds. If user is premium, unlimited.
    setActiveCall({
      peer,
      state: 'requesting',
      duration: 0,
      isFreeTrial: !currentUser.isPremium,
      freeTrialRemaining: 15,
      isMuted: false,
      isVideoOff: false,
      isSpeakerOn: true,
      isFrontCam: true,
      isCallPausedDueToTimer: false,
    });

    // Simulate peer pickup after 2.5 seconds
    setTimeout(() => {
      setActiveCall(current => {
        if (!current || current.state !== 'requesting') return current;
        return {
          ...current,
          state: 'connected',
        };
      });
    }, 2200);
  };

  const endActiveCall = () => {
    if (!activeCall) return;

    const record: CallRecord = {
      id: `call-${Date.now()}`,
      peerId: activeCall.peer.id,
      peerName: activeCall.peer.name,
      peerAvatar: activeCall.peer.avatar,
      type: 'video',
      direction: 'outgoing',
      durationSeconds: activeCall.duration,
      timestamp: 'Just now',
      costCoins: activeCall.isFreeTrial ? 0 : 20,
    };

    setCallHistory(prev => [record, ...prev]);
    saveCallRecordToFirebase(record).catch(e => console.warn('Call record Firestore sync:', e));
    setActiveCall(null);
  };

  const toggleMute = () => {
    setActiveCall(prev => prev ? { ...prev, isMuted: !prev.isMuted } : null);
  };

  const toggleVideo = () => {
    setActiveCall(prev => prev ? { ...prev, isVideoOff: !prev.isVideoOff } : null);
  };

  const toggleSpeaker = () => {
    setActiveCall(prev => prev ? { ...prev, isSpeakerOn: !prev.isSpeakerOn } : null);
  };

  const toggleCameraFlip = () => {
    setActiveCall(prev => prev ? { ...prev, isFrontCam: !prev.isFrontCam } : null);
  };

  const extendCallWithCoins = (): boolean => {
    const success = spendCoins(20, '60s Extra Video Call Time');
    if (success) {
      setActiveCall(prev => {
        if (!prev) return null;
        return {
          ...prev,
          isFreeTrial: false,
          isCallPausedDueToTimer: false,
          freeTrialRemaining: 60, // unlocked 60s
        };
      });
      return true;
    }
    return false;
  };

  const extendCallWithPremium = () => {
    upgradeToPremium('Unlimited Call Pass');
    setActiveCall(prev => {
      if (!prev) return null;
      return {
        ...prev,
        isFreeTrial: false,
        isCallPausedDueToTimer: false,
      };
    });
  };

  // Messaging Actions
  const openChatWith = (user: UserProfile) => {
    setActiveChatUser(user);
    // If not in conversations, create one
    setConversations(prev => {
      if (prev.some(c => c.participantId === user.id)) {
        return prev.map(c => c.participantId === user.id ? { ...c, unreadCount: 0 } : c);
      }
      return [
        {
          id: `conv-${user.id}`,
          participantId: user.id,
          lastMessage: {
            id: `init-${Date.now()}`,
            senderId: user.id,
            receiverId: currentUser.id,
            text: `Say hi to ${user.name} from ${user.country}! 👋`,
            timestamp: 'Just now',
            status: 'read'
          },
          unreadCount: 0
        },
        ...prev
      ];
    });
  };

  const closeChat = () => {
    setActiveChatUser(null);
  };

  const sendMessage = (peerId: string, text?: string, imageUrl?: string) => {
    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      senderId: currentUser.id,
      receiverId: peerId,
      text,
      imageUrl,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'delivered',
    };

    setMessages(prev => {
      const chat = prev[peerId] || [];
      return {
        ...prev,
        [peerId]: [...chat, newMsg]
      };
    });

    setConversations(prev => {
      const existing = prev.find(c => c.participantId === peerId);
      if (existing) {
        return prev.map(c => c.participantId === peerId ? { ...c, lastMessage: newMsg } : c);
      }
      return [
        {
          id: `conv-${peerId}`,
          participantId: peerId,
          lastMessage: newMsg,
          unreadCount: 0
        },
        ...prev
      ];
    });

    // Write real message to Firebase Firestore
    sendMessageToFirebase(currentUser.id, peerId, text, imageUrl).catch(e => {
      console.warn('Firebase message sync:', e);
    });

    // Simulated friendly peer response after 2.5 seconds
    setTimeout(() => {
      const peer = allUsers.find(u => u.id === peerId);
      if (!peer || blockedUserIds.includes(peerId)) return;

      const responses = [
        `Nice to connect with you from ${peer.country}! 😊`,
        `How is the weather in ${currentUser.country} today?`,
        `That sounds exciting! We can also do a quick video call if you want 📹`,
        `Great photo! Everything looks so vibrant.`,
        `Haha definitely! Let's stay in touch 🌟`
      ];
      const randomReply = responses[Math.floor(Math.random() * responses.length)];

      const peerMsg: Message = {
        id: `msg-reply-${Date.now()}`,
        senderId: peerId,
        receiverId: currentUser.id,
        text: randomReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'read',
      };

      setMessages(p => ({
        ...p,
        [peerId]: [...(p[peerId] || []), peerMsg]
      }));

      setConversations(convs => convs.map(c => 
        c.participantId === peerId ? { ...c, lastMessage: peerMsg, unreadCount: activeChatUser?.id === peerId ? 0 : c.unreadCount + 1 } : c
      ));

      if (activeChatUser?.id !== peerId) {
        addNotification({
          type: 'message',
          title: `New message from ${peer.name}`,
          message: randomReply,
          actionUserId: peer.id
        });
      }
    }, 2400);
  };

  // Safety
  const blockUser = (userId: string) => {
    setBlockedUserIds(prev => [...new Set([...prev, userId])]);
    if (activeChatUser?.id === userId) setActiveChatUser(null);
    if (activeCall?.peer.id === userId) endActiveCall();
    if (viewingProfile?.id === userId) setViewingProfile(null);
    addNotification({
      type: 'system',
      title: 'User Blocked',
      message: 'You will no longer receive calls, messages, or recommendations from this user.'
    });
  };

  const unblockUser = (userId: string) => {
    setBlockedUserIds(prev => prev.filter(id => id !== userId));
    addNotification({
      type: 'system',
      title: 'User Unblocked',
      message: 'User removed from your blocked list.'
    });
  };

  const submitReport = (reportedUser: UserProfile, category: ReportCategory, description: string) => {
    const newReport: UserReport = {
      id: `rep-${Date.now()}`,
      reporterId: currentUser.id,
      reporterName: currentUser.name,
      reportedUserId: reportedUser.id,
      reportedUserName: reportedUser.name,
      reportedUserAvatar: reportedUser.avatar,
      category,
      description,
      timestamp: new Date().toLocaleString(),
      status: 'pending'
    };

    setReports(prev => [newReport, ...prev]);
    submitReportToFirebase(newReport).catch(e => console.warn('Report Firestore sync:', e));
    setReportModalUser(null);
    addNotification({
      type: 'system',
      title: 'Report Submitted',
      message: `Thank you for reporting. Our moderation team is reviewing ${reportedUser.name} for ${category}.`
    });
  };

  // Rewarded Ad triggers & Secure Firestore Verification
  const openRewardedAd = (context: 'call_extension' | 'wallet' = 'wallet') => {
    // Generate an authentic unique session token for this ad view to prevent duplicate reward grants
    const sessionToken = `ad_tx_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    setRewardedAdToken(sessionToken);
    setRewardedAdTriggerContext(context);
    setIsRewardVerifying(false);
    setIsRewardedAdOpen(true);
  };

  const closeRewardedAd = (earlySkip: boolean = false) => {
    setIsRewardedAdOpen(false);
    setRewardedAdTriggerContext(null);
    setRewardedAdToken('');
    setIsRewardVerifying(false);

    if (earlySkip) {
      addNotification({
        type: 'system',
        title: 'Ad Skipped',
        message: 'Rewarded Ad closed early. Coins are only awarded upon completing the entire ad.'
      });
    }
  };

  const completeRewardedAd = async (tokenToVerify?: string): Promise<RewardedAdCreditResult> => {
    const activeToken = tokenToVerify || rewardedAdToken;

    if (!activeToken) {
      const errRes: RewardedAdCreditResult = {
        success: false,
        message: 'Reward token missing. Please watch the ad again.',
        addedCoins: 0,
        previousBalance: coins,
        newBalance: coins,
        transactionId: ''
      };
      return errRes;
    }

    setIsRewardVerifying(true);

    try {
      // 1. Verify and credit exactly 10 coins directly in Firestore with atomic runTransaction
      const result = await verifyAndCreditRewardedAdInFirebase(currentUser.id, activeToken, {
        adPlacement: rewardedAdTriggerContext || 'wallet',
        fallbackCurrentCoins: coins,
        durationWatchedSec: 5
      });

      if (result.success) {
        // 2. Immediately update local coins balance in real-time
        setCoins(result.newBalance);
        setCurrentUser(prev => ({ ...prev, coins: result.newBalance }));

        // 3. User notification confirming verified 10 coins added
        addNotification({
          type: 'coin',
          title: 'Rewarded Ad Verified! 🪙',
          message: `+${result.addedCoins} Coins successfully added to your wallet. Balance: ${result.newBalance} Coins.`,
          rewardAmount: result.addedCoins
        });

        // 4. If ad was watched to extend a paused call, automatically unpause and provide extra call duration!
        if (rewardedAdTriggerContext === 'call_extension' && activeCall) {
          setActiveCall(prev => {
            if (!prev) return null;
            return {
              ...prev,
              isFreeTrial: false,
              isCallPausedDueToTimer: false,
              freeTrialRemaining: 60, // 60 extra seconds
            };
          });
        }

        // 5. Refresh audit log in UI
        getUserCoinTransactions(currentUser.id).then(setCoinTransactions).catch(console.warn);
      } else {
        // Rejection / Duplicate prevention / Interrupted
        addNotification({
          type: 'system',
          title: result.isDuplicate ? 'Duplicate Ad Reward Blocked' : 'Reward Verification Notice',
          message: result.message
        });
      }

      setIsRewardVerifying(false);
      return result;
    } catch (err: any) {
      console.error('Error completing rewarded ad:', err);
      setIsRewardVerifying(false);
      return {
        success: false,
        message: err?.message || 'Failed to verify rewarded ad',
        addedCoins: 0,
        previousBalance: coins,
        newBalance: coins,
        transactionId: activeToken
      };
    }
  };

  const fetchCoinTransactions = async (): Promise<CoinTransaction[]> => {
    const list = await getUserCoinTransactions(currentUser.id);
    setCoinTransactions(list);
    return list;
  };

  // Notifications
  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const addNotification = (notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
    const newN: AppNotification = {
      id: `notif-${Date.now()}`,
      timestamp: 'Just now',
      read: false,
      ...notif,
    };
    setNotifications(prev => [newN, ...prev]);
    saveNotificationToFirebase(currentUser.id, newN).catch(e => console.warn('Notification Firestore sync:', e));
  };

  const unreadNotificationCount = notifications.filter(n => !n.read).length;

  // Privacy Settings
  const updatePrivacySettings = (settings: Partial<PrivacySettings>) => {
    setPrivacySettings(prev => ({ ...prev, ...settings }));
  };

  // Admin Panel Actions
  const updateUserStatus = (userId: string, status: AccountStatus) => {
    setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, accountStatus: status } : u));
    addNotification({
      type: 'system',
      title: 'User Moderated (Admin)',
      message: `User status changed to ${status}.`
    });
  };

  const resolveReport = (reportId: string, actionText: string) => {
    setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'resolved', actionTaken: actionText } : r));
  };

  const deleteUserPermanently = (userId: string) => {
    setAllUsers(prev => prev.filter(u => u.id !== userId));
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        isLoggedIn,
        isAgeConfirmed,
        showSplash,
        showAuthModal,
        dismissSplash,
        confirmAge,
        loginUser,
        logoutUser,
        setShowAuthModal,
        updateCurrentUserProfile,
        activeTab,
        setActiveTab,
        coins,
        addCoins,
        spendCoins,
        isPremiumModalOpen,
        setPremiumModalOpen,
        upgradeToPremium,
        cancelPremium,
        purchasePremiumPlan,
        purchaseCoinsPackage,
        linkedPayPalMerchant,
        updateLinkedPayPalMerchant,
        activeCall,
        startVideoCall,
        endActiveCall,
        toggleMute,
        toggleVideo,
        toggleSpeaker,
        toggleCameraFlip,
        extendCallWithCoins,
        extendCallWithPremium,
        callHistory,
        conversations,
        messages,
        activeChatUser,
        openChatWith,
        closeChat,
        sendMessage,
        blockedUserIds,
        blockUser,
        unblockUser,
        reports,
        submitReport,
        reportModalUser,
        setReportModalUser,
        viewingProfile,
        setViewingProfile,
        isRewardedAdOpen,
        rewardedAdTriggerContext,
        rewardedAdToken,
        isRewardVerifying,
        openRewardedAd,
        closeRewardedAd,
        completeRewardedAd,
        coinTransactions,
        fetchCoinTransactions,
        allSystemTransactions,
        fetchAllSystemTransactions,
        notifications,
        unreadNotificationCount,
        markAllNotificationsRead,
        addNotification,
        isNotificationCenterOpen,
        setIsNotificationCenterOpen,
        privacySettings,
        updatePrivacySettings,
        allUsers,
        updateUserStatus,
        resolveReport,
        deleteUserPermanently,
        firebaseStatus,
        isFirebaseConnected,
        testFirebaseReadWrite,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
