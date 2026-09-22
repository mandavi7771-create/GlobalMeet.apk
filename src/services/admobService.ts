/**
 * Google AdMob & Google Mobile Ads SDK Service for GlobalMeet
 * 
 * Configured IDs:
 * - AdMob App ID: ca-app-pub-9492891304960281~2927769366
 * - Rewarded Ad Unit ID: ca-app-pub-9492891304960281/7053707476
 * - Reward: 10 Coins
 */

export const ADMOB_CONFIG = {
  appId: 'ca-app-pub-9492891304960281~2927769366',
  rewardedAdUnitId: 'ca-app-pub-9492891304960281/7053707476',
  rewardCoins: 10,
  // Official Google linear ad sample video stream (Google Cloud CDN)
  sampleAdVideoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
};

declare global {
  interface Window {
    // Android Native AdMob Bridge interface
    AndroidAdMob?: {
      showRewardedAd: (unitId: string) => void;
      isAdLoaded: () => boolean;
      loadRewardedAd: (unitId: string) => void;
    };
    Android?: {
      showRewardedAd?: (unitId: string) => void;
    };
    AdMobBridge?: {
      showRewardedAd?: (unitId: string) => void;
    };
    // Callbacks from Android Native Google Mobile Ads SDK
    onAdMobRewardEarned?: (amount: number, type: string) => void;
    onAdMobDismissed?: (rewardEarned: boolean) => void;
    onAdMobFailed?: (errorMessage: string) => void;
    onAdMobLoaded?: () => void;
    
    // Google Publisher Tag (GPT)
    googletag?: any;
  }
}

export interface ShowRewardedAdOptions {
  onRewardEarned: (amount: number) => void;
  onAdClosed: (completed: boolean) => void;
  onError: (error: string) => void;
  onAdLoaded?: () => void;
}

class AdMobService {
  private isProcessingReward = false;
  private currentRewardCallback: ((amount: number) => void) | null = null;
  private currentCloseCallback: ((completed: boolean) => void) | null = null;
  private currentErrorCallback: ((error: string) => void) | null = null;

  constructor() {
    this.setupNativeCallbacks();
  }

  /**
   * Set up global callbacks for Android Native Google Mobile Ads SDK
   */
  private setupNativeCallbacks() {
    if (typeof window === 'undefined') return;

    window.onAdMobRewardEarned = (amount: number) => {
      console.log('[AdMob Native] onUserEarnedReward received:', amount);
      if (!this.isProcessingReward) {
        this.isProcessingReward = true;
        if (this.currentRewardCallback) {
          this.currentRewardCallback(amount || ADMOB_CONFIG.rewardCoins);
        }
      }
    };

    window.onAdMobDismissed = (rewardEarned: boolean) => {
      console.log('[AdMob Native] Ad dismissed. Reward earned:', rewardEarned);
      if (this.currentCloseCallback) {
        this.currentCloseCallback(rewardEarned);
      }
      this.resetActiveState();
    };

    window.onAdMobFailed = (errorMessage: string) => {
      console.error('[AdMob Native] Ad failed to load/show:', errorMessage);
      if (this.currentErrorCallback) {
        this.currentErrorCallback(errorMessage || 'Google AdMob failed to load.');
      }
      this.resetActiveState();
    };
  }

  /**
   * Check if running inside Android Native wrapper with AdMob SDK
   */
  public isNativeAndroid(): boolean {
    if (typeof window === 'undefined') return false;
    return !!(
      window.AndroidAdMob ||
      window.Android?.showRewardedAd ||
      window.AdMobBridge?.showRewardedAd
    );
  }

  /**
   * Request and show real Google AdMob Rewarded Ad
   */
  public showRewardedAd(options: ShowRewardedAdOptions) {
    this.resetActiveState();
    this.currentRewardCallback = options.onRewardEarned;
    this.currentCloseCallback = options.onAdClosed;
    this.currentErrorCallback = options.onError;

    // 1. If running inside Native Android Google Mobile Ads App
    if (this.isNativeAndroid()) {
      console.log('[AdMob] Invoking Android Native AdMob SDK:', ADMOB_CONFIG.rewardedAdUnitId);
      try {
        if (window.AndroidAdMob?.showRewardedAd) {
          window.AndroidAdMob.showRewardedAd(ADMOB_CONFIG.rewardedAdUnitId);
          return;
        } else if (window.Android?.showRewardedAd) {
          window.Android.showRewardedAd(ADMOB_CONFIG.rewardedAdUnitId);
          return;
        } else if (window.AdMobBridge?.showRewardedAd) {
          window.AdMobBridge.showRewardedAd(ADMOB_CONFIG.rewardedAdUnitId);
          return;
        }
      } catch (err: any) {
        console.error('[AdMob Native] Bridge call failed:', err);
        options.onError(err?.message || 'Android AdMob native invocation failed.');
        return;
      }
    }

    // 2. In Web / Preview / Browser mode, indicate loaded so player activates
    console.log('[AdMob Web] Initializing Google Mobile Ads Rewarded Ad Player...');
    if (options.onAdLoaded) {
      options.onAdLoaded();
    }
  }

  public notifyRewardEarned(amount: number = ADMOB_CONFIG.rewardCoins) {
    if (!this.isProcessingReward) {
      this.isProcessingReward = true;
      if (this.currentRewardCallback) {
        this.currentRewardCallback(amount);
      }
    }
  }

  public notifyAdClosed(completed: boolean) {
    if (this.currentCloseCallback) {
      this.currentCloseCallback(completed);
    }
    this.resetActiveState();
  }

  private resetActiveState() {
    this.isProcessingReward = false;
  }
}

export const admobService = new AdMobService();
