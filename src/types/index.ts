export type OnlineStatus = 'online' | 'recent' | 'offline';

export type UserRole = 'user' | 'admin';

export type AccountStatus = 'active' | 'restricted' | 'suspended' | 'banned';

export interface Country {
  code: string;
  name: string;
  flag: string;
  languages: string[];
}

export interface UserProfile {
  id: string;
  username: string;
  name: string;
  avatar: string;
  age: number;
  country: string;
  countryCode: string;
  language: string;
  languagesSpoken: string[];
  gender: 'male' | 'female' | 'other';
  bio: string;
  status: OnlineStatus;
  isVerified?: boolean;
  isPremium?: boolean;
  premiumPlan?: string;
  coins: number;
  photos?: string[];
  accountStatus: AccountStatus;
  joinedAt: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  text?: string;
  imageUrl?: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
}

export interface Conversation {
  id: string;
  participantId: string;
  lastMessage: Message;
  unreadCount: number;
}

export interface CallRecord {
  id: string;
  peerId: string;
  peerName: string;
  peerAvatar: string;
  type: 'video' | 'audio';
  direction: 'incoming' | 'outgoing' | 'missed';
  durationSeconds: number;
  timestamp: string;
  costCoins?: number;
}

export type ReportCategory = 
  | 'Harassment'
  | 'Spam'
  | 'Fake Profile'
  | 'Unwanted Content'
  | 'Abuse'
  | 'Underage (Under 18)'
  | 'Other';

export interface UserReport {
  id: string;
  reporterId: string;
  reporterName: string;
  reportedUserId: string;
  reportedUserName: string;
  reportedUserAvatar: string;
  category: ReportCategory;
  description: string;
  timestamp: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  actionTaken?: string;
}

export interface AppNotification {
  id: string;
  type: 'message' | 'call' | 'coin' | 'premium' | 'system' | 'view';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUserId?: string;
  rewardAmount?: number;
}

export interface PrivacySettings {
  whoCanMessage: 'everyone' | 'connected' | 'verified';
  whoCanCall: 'everyone' | 'connected' | 'nobody';
  profileVisibility: 'public' | 'incognito';
  showOnlineStatus: boolean;
  showAge: boolean;
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  suspendedUsers: number;
  totalCalls: number;
  totalCallDurationMin: number;
  coinsIssued: number;
  coinsUsed: number;
  premiumSubscribers: number;
}

export type CoinTransactionSource = 
  | 'Rewarded Ad' 
  | 'Premium Bonus' 
  | 'Coin Purchase' 
  | 'Other Admin Reward';

export type CoinTransactionType = 
  | 'credit' 
  | 'debit' 
  | 'rewarded_ad' 
  | 'welcome_bonus' 
  | 'call_spend' 
  | 'admin_grant'
  | 'premium_bonus'
  | 'coin_purchase';

export interface CoinTransaction {
  id: string;
  userId: string;
  amount: number;
  previousBalance: number;
  newBalance: number;
  type: CoinTransactionType;
  paymentAmount?: number;
  currency?: string;
  source: CoinTransactionSource;
  reason: string;
  planId?: string;
  packageId?: string;
  paymentMethod?: string;
  merchantReceiver?: string;
  paypalOrderId?: string;
  adPlacement?: string;
  adTitle?: string;
  durationWatchedSec?: number;
  verificationToken?: string;
  status: 'completed' | 'verified_completed' | 'pending' | 'failed';
  timestamp: string;
}

export interface PremiumPlan {
  id: 'weekly' | 'monthly' | 'quarterly' | 'six_month' | 'yearly' | 'lifetime';
  name: string;
  price: string;
  priceNum: number;
  duration: string;
  billingPeriod: string;
  bonusCoins: number;
  badge?: string;
  highlight?: boolean;
  buttonText: string;
  features: string[];
}

export interface CoinPackage {
  id: string;
  coins: number;
  price: string;
  priceNum: number;
  currency: string;
  badge?: string;
  popular?: boolean;
}

export interface PurchaseResult {
  success: boolean;
  message: string;
  transactionId: string;
  addedCoins: number;
  previousBalance: number;
  newBalance: number;
  planName?: string;
  premiumActivated?: boolean;
  paymentMethod?: string;
  merchantReceiver?: string;
  paypalOrderId?: string;
}

export interface RewardedAdCreditResult {
  success: boolean;
  message: string;
  addedCoins: number;
  previousBalance: number;
  newBalance: number;
  transactionId: string;
  isDuplicate?: boolean;
}
