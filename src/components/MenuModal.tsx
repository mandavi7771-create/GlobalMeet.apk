import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Menu, 
  X, 
  Home, 
  Compass, 
  MessageSquare, 
  PhoneCall, 
  User, 
  ShieldAlert, 
  Crown, 
  Coins, 
  ShieldCheck, 
  Sparkles,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

interface MenuModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MenuModal: React.FC<MenuModalProps> = ({ isOpen, onClose }) => {
  const { 
    setActiveTab, 
    currentUser, 
    coins, 
    setPremiumModalOpen, 
    openRewardedAd 
  } = useApp();

  if (!isOpen) return null;

  const navigateTo = (tab: 'home' | 'discover' | 'messages' | 'calls' | 'profile' | 'admin') => {
    setActiveTab(tab);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex bg-black/70 backdrop-blur-sm animate-fade-in">
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Slide-over Menu Drawer */}
      <div className="relative w-80 max-w-[85vw] bg-neutral-900 border-r border-neutral-800 flex flex-col h-full shadow-2xl z-10 animate-slide-right">
        
        {/* Header */}
        <div className="p-5 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center text-white font-bold text-base shadow">
              GM
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">GlobalMeet Navigation</h3>
              <p className="text-[11px] text-neutral-400">Main Application Menu</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Card */}
        <div className="p-4 m-3 bg-neutral-950 border border-neutral-800 rounded-2xl flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img 
              src={currentUser.avatar} 
              alt={currentUser.name} 
              className="w-11 h-11 rounded-xl object-cover border border-neutral-800"
            />
            <div>
              <div className="flex items-center space-x-1.5">
                <h4 className="text-xs font-bold text-white">{currentUser.name}</h4>
                {currentUser.isPremium && (
                  <span className="bg-amber-500/20 text-amber-300 text-[9px] font-bold px-1.5 py-0.5 rounded border border-amber-500/30">
                    VIP
                  </span>
                )}
              </div>
              <p className="text-[10px] text-neutral-400">{currentUser.country}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs font-bold text-amber-400 flex items-center space-x-1">
              <span>🪙</span>
              <span>{coins}</span>
            </div>
            <button
              onClick={() => { openRewardedAd('wallet'); onClose(); }}
              className="text-[10px] text-rose-400 hover:underline mt-0.5 block font-semibold"
            >
              + Earn Free
            </button>
          </div>
        </div>

        {/* Menu Links */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5 scrollbar-none">
          <div className="px-3 py-1 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
            Explore & Connect
          </div>

          {[
            { id: 'home', label: 'Live Video Chat', icon: Home, desc: 'Instant 1-to-1 video matching' },
            { id: 'discover', label: 'Discover Global Users', icon: Compass, desc: 'Browse international profiles' },
            { id: 'messages', label: 'Messages & Chats', icon: MessageSquare, desc: 'Secure conversations' },
            { id: 'calls', label: 'Call History', icon: PhoneCall, desc: 'Recent connections & logs' },
            { id: 'profile', label: 'My Profile', icon: User, desc: 'Manage account & settings' },
            { id: 'admin', label: 'Admin & Transaction Hub', icon: ShieldAlert, desc: 'Moderation & payment verification' },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => navigateTo(item.id as any)}
                className="w-full p-3 rounded-2xl flex items-center justify-between text-left hover:bg-neutral-850 transition group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-neutral-800 flex items-center justify-center text-neutral-300 group-hover:bg-rose-600 group-hover:text-white transition">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-rose-400 transition">{item.label}</div>
                    <div className="text-[10px] text-neutral-400">{item.desc}</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-600 group-hover:text-white transition" />
              </button>
            );
          })}

          <div className="pt-2 px-3 py-1 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
            VIP & Security
          </div>

          <button
            onClick={() => { setPremiumModalOpen(true); onClose(); }}
            className="w-full p-3 rounded-2xl flex items-center justify-between text-left hover:bg-neutral-850 transition group"
          >
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Crown className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-amber-300">Upgrade to VIP Premium</div>
                <div className="text-[10px] text-neutral-400">Unlimited video calls & free coins</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-neutral-600 group-hover:text-white transition" />
          </button>

          <button
            onClick={() => { openRewardedAd('wallet'); onClose(); }}
            className="w-full p-3 rounded-2xl flex items-center justify-between text-left hover:bg-neutral-850 transition group"
          >
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Watch Ad & Earn Coins</div>
                <div className="text-[10px] text-neutral-400">+10 Free Coins via Firebase</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-neutral-600 group-hover:text-white transition" />
          </button>
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-neutral-800 text-center">
          <div className="text-[11px] text-neutral-400 font-medium">GlobalMeet v2.4 • Secure 18+ Platform</div>
          <div className="text-[10px] text-neutral-500 mt-0.5">Firebase Firestore & PayPal Gateway Active</div>
        </div>

      </div>
    </div>
  );
};
