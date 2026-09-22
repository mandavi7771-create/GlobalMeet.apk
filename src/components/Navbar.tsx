import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Video, Coins, Bell, Crown, ShieldAlert, Sparkles, Menu } from 'lucide-react';
import { MenuModal } from './MenuModal';

export const Navbar: React.FC = () => {
  const { 
    coins, 
    currentUser, 
    activeTab, 
    setActiveTab, 
    unreadNotificationCount, 
    setIsNotificationCenterOpen,
    openRewardedAd,
    setPremiumModalOpen 
  } = useApp();

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <header id="main-navbar" className="sticky top-0 z-40 w-full bg-neutral-950/90 backdrop-blur-md border-b border-neutral-850 px-4 py-2.5">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          {/* Brand / Logo */}
          <div className="flex items-center space-x-3">
            {/* Menu Button */}
            <button
              id="btn-open-menu"
              onClick={() => setIsMenuOpen(true)}
              className="p-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-800 rounded-xl transition flex items-center justify-center cursor-pointer active:scale-95"
              title="Open Navigation Menu"
            >
              <Menu className="w-5 h-5 text-rose-500" />
            </button>

            <div 
              onClick={() => setActiveTab('home')}
              className="flex items-center space-x-2.5 cursor-pointer group select-none"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-600 via-pink-600 to-amber-500 p-0.5 shadow-md shadow-rose-600/20 group-hover:scale-105 transition">
                <div className="w-full h-full bg-neutral-950 rounded-[10px] flex items-center justify-center">
                  <Video className="w-4 h-4 text-rose-500" />
                </div>
              </div>
              <div className="hidden sm:block">
                <div className="flex items-center space-x-1.5">
                  <span className="font-bold text-base tracking-tight text-white">
                    Global<span className="text-rose-500">Meet</span>
                  </span>
                  <span className="text-[10px] font-bold bg-neutral-800 text-rose-400 px-1.5 py-0.5 rounded border border-neutral-750">
                    18+
                  </span>
                </div>
                <p className="text-[10px] text-neutral-400 -mt-0.5">International Video Chat</p>
              </div>
            </div>
          </div>

          {/* Right action items */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Firebase Connection Pill */}
            <div 
              id="firebase-status-pill"
              onClick={() => setActiveTab('profile')}
              className="hidden md:flex items-center space-x-1.5 px-2 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-[11px] text-neutral-300 hover:border-neutral-700 cursor-pointer transition"
              title="Firebase Project: globalmeet-21815 | Android: com.globalmeet.app"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-mono text-[10px] text-neutral-400">Firebase</span>
            </div>

            {/* Admin Dashboard Switch */}
            <button
              id="btn-admin-toggle"
              onClick={() => setActiveTab(activeTab === 'admin' ? 'home' : 'admin')}
              className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition ${
                activeTab === 'admin'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                  : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white hover:border-neutral-700'
              }`}
              title="Admin Moderation & Analytics Panel"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Admin Panel</span>
            </button>

            {/* Premium VIP status / Upgrade */}
            {currentUser.isPremium ? (
              <button
                id="btn-nav-premium-active"
                onClick={() => setPremiumModalOpen(true)}
                className="hidden sm:flex items-center space-x-1.5 bg-gradient-to-r from-amber-500/25 via-amber-400/15 to-yellow-500/25 border border-amber-500/40 text-amber-300 hover:text-white hover:border-amber-300 px-2.5 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer active:scale-95 shadow-sm"
                title="VIP Premium Active - Click to view benefits & plan"
              >
                <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="font-bold text-[11px] tracking-tight">VIP Premium</span>
              </button>
            ) : (
              <button
                id="btn-upgrade-premium-nav"
                onClick={() => setPremiumModalOpen(true)}
                className="hidden sm:flex items-center space-x-1.5 bg-gradient-to-r from-amber-500/20 via-rose-500/20 to-amber-500/20 border border-amber-500/40 text-amber-300 hover:text-white hover:border-amber-400 px-2.5 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer active:scale-95 shadow-sm"
                title="Upgrade to VIP Premium (Unlimited Video Calls)"
              >
                <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="font-bold text-[11px] tracking-tight">VIP Premium</span>
              </button>
            )}

            {/* Coins Wallet */}
            <div 
              id="coin-wallet-badge"
              className="flex items-center bg-neutral-900 border border-neutral-800 rounded-full pl-2.5 pr-1 py-0.5 space-x-2"
            >
              <button 
                id="btn-nav-coins-store"
                onClick={() => setPremiumModalOpen(true)}
                className="flex items-center space-x-1 hover:opacity-80 transition cursor-pointer"
                title="Click to Buy Coins or View VIP Plans"
              >
                <span className="text-amber-400 text-xs">🪙</span>
                <span className="text-xs font-bold text-white tracking-wide">{coins.toLocaleString()}</span>
              </button>
              <button
                id="btn-nav-watch-ad-earn"
                onClick={() => openRewardedAd('wallet')}
                className="bg-rose-600/90 hover:bg-rose-500 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center space-x-1 transition active:scale-95 shadow-sm cursor-pointer"
                title="Watch Ad & Earn 10 Coins (Verified via Firebase)"
              >
                <Sparkles className="w-3 h-3 text-amber-200" />
                <span>+10</span>
              </button>
            </div>

            {/* Notifications Bell */}
            <button
              id="btn-open-notifications"
              onClick={() => setIsNotificationCenterOpen(true)}
              className="relative p-2 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-850 transition"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadNotificationCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white font-bold text-[10px] rounded-full flex items-center justify-center animate-pulse">
                  {unreadNotificationCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Slide-over Menu Modal */}
      <MenuModal isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </>
  );
};
