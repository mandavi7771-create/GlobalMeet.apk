import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { 
  X, 
  Sparkles, 
  CheckCircle2, 
  ShieldCheck, 
  Coins, 
  Loader2, 
  AlertCircle,
  ArrowRight,
  Volume2,
  VolumeX,
  Gift,
  Play
} from 'lucide-react';
import { RewardedAdCreditResult } from '../types';
import { admobService, ADMOB_CONFIG } from '../services/admobService';

// Exact required maximum duration: 10 seconds
const MAX_AD_DURATION = 10;

export const RewardedAdModal: React.FC = () => {
  const { 
    isRewardedAdOpen, 
    closeRewardedAd, 
    completeRewardedAd, 
    rewardedAdTriggerContext
  } = useApp();

  const [adState, setAdState] = useState<'buffering' | 'playing' | 'completed' | 'rewarded' | 'error'>('buffering');
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(true); // default muted for guaranteed autoplay across all browsers
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isClaiming, setIsClaiming] = useState<boolean>(false);
  const [verificationResult, setVerificationResult] = useState<RewardedAdCreditResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hasCompletedVideo = useRef(false);
  const hasClaimedReward = useRef(false);
  const playbackTimerRef = useRef<any>(null);

  // Initialize ad playback on open
  useEffect(() => {
    if (!isRewardedAdOpen) {
      if (playbackTimerRef.current) {
        clearInterval(playbackTimerRef.current);
        playbackTimerRef.current = null;
      }
      setAdState('buffering');
      setElapsedSeconds(0);
      setIsClaiming(false);
      setVerificationResult(null);
      setErrorMessage(null);
      setIsPaused(false);
      hasCompletedVideo.current = false;
      hasClaimedReward.current = false;
      return;
    }

    // Reset state flags
    hasCompletedVideo.current = false;
    hasClaimedReward.current = false;
    setElapsedSeconds(0);
    setAdState('buffering');
    setIsPaused(false);

    // If native Android Google Mobile Ads SDK is available in native APK
    if (admobService.isNativeAndroid()) {
      admobService.showRewardedAd({
        onRewardEarned: () => {
          triggerCompletion();
        },
        onAdClosed: (completed) => {
          if (!completed && !hasClaimedReward.current) {
            closeRewardedAd(true);
          }
        },
        onError: (err) => {
          setAdState('error');
          setErrorMessage(err);
        }
      });
      return;
    }

    // Web / Hybrid Video Player with Dual-Timer synchronization
    const startPlay = () => {
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.muted = true;
        setIsMuted(true);

        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setAdState('playing');
              setIsPaused(false);
              startTrackingTimer();
            })
            .catch((err) => {
              console.warn('[AdMob Video] Autoplay require interaction:', err);
              setAdState('playing');
              setIsPaused(true);
              // Start timer so user is never stuck
              startTrackingTimer();
            });
        }
      } else {
        startTrackingTimer();
        setAdState('playing');
      }
    };

    const initTimeout = setTimeout(startPlay, 200);

    return () => {
      clearTimeout(initTimeout);
      if (playbackTimerRef.current) {
        clearInterval(playbackTimerRef.current);
        playbackTimerRef.current = null;
      }
    };
  }, [isRewardedAdOpen]);

  // Guaranteed timer interval that ticks up to 10 seconds
  const startTrackingTimer = () => {
    if (playbackTimerRef.current) {
      clearInterval(playbackTimerRef.current);
    }

    const startTime = Date.now();
    playbackTimerRef.current = setInterval(() => {
      if (hasCompletedVideo.current) {
        if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
        return;
      }

      // Check current video time or elapsed wall time
      const videoCurrentTime = videoRef.current ? videoRef.current.currentTime : 0;
      const wallTimeElapsed = (Date.now() - startTime) / 1000;
      const currentProgress = Math.max(videoCurrentTime, wallTimeElapsed);

      if (currentProgress >= MAX_AD_DURATION) {
        if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
        setElapsedSeconds(MAX_AD_DURATION);
        triggerCompletion();
      } else {
        setElapsedSeconds(Math.min(MAX_AD_DURATION, currentProgress));
      }
    }, 200);
  };

  const triggerCompletion = () => {
    if (hasCompletedVideo.current) return;
    hasCompletedVideo.current = true;
    console.log('[AdMob] 10 seconds completed. Unlocking Claim Reward button.');

    if (playbackTimerRef.current) {
      clearInterval(playbackTimerRef.current);
      playbackTimerRef.current = null;
    }

    if (videoRef.current) {
      try {
        videoRef.current.pause();
      } catch (e) {
        // ignore
      }
    }

    setElapsedSeconds(MAX_AD_DURATION);
    setAdState('completed');
  };

  const handleManualPlay = () => {
    if (videoRef.current) {
      videoRef.current.play().then(() => {
        setIsPaused(false);
      }).catch(console.warn);
    }
  };

  const toggleSound = () => {
    if (videoRef.current) {
      const nextMuted = !videoRef.current.muted;
      videoRef.current.muted = nextMuted;
      setIsMuted(nextMuted);
    }
  };

  // User manually clicks "Claim Reward" AFTER 10s video completes
  const handleClaimReward = async () => {
    if (!hasCompletedVideo.current) {
      console.warn('[AdMob] Must complete 10s before claiming reward');
      return;
    }
    if (hasClaimedReward.current || isClaiming) {
      return;
    }

    hasClaimedReward.current = true;
    setIsClaiming(true);
    setErrorMessage(null);

    try {
      // Calls Firebase atomic transaction for +10 coins
      const result = await completeRewardedAd();
      setVerificationResult(result);
      if (result.success) {
        setAdState('rewarded');
      } else {
        setErrorMessage(result.message || 'Reward verification failed. Please try again.');
        hasClaimedReward.current = false;
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Database error occurred during reward claim.');
      hasClaimedReward.current = false;
    } finally {
      setIsClaiming(false);
    }
  };

  if (!isRewardedAdOpen) return null;

  const secondsRemaining = Math.max(0, Math.ceil(MAX_AD_DURATION - elapsedSeconds));
  const progressPercent = Math.min(100, (elapsedSeconds / MAX_AD_DURATION) * 100);

  return (
    <div 
      id="rewarded-ad-modal-overlay" 
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-3 sm:p-4 backdrop-blur-md animate-fade-in"
    >
      <div 
        id="rewarded-ad-card" 
        className="w-full max-w-sm sm:max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col relative"
      >
        {/* Top Header Bar */}
        <div className="bg-neutral-950 px-4 py-3 flex items-center justify-between border-b border-neutral-800">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] uppercase font-bold tracking-wider bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded border border-rose-500/30 flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
              <span>Google Mobile Ads</span>
            </span>

            {adState === 'playing' && (
              <span className="text-xs font-mono font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
                Reward in {secondsRemaining}s
              </span>
            )}

            {(adState === 'completed' || adState === 'rewarded') && (
              <span className="text-xs font-semibold text-emerald-400 flex items-center space-x-1 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Completed</span>
              </span>
            )}
          </div>

          <div className="flex items-center space-x-1.5">
            {adState === 'playing' && (
              <button
                onClick={toggleSound}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white bg-neutral-900 border border-neutral-800 transition"
                title={isMuted ? 'Unmute' : 'Mute'}
                aria-label="Toggle Sound"
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
              </button>
            )}

            <button
              id="btn-close-rewarded-ad"
              onClick={() => closeRewardedAd(!hasClaimedReward.current)}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white transition"
              title={hasClaimedReward.current ? 'Close' : 'Cancel (No Coins)'}
              aria-label="Close Ad"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Video Progress Bar (10 seconds) */}
        <div className="w-full bg-neutral-800 h-1.5 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-amber-500 via-rose-500 to-emerald-400 h-full transition-all duration-200 ease-linear"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Real Ad Video Stream Container */}
        <div className="relative aspect-video w-full bg-black overflow-hidden flex items-center justify-center">
          <video
            ref={videoRef}
            src={ADMOB_CONFIG.sampleAdVideoUrl}
            playsInline
            autoPlay
            muted={isMuted}
            controls={false}
            onEnded={triggerCompletion}
            className="w-full h-full object-cover"
          />

          {/* Buffering overlay */}
          {adState === 'buffering' && (
            <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center space-y-2 z-10">
              <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
              <span className="text-xs text-neutral-300 font-medium">Loading Google AdMob Video...</span>
            </div>
          )}

          {/* Resume / Play Overlay if paused */}
          {isPaused && adState === 'playing' && (
            <button
              onClick={handleManualPlay}
              className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center space-y-2 z-20 cursor-pointer"
            >
              <div className="w-12 h-12 rounded-full bg-rose-600 flex items-center justify-center text-white shadow-lg animate-pulse">
                <Play className="w-6 h-6 ml-0.5" />
              </div>
              <span className="text-xs text-white font-semibold">Tap to Resume Ad</span>
            </button>
          )}

          {/* In-Video Watermark */}
          <div className="absolute top-2.5 left-2.5 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/10 flex items-center space-x-1.5 pointer-events-none z-10">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-[10px] text-neutral-200 font-mono">AdMob Unit: 7053707476</span>
          </div>

          {/* Tap to Unmute Overlay */}
          {isMuted && adState === 'playing' && (
            <button
              onClick={toggleSound}
              className="absolute bottom-3 left-3 bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-700 text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg flex items-center space-x-1.5 shadow-lg transition active:scale-95 cursor-pointer z-20"
            >
              <VolumeX className="w-3.5 h-3.5 text-amber-400" />
              <span>Tap to Unmute 🔊</span>
            </button>
          )}

          {/* Video Completed Overlay */}
          {(adState === 'completed' || adState === 'rewarded') && (
            <div className="absolute inset-0 bg-black/70 backdrop-blur-xs flex flex-col items-center justify-center space-y-2 z-10">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shadow-xl">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <span className="text-xs text-white font-bold tracking-wide">10s Ad Finished</span>
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-5 space-y-3.5 text-center">

          {/* 1. WHILE AD IS PLAYING: NO CLAIM OPTION IS SHOWN */}
          {(adState === 'playing' || adState === 'buffering') && (
            <div className="space-y-3 animate-fade-in">
              <div className="space-y-1.5 text-left bg-neutral-950 p-3.5 rounded-2xl border border-neutral-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-400">Ad Duration:</span>
                  <span className="font-semibold text-neutral-200">10 Seconds</span>
                </div>
                <div className="flex items-center justify-between text-xs border-t border-neutral-850 pt-1.5">
                  <span className="text-neutral-400">Reward upon completion:</span>
                  <span className="font-bold text-amber-400 font-mono flex items-center space-x-1">
                    <Coins className="w-3.5 h-3.5 text-amber-400" />
                    <span>+10 Coins</span>
                  </span>
                </div>
              </div>

              <div className="p-3 bg-neutral-950/60 rounded-xl border border-neutral-850 text-xs text-neutral-400 flex items-center justify-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                <span>Please watch {secondsRemaining}s to unlock Claim Reward.</span>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-neutral-500">
                  Ad closes early = 0 Coins
                </span>
                <button
                  onClick={() => closeRewardedAd(true)}
                  className="text-[11px] text-neutral-500 hover:text-rose-400 transition underline cursor-pointer"
                >
                  Skip Ad (No Coins)
                </button>
              </div>
            </div>
          )}

          {/* 2. VIDEO FINISHED (10s): PROMINENT "CLAIM REWARD" BUTTON APPEARS */}
          {adState === 'completed' && (
            <div className="space-y-3.5 animate-in zoom-in-95 duration-200">
              <div className="space-y-1">
                <h4 className="text-base font-bold text-emerald-400 flex items-center justify-center space-x-1.5">
                  <Sparkles className="w-5 h-5 text-amber-300" />
                  <span>Ad Finished! Claim Your Reward</span>
                </h4>
                <p className="text-xs text-neutral-300">
                  You have watched the full 10 seconds. Click below to add 10 coins to your wallet.
                </p>
              </div>

              {errorMessage && (
                <div className="p-3 bg-rose-950/40 border border-rose-800/50 rounded-xl text-left text-xs text-rose-300 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* The Dedicated "Claim Reward" Button */}
              <button
                id="btn-claim-reward-10coins"
                onClick={handleClaimReward}
                disabled={isClaiming}
                className="w-full py-4 bg-gradient-to-r from-amber-500 via-rose-600 to-pink-600 hover:from-amber-400 hover:to-pink-500 text-white font-extrabold text-base rounded-2xl shadow-xl shadow-rose-600/40 flex items-center justify-center space-x-2 transition active:scale-[0.98] cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed border border-white/20"
              >
                {isClaiming ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-white" />
                    <span>Verifying +10 Coins...</span>
                  </>
                ) : (
                  <>
                    <Gift className="w-5 h-5 text-amber-200 animate-bounce" />
                    <span>Claim Reward (+10 Coins 🪙)</span>
                  </>
                )}
              </button>

              <p className="text-[11px] text-neutral-500">
                Tap the button to credit exactly 10 coins directly to your wallet balance.
              </p>
            </div>
          )}

          {/* 3. REWARD CLAIMED SUCCESSFULLY */}
          {adState === 'rewarded' && (
            <div className="space-y-3.5 animate-in zoom-in-95 duration-200">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>

              <div className="space-y-0.5">
                <h4 className="text-sm font-bold text-emerald-400">Reward Claimed Successfully!</h4>
                <p className="text-xs text-neutral-300">
                  Exactly 10 Coins have been added to your balance.
                </p>
              </div>

              {verificationResult && (
                <div className="bg-neutral-950 p-3.5 rounded-2xl border border-neutral-800 text-xs space-y-1.5 text-left">
                  <div className="flex justify-between text-neutral-400">
                    <span>Reward Added:</span>
                    <span className="text-emerald-400 font-bold font-mono">+{verificationResult.addedCoins} Coins 🪙</span>
                  </div>
                  <div className="flex justify-between text-neutral-300 border-t border-neutral-800 pt-1.5 font-semibold">
                    <span>Updated Wallet Balance:</span>
                    <span className="text-amber-400 font-bold font-mono">{verificationResult.newBalance} Coins</span>
                  </div>
                  {verificationResult.transactionId && (
                    <div className="text-[10px] text-neutral-500 font-mono pt-1 truncate">
                      Ref: {verificationResult.transactionId.slice(0, 22)}...
                    </div>
                  )}
                </div>
              )}

              <button
                id="btn-ad-done-dismiss"
                onClick={() => closeRewardedAd(false)}
                className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center space-x-1.5 transition active:scale-95 cursor-pointer"
              >
                <span>
                  {rewardedAdTriggerContext === 'call_extension' ? 'Resume Call (+60s)' : 'Done & Return'}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* 4. ERROR STATE */}
          {adState === 'error' && (
            <div className="space-y-3 bg-rose-950/30 border border-rose-800/40 p-4 rounded-2xl text-left">
              <div className="flex items-center space-x-2 text-rose-300 text-xs font-bold">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>Ad Notice</span>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                {errorMessage || 'Unable to play the rewarded ad at this moment.'}
              </p>
              <button
                onClick={() => closeRewardedAd(true)}
                className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                Close (No Coins)
              </button>
            </div>
          )}

          {/* Bottom Rule Footer */}
          <div className="flex items-center justify-center space-x-1.5 text-[11px] text-neutral-500 pt-1 border-t border-neutral-850">
            <Coins className="w-3.5 h-3.5 text-amber-500/70" />
            <span>Rule: Exactly 10 Coins awarded only upon claiming</span>
          </div>

        </div>
      </div>
    </div>
  );
};
