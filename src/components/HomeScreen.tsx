import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserProfile } from '../types';
import { SUPPORTED_COUNTRIES } from '../data/mockData';
import { Video, MessageCircle, Sparkles, Globe2, ShieldCheck, Flame, ChevronRight, CheckCircle2, Crown } from 'lucide-react';

export const HomeScreen: React.FC = () => {
  const { 
    allUsers, 
    blockedUserIds, 
    startVideoCall, 
    openChatWith, 
    setViewingProfile, 
    currentUser,
    setPremiumModalOpen,
    openRewardedAd
  } = useApp();

  const [selectedHomeCountry, setSelectedHomeCountry] = useState<string>('All');

  // Filter out blocked users and current user
  const activeUsers = allUsers.filter(u => 
    u.id !== currentUser.id && 
    !blockedUserIds.includes(u.id) &&
    u.accountStatus !== 'banned' &&
    u.accountStatus !== 'suspended'
  );

  const onlineUsers = activeUsers.filter(u => u.status === 'online');
  const recommendedUsers = activeUsers.filter(u => u.isVerified || u.isPremium);
  
  // Country specific users
  const countryFiltered = selectedHomeCountry === 'All' 
    ? activeUsers 
    : activeUsers.filter(u => u.country === selectedHomeCountry);

  return (
    <div id="home-screen" className="pb-24 pt-3 px-3 sm:px-4 max-w-5xl mx-auto space-y-6">
      
      {/* Monetization & Premium Quick Action Banners */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Daily Video Call Bonus */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose-950/60 via-purple-950/40 to-neutral-900 border border-rose-900/40 p-3.5 flex items-center justify-between shadow-lg">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 p-0.5 shrink-0 flex items-center justify-center">
              <div className="w-full h-full bg-neutral-950 rounded-[10px] flex items-center justify-center">
                <span className="text-base">🪙</span>
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-white">Daily Video Call Bonus</span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 font-semibold px-1.5 py-0.5 rounded border border-amber-500/30">Free Coins</span>
              </div>
              <p className="text-[11px] text-neutral-400">Watch sponsor ad to get +10 coins in Firebase.</p>
            </div>
          </div>
          <button
            id="btn-home-earn-coins"
            onClick={() => openRewardedAd('wallet')}
            className="shrink-0 ml-2 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white text-xs font-semibold px-3 py-2 rounded-xl transition shadow-md shadow-rose-600/20 active:scale-95 flex items-center space-x-1 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Earn Coins</span>
          </button>
        </div>

        {/* VIP Premium Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-950/60 via-yellow-950/30 to-neutral-900 border border-amber-500/40 p-3.5 flex items-center justify-between shadow-lg">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 to-yellow-600 p-0.5 shrink-0 flex items-center justify-center">
              <div className="w-full h-full bg-neutral-950 rounded-[10px] flex items-center justify-center">
                <Crown className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-white">VIP Premium Pass</span>
                {currentUser.isPremium ? (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.5 rounded border border-emerald-500/30">Active ⭐</span>
                ) : (
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-1.5 py-0.5 rounded border border-amber-500/30">Unlimited</span>
                )}
              </div>
              <p className="text-[11px] text-neutral-400">
                {currentUser.isPremium ? 'Unlimited video calls & ad-free experience.' : 'Unlimited 1-to-1 video calls & zero ad cutoffs.'}
              </p>
            </div>
          </div>
          <button
            id="btn-home-upgrade-premium"
            onClick={() => setPremiumModalOpen(true)}
            className="shrink-0 ml-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-neutral-950 text-xs font-bold px-3 py-2 rounded-xl transition shadow-md shadow-amber-500/20 active:scale-95 flex items-center space-x-1 cursor-pointer"
          >
            <Crown className="w-3.5 h-3.5 text-neutral-950" />
            <span>{currentUser.isPremium ? 'VIP Active' : 'Premium'}</span>
          </button>
        </div>
      </div>

      {/* Online Users Story Carousel */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
            <h2 className="text-sm font-bold text-white tracking-tight flex items-center space-x-1">
              <span>Online Now</span>
              <span className="text-xs font-normal text-emerald-400">({onlineUsers.length})</span>
            </h2>
          </div>
          <span className="text-[11px] text-neutral-500">Live 1-to-1</span>
        </div>

        <div className="flex items-center space-x-3.5 overflow-x-auto pb-2 scrollbar-none">
          {onlineUsers.map((user) => (
            <div
              key={user.id}
              onClick={() => setViewingProfile(user)}
              className="flex flex-col items-center space-y-1.5 cursor-pointer shrink-0 group select-none"
            >
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl p-0.5 bg-gradient-to-tr from-rose-500 via-pink-500 to-emerald-400 group-hover:scale-105 transition">
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-full h-full object-cover rounded-[14px] bg-neutral-800"
                    loading="lazy"
                  />
                </div>
                {/* Online pulse indicator */}
                <span className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-neutral-950 rounded-full"></span>
                {/* Flag badge */}
                <span className="absolute -top-1 -right-1 text-xs bg-neutral-900/90 rounded-full px-1 py-0.5 shadow border border-neutral-800">
                  {SUPPORTED_COUNTRIES.find(c => c.name === user.country)?.flag || '🌐'}
                </span>
              </div>
              <span className="text-[11px] font-medium text-neutral-300 max-w-[68px] truncate text-center group-hover:text-white">
                {user.name.split(' ')[0]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Suggested & Recommended Profiles */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center space-x-1.5">
            <Flame className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold text-white tracking-tight">Recommended Profiles</h2>
          </div>
          <button 
            id="btn-home-vip-matches"
            onClick={() => setPremiumModalOpen(true)}
            className="text-xs bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-semibold px-2.5 py-1 rounded-full flex items-center space-x-1 transition cursor-pointer active:scale-95"
            title="Open VIP Premium Options"
          >
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            <span>VIP Premium</span>
            <ChevronRight className="w-3 h-3 text-amber-400" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {recommendedUsers.slice(0, 3).map((user) => (
            <div
              key={user.id}
              className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3.5 hover:border-neutral-700 transition flex flex-col justify-between shadow-sm relative group"
            >
              <div 
                className="flex items-start space-x-3 cursor-pointer"
                onClick={() => setViewingProfile(user)}
              >
                <div className="relative shrink-0">
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-14 h-14 rounded-xl object-cover bg-neutral-800"
                    loading="lazy"
                  />
                  <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-neutral-900 ${
                    user.status === 'online' ? 'bg-emerald-500' : 'bg-amber-400'
                  }`}></span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-1.5">
                    <h3 className="text-xs font-bold text-white truncate">{user.name}</h3>
                    <span className="text-xs">{SUPPORTED_COUNTRIES.find(c => c.name === user.country)?.flag}</span>
                    {user.isVerified && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-neutral-400 truncate">
                    {user.country} • {user.language}
                  </p>
                  <p className="text-[11px] text-neutral-500 line-clamp-1 mt-1">
                    {user.bio}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-neutral-800/80">
                <button
                  id={`btn-chat-rec-${user.id}`}
                  onClick={() => openChatWith(user)}
                  className="flex items-center justify-center space-x-1.5 py-1.5 px-2 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 text-xs font-medium rounded-xl transition"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Chat</span>
                </button>

                <button
                  id={`btn-call-rec-${user.id}`}
                  onClick={() => startVideoCall(user)}
                  className="flex items-center justify-center space-x-1.5 py-1.5 px-2 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white text-xs font-semibold rounded-xl shadow transition active:scale-95"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Call 15s</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Country Filter Quick Bar & People Grid */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center space-x-1.5">
            <Globe2 className="w-4 h-4 text-rose-400" />
            <h2 className="text-sm font-bold text-white tracking-tight">Explore by Country</h2>
          </div>
          <span className="text-[11px] text-neutral-500">20+ Supported Regions</span>
        </div>

        {/* Quick Country Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none mb-3">
          <button
            onClick={() => setSelectedHomeCountry('All')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium shrink-0 transition ${
              selectedHomeCountry === 'All'
                ? 'bg-rose-600 text-white font-semibold shadow'
                : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
            }`}
          >
            🌐 All Countries
          </button>
          {SUPPORTED_COUNTRIES.map((c) => (
            <button
              key={c.code}
              onClick={() => setSelectedHomeCountry(c.name)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium shrink-0 transition flex items-center space-x-1.5 ${
                selectedHomeCountry === c.name
                  ? 'bg-rose-600 text-white font-semibold shadow'
                  : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
              }`}
            >
              <span>{c.flag}</span>
              <span>{c.name}</span>
            </button>
          ))}
        </div>

        {/* Profiles Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {countryFiltered.map((user) => (
            <div
              key={user.id}
              className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden hover:border-neutral-700 transition flex flex-col group shadow-sm"
            >
              {/* Image & Status */}
              <div 
                className="relative aspect-square cursor-pointer overflow-hidden bg-neutral-800"
                onClick={() => setViewingProfile(user)}
              >
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-transparent opacity-80"></div>
                
                {/* Country Flag & Online status */}
                <div className="absolute top-2 left-2 flex items-center space-x-1 bg-neutral-950/70 backdrop-blur-md px-2 py-0.5 rounded-full border border-neutral-800">
                  <span className="text-xs">{SUPPORTED_COUNTRIES.find(c => c.name === user.country)?.flag}</span>
                  <span className="text-[10px] text-neutral-200 font-medium">{user.countryCode}</span>
                </div>

                <div className="absolute top-2 right-2">
                  <span className={`inline-block w-2.5 h-2.5 rounded-full ring-2 ring-neutral-950 ${
                    user.status === 'online' ? 'bg-emerald-400' : 'bg-amber-400'
                  }`}></span>
                </div>

                {/* Bottom details over image */}
                <div className="absolute bottom-2 left-2 right-2">
                  <div className="flex items-center space-x-1">
                    <span className="text-xs font-bold text-white truncate">{user.name}</span>
                    <span className="text-xs text-neutral-400">{user.age}</span>
                  </div>
                  <span className="text-[10px] text-neutral-300 block truncate">
                    🗣️ {user.language}
                  </span>
                </div>
              </div>

              {/* Bottom Quick Call & Chat */}
              <div className="p-2 grid grid-cols-2 gap-1.5 bg-neutral-900">
                <button
                  id={`btn-card-chat-${user.id}`}
                  onClick={() => openChatWith(user)}
                  className="flex items-center justify-center space-x-1 py-1.5 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 text-xs font-medium rounded-xl transition"
                  title="Message"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Chat</span>
                </button>

                <button
                  id={`btn-card-call-${user.id}`}
                  onClick={() => startVideoCall(user)}
                  className="flex items-center justify-center space-x-1 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl shadow-sm transition active:scale-95"
                  title="Video Call"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Call</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
