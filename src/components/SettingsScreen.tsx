import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { SUPPORTED_COUNTRIES, POPULAR_LANGUAGES, PREMIUM_PLANS, COIN_PACKAGES } from '../data/mockData';
import { 
  User, 
  Shield, 
  Camera, 
  Mic, 
  Lock, 
  Ban, 
  FileText, 
  HelpCircle, 
  LogOut, 
  Trash2, 
  Check, 
  Sparkles, 
  Crown, 
  Globe2,
  AlertTriangle,
  Database,
  CheckCircle2,
  RefreshCw,
  Coins 
} from 'lucide-react';

export const SettingsScreen: React.FC = () => {
  const { 
    currentUser, 
    updateCurrentUserProfile, 
    privacySettings, 
    updatePrivacySettings, 
    blockedUserIds, 
    unblockUser, 
    allUsers, 
    reports, 
    logoutUser, 
    setPremiumModalOpen,
    upgradeToPremium,
    cancelPremium,
    coins,
    openRewardedAd,
    coinTransactions,
    fetchCoinTransactions,
    firebaseStatus,
    isFirebaseConnected,
    testFirebaseReadWrite,
    setActiveTab
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'premium' | 'wallet' | 'privacy' | 'permissions' | 'blocked' | 'terms' | 'firebase'>('profile');
  const [selectedSettingsPlan, setSelectedSettingsPlan] = useState<'weekly' | 'monthly' | 'lifetime'>('monthly');
  const [refreshingCoins, setRefreshingCoins] = useState(false);
  const [testingFirebase, setTestingFirebase] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; readData?: any } | null>(null);
  const [name, setName] = useState(currentUser.name);
  const [username, setUsername] = useState(currentUser.username);
  const [bio, setBio] = useState(currentUser.bio);
  const [country, setCountry] = useState(currentUser.country);
  const [language, setLanguage] = useState(currentUser.language);
  const [age, setAge] = useState(currentUser.age || 22);
  const [avatar, setAvatar] = useState(currentUser.avatar || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Permissions test state
  const [camStatus, setCamStatus] = useState<'not_tested' | 'granted' | 'denied'>('not_tested');
  const [micStatus, setMicStatus] = useState<'not_tested' | 'granted' | 'denied'>('not_tested');

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const cObj = SUPPORTED_COUNTRIES.find(c => c.name === country);
    updateCurrentUserProfile({
      name,
      username,
      bio,
      country,
      countryCode: cObj?.code || 'IN',
      language,
      age: Number(age) || 22,
      avatar: avatar.trim() || currentUser.avatar,
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      setActiveTab('home');
    }, 800);
  };

  const testPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setCamStatus('granted');
      setMicStatus('granted');
      stream.getTracks().forEach(t => t.stop());
    } catch (e) {
      setCamStatus('denied');
      setMicStatus('denied');
    }
  };

  return (
    <div id="settings-screen" className="pb-24 pt-3 px-3 sm:px-4 max-w-4xl mx-auto space-y-5">
      {/* Header Profile Card */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-center sm:items-start space-y-3 sm:space-y-0 sm:space-x-4 shadow-sm relative overflow-hidden">
        <div className="relative shrink-0">
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-20 h-20 rounded-2xl object-cover border-2 border-neutral-700 bg-neutral-800"
          />
          <span className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-400 border-2 border-neutral-900 rounded-full"></span>
        </div>

        <div className="text-center sm:text-left flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
            <h2 className="text-base font-bold text-white truncate">{currentUser.name}</h2>
            <span className="text-xs bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded-full border border-neutral-700">
              @{currentUser.username}
            </span>
            {currentUser.isPremium ? (
              <button
                id="btn-settings-vip-active"
                onClick={() => setPremiumModalOpen(true)}
                className="text-[11px] bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold px-2.5 py-0.5 rounded-full border border-amber-500/30 flex items-center space-x-1 transition cursor-pointer active:scale-95"
                title="VIP Member - Click to view Premium perks"
              >
                <Crown className="w-3 h-3 text-amber-400" />
                <span>VIP Active ⭐</span>
              </button>
            ) : (
              <button
                id="btn-settings-upgrade-vip"
                onClick={() => setPremiumModalOpen(true)}
                className="text-[11px] bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-neutral-950 font-bold px-3 py-0.5 rounded-full shadow transition cursor-pointer active:scale-95 flex items-center space-x-1"
                title="Upgrade to VIP Premium"
              >
                <Crown className="w-3 h-3 text-neutral-950" />
                <span>Get VIP Premium ⭐</span>
              </button>
            )}
          </div>

          <p className="text-xs text-neutral-400">
            {currentUser.country} • Speaks {currentUser.language} • {currentUser.age} years old
          </p>

          {/* Quick wallet bar */}
          <div className="mt-3 flex items-center justify-center sm:justify-start space-x-3 text-xs">
            <div className="flex items-center space-x-1.5 bg-neutral-950 px-3 py-1.5 rounded-xl border border-neutral-800">
              <span className="text-amber-400">🪙</span>
              <span className="font-bold text-white">{coins} Coins</span>
            </div>
            <button
              onClick={() => openRewardedAd('wallet')}
              className="text-rose-400 hover:text-rose-300 text-xs font-semibold flex items-center space-x-1"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Watch Ad (+10)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sub-tab navigation */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'profile', label: 'Edit Profile', icon: User },
          { id: 'premium', label: currentUser.isPremium ? 'VIP Premium (Active ⭐)' : 'VIP Premium ⭐', icon: Crown },
          { id: 'wallet', label: `Coins & Wallet (${coins}🪙)`, icon: Coins },
          { id: 'privacy', label: 'Privacy & Safety', icon: Lock },
          { id: 'permissions', label: 'Cam & Mic', icon: Camera },
          { id: 'blocked', label: `Blocked (${blockedUserIds.length})`, icon: Ban },
          { id: 'terms', label: '18+ Rules & Policy', icon: FileText },
          { id: 'firebase', label: 'Firebase Cloud', icon: Database },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`py-2 px-3 rounded-xl text-xs font-medium shrink-0 flex items-center space-x-1.5 transition ${
                isActive
                  ? 'bg-neutral-800 text-white font-semibold shadow-sm'
                  : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-850'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Edit Profile */}
      {activeSubTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white">Profile Information & Customization</h3>

          {/* Profile Photo DP & Age */}
          <div className="space-y-3 pt-1 pb-2 border-b border-neutral-800">
            <h4 className="text-xs font-bold text-white flex items-center space-x-1.5">
              <Camera className="w-4 h-4 text-rose-500" />
              <span>Profile Photo (DP) & Appearance</span>
            </h4>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <img
                src={avatar || currentUser.avatar}
                alt="DP Preview"
                className="w-16 h-16 rounded-2xl object-cover border-2 border-neutral-700 bg-neutral-800 shrink-0"
              />
              <div className="flex-1 w-full space-y-2">
                <label className="block text-[11px] font-medium text-neutral-400">Upload Photo from Gallery / Device</label>
                <div className="flex items-center space-x-2">
                  <label className="flex-1 cursor-pointer bg-neutral-800 hover:bg-neutral-750 text-white font-semibold text-xs px-3 py-2.5 rounded-xl border border-neutral-700 flex items-center justify-center space-x-2 transition">
                    <Camera className="w-4 h-4 text-rose-400" />
                    <span>Choose Photo from Gallery</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            if (typeof reader.result === 'string') {
                              setAvatar(reader.result);
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>
                <input
                  type="url"
                  placeholder="Or paste image URL..."
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            {/* Quick Preset Avatars */}
            <div>
              <span className="text-[10px] text-neutral-400 block mb-1.5">Or choose a quick DP style:</span>
              <div className="flex flex-wrap gap-2">
                {[
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
                  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
                  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80',
                  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&auto=format&fit=crop&q=80',
                  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
                ].map((presetUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAvatar(presetUrl)}
                    className={`w-10 h-10 rounded-xl overflow-hidden border-2 transition ${
                      avatar === presetUrl ? 'border-rose-500 scale-105' : 'border-neutral-800 hover:border-neutral-600'
                    }`}
                  >
                    <img src={presetUrl} alt={`preset-${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-[11px] font-medium text-neutral-400 mb-1">Display Name (Name)</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-neutral-400 mb-1">Age (उम्र)</label>
              <input
                type="number"
                min={18}
                max={99}
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-neutral-400 mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-neutral-400 mb-1">Location / Country (लोकेशन)</label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
              >
                {SUPPORTED_COUNTRIES.map((c) => (
                  <option key={c.code} value={c.name} className="bg-neutral-900">
                    {c.flag} {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-neutral-400 mb-1">Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
              >
                {POPULAR_LANGUAGES.filter(l => l !== 'All Languages').map((lang) => (
                  <option key={lang} value={lang} className="bg-neutral-900">
                    {lang}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-neutral-400 mb-1">Short Bio (बायो / परिचय)</label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell others about yourself..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-rose-500"
            />
          </div>

          {savedSuccess && (
            <div className="flex items-center space-x-1.5 text-emerald-400 text-xs bg-emerald-950/40 border border-emerald-800/60 p-2.5 rounded-xl">
              <Check className="w-4 h-4" />
              <span>Profile details updated successfully!</span>
            </div>
          )}

          <button
            type="submit"
            className="py-2.5 px-6 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded-xl shadow transition"
          >
            Save Changes
          </button>
        </form>
      )}

      {/* Tab: VIP Premium Pass */}
      {activeSubTab === 'premium' && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 p-0.5 flex items-center justify-center shrink-0">
                <div className="w-full h-full bg-neutral-950 rounded-[14px] flex items-center justify-center">
                  <Crown className="w-6 h-6 text-amber-400" />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <span>GlobalMeet VIP Premium</span>
                  {currentUser.isPremium ? (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                      Active Member ⭐
                    </span>
                  ) : (
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                      Unlimited Pass
                    </span>
                  )}
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Unlock unlimited 1-to-1 video calls, ad-free experience, and international priority discovery.
                </p>
              </div>
            </div>

            <button
              id="btn-open-premium-modal-from-settings"
              onClick={() => setPremiumModalOpen(true)}
              className="py-2 px-4 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-neutral-950 font-bold text-xs rounded-xl shadow-md transition cursor-pointer active:scale-95 flex items-center space-x-1.5 self-start sm:self-auto"
            >
              <Crown className="w-4 h-4 text-neutral-950" />
              <span>{currentUser.isPremium ? 'View All Plans & Perks' : 'Open Premium Modal'}</span>
            </button>
          </div>

          {/* Current Status Box */}
          {currentUser.isPremium ? (
            <div className="bg-emerald-950/40 border border-emerald-800/60 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-white">Your VIP Premium is Active!</h4>
                  <p className="text-[11px] text-neutral-300 mt-0.5">
                    Plan: <strong className="text-amber-400">{currentUser.premiumPlan || 'Unlimited VIP Pass'}</strong> • Enjoy unlimited video calling with zero cutoff time.
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <button
                  onClick={() => cancelPremium()}
                  className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                  Switch to Free
                </button>
                <button
                  onClick={() => setPremiumModalOpen(true)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-sm"
                >
                  Manage Plan
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-amber-950/30 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-white">Currently on Free Trial Plan</h4>
                  <p className="text-[11px] text-neutral-300 mt-0.5">
                    Calls are limited to 15s or 60s extensions. Upgrade to VIP for unlimited calling.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setPremiumModalOpen(true)}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-rose-500 text-neutral-950 text-xs font-bold rounded-xl shadow transition cursor-pointer active:scale-95 shrink-0"
              >
                Upgrade to VIP Now
              </button>
            </div>
          )}

          {/* Pricing Plans Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white flex items-center space-x-1.5">
                <Crown className="w-4 h-4 text-amber-400" />
                <span>Available VIP Premium Plans</span>
              </h4>
              <button
                onClick={() => setPremiumModalOpen(true)}
                className="text-xs text-amber-400 hover:text-amber-300 font-semibold"
              >
                View Plans & Coin Packages →
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {PREMIUM_PLANS.map((plan) => {
                const isCurrentActive = currentUser.isPremium && currentUser.premiumPlan === plan.name;
                return (
                  <div
                    key={plan.id}
                    onClick={() => setPremiumModalOpen(true)}
                    className={`p-4 rounded-2xl border cursor-pointer relative transition flex flex-col justify-between ${
                      plan.highlight
                        ? 'bg-amber-500/15 border-amber-500 text-white shadow-lg'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                    }`}
                  >
                    {plan.badge && (
                      <span className="absolute -top-2.5 right-4 bg-amber-500 text-neutral-950 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        {plan.badge}
                      </span>
                    )}

                    <div className="space-y-1.5">
                      <h5 className="text-xs font-bold text-white">{plan.name}</h5>
                      <div className="flex items-baseline space-x-1">
                        <span className="text-xl font-black text-amber-400 font-mono">{plan.price}</span>
                        <span className="text-[10px] text-neutral-400">{plan.billingPeriod}</span>
                      </div>
                      <div className="text-[11px] text-amber-300 font-medium">
                        +{plan.bonusCoins.toLocaleString()} Bonus Coins
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPremiumModalOpen(true);
                      }}
                      className={`mt-4 w-full py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
                        plan.highlight
                          ? 'bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow-md'
                          : 'bg-neutral-800 hover:bg-neutral-700 text-white'
                      }`}
                    >
                      {isCurrentActive ? 'Active Plan' : plan.buttonText}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Premium Features List */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 space-y-3">
            <h4 className="text-xs font-bold text-neutral-200">Included in All VIP Plans:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-neutral-300">
              <div className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Unlimited 1-to-1 Video Calling duration</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-amber-400 shrink-0" />
                <span>100% Ad-Free experience (zero popup cutoffs)</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-amber-400 shrink-0" />
                <span>VIP Gold Badge displayed on your profile</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Priority global discovery matching</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Coins Wallet & Rewarded Ads Verification */}
      {activeSubTab === 'wallet' && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <span>Coins & Rewarded Ads System</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-semibold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Firebase Verified
                </span>
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Every verified Rewarded Ad adds exactly 10 Coins directly to your Firestore database.
              </p>
            </div>

            <button
              onClick={async () => {
                setRefreshingCoins(true);
                await fetchCoinTransactions();
                setRefreshingCoins(false);
              }}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-750 text-neutral-300 text-xs rounded-xl font-medium transition cursor-pointer self-start sm:self-auto"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshingCoins ? 'animate-spin' : ''}`} />
              <span>Refresh Transactions</span>
            </button>
          </div>

          {/* Current Balance Display Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-neutral-400 font-medium block">Current Balance</span>
                <div className="flex items-baseline space-x-2 mt-1">
                  <span className="text-2xl font-black text-amber-400 font-mono tracking-tight">{coins}</span>
                  <span className="text-xs font-bold text-neutral-300">Coins</span>
                </div>
                <span className="text-[10px] text-emerald-400 flex items-center space-x-1 mt-1 font-medium">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Real-time Firestore Sync Active</span>
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-xl">
                🪙
              </div>
            </div>

            {/* Rewarded Ad Trigger Card */}
            <div className="bg-gradient-to-br from-rose-950/40 via-neutral-950 to-neutral-950 border border-rose-900/40 rounded-2xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span className="text-xs font-bold text-white">Watch Rewarded Ad</span>
                  <span className="text-[10px] bg-rose-500/20 text-rose-300 px-1.5 py-0.2 rounded font-bold">+10 Coins</span>
                </div>
                <p className="text-[11px] text-neutral-400 mt-1">
                  Watch full 5-second sponsor video. Coins are credited only after server verification.
                </p>
              </div>

              <button
                id="btn-wallet-watch-ad"
                onClick={() => openRewardedAd('wallet')}
                className="mt-3 w-full py-2 px-3 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center space-x-1.5 cursor-pointer active:scale-98"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                <span>Watch Ad & Collect +10 Coins</span>
              </button>
            </div>
          </div>

          {/* Transaction Audit History Log */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-neutral-300 flex items-center space-x-2">
              <Database className="w-3.5 h-3.5 text-rose-400" />
              <span>Database Audit Log (Prevents Duplicate Rewards)</span>
            </h4>

            {coinTransactions.length === 0 ? (
              <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 text-center text-neutral-500 text-xs">
                No coin transactions recorded yet. Watch a Rewarded Ad to earn your first +10 Coins!
              </div>
            ) : (
              <div className="bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden divide-y divide-neutral-850">
                {coinTransactions.map((tx) => (
                  <div key={tx.id} className="p-3 sm:p-3.5 flex items-center justify-between text-xs hover:bg-neutral-900/50 transition">
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <span className={`font-semibold ${tx.amount > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {tx.amount > 0 ? `+${tx.amount}` : tx.amount} Coins
                        </span>
                        <span className="text-[10px] text-neutral-300 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
                          {tx.source ? `${tx.source}` : (tx.type === 'rewarded_ad' ? 'Rewarded Ad (+10)' : tx.type)}
                        </span>
                        <span className="text-[10px] text-emerald-400 font-mono">Verified</span>
                      </div>
                      <div className="text-[11px] text-neutral-400">
                        {tx.reason} • Balance: {tx.previousBalance} → <strong className="text-white font-mono">{tx.newBalance}</strong>
                      </div>
                      {tx.paymentMethod && (
                        <div className="text-[10px] text-blue-300 flex flex-wrap items-center gap-1.5 pt-0.5">
                          <span className="bg-neutral-900 px-1.5 py-0.2 rounded border border-neutral-800">
                            Via {tx.paymentMethod}
                          </span>
                          {tx.merchantReceiver && (
                            <span className="text-neutral-400">
                              → Received in PayPal ({tx.merchantReceiver})
                            </span>
                          )}
                        </div>
                      )}
                      <div className="text-[10px] text-neutral-500 font-mono">
                        Token: {tx.paypalOrderId || `${tx.id.slice(0, 24)}...`}
                      </div>
                    </div>
                    <div className="text-[10px] text-neutral-500 shrink-0 text-right">
                      {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Privacy Settings */}
      {activeSubTab === 'privacy' && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white">Privacy Controls</h3>

          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-medium text-neutral-400 mb-1">Who can send you private messages?</label>
              <select
                value={privacySettings.whoCanMessage}
                onChange={(e) => updatePrivacySettings({ whoCanMessage: e.target.value as any })}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
              >
                <option value="everyone">Everyone (All 18+ verified members)</option>
                <option value="connected">Only users I have contacted first</option>
                <option value="verified">Only Verified & VIP members</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-neutral-400 mb-1">Who can video call you?</label>
              <select
                value={privacySettings.whoCanCall}
                onChange={(e) => updatePrivacySettings({ whoCanCall: e.target.value as any })}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
              >
                <option value="everyone">Everyone (Accept incoming calls)</option>
                <option value="connected">Only users with active chat</option>
                <option value="nobody">Nobody (Do not disturb)</option>
              </select>
            </div>

            <div className="pt-2 space-y-2 border-t border-neutral-800">
              <label className="flex items-center justify-between p-2 rounded-xl bg-neutral-950 border border-neutral-800/80 cursor-pointer">
                <div>
                  <span className="text-xs font-semibold text-white block">Show Online Status</span>
                  <span className="text-[11px] text-neutral-400">Let other members see when you are active</span>
                </div>
                <input
                  type="checkbox"
                  checked={privacySettings.showOnlineStatus}
                  onChange={(e) => updatePrivacySettings({ showOnlineStatus: e.target.checked })}
                  className="w-4 h-4 rounded text-rose-600 accent-rose-500"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-xl bg-neutral-950 border border-neutral-800/80 cursor-pointer">
                <div>
                  <span className="text-xs font-semibold text-white block">Show Age on Profile</span>
                  <span className="text-[11px] text-neutral-400">Display your confirmed 18+ age</span>
                </div>
                <input
                  type="checkbox"
                  checked={privacySettings.showAge}
                  onChange={(e) => updatePrivacySettings({ showAge: e.target.checked })}
                  className="w-4 h-4 rounded text-rose-600 accent-rose-500"
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Hardware Camera & Microphone Permissions */}
      {activeSubTab === 'permissions' && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white">Camera & Microphone Access</h3>
          <p className="text-xs text-neutral-400 leading-relaxed">
            GlobalMeet uses hardware video & audio streams for 1-to-1 video calling. Test your devices below to ensure crystal clear calls.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Camera className="w-5 h-5 text-rose-400" />
                <div>
                  <h4 className="text-xs font-bold text-white">Camera</h4>
                  <span className="text-[11px] text-neutral-400">
                    Status: {camStatus === 'granted' ? '🟢 Ready' : camStatus === 'denied' ? '🔴 Denied' : '⚪ Not Tested'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Mic className="w-5 h-5 text-emerald-400" />
                <div>
                  <h4 className="text-xs font-bold text-white">Microphone</h4>
                  <span className="text-[11px] text-neutral-400">
                    Status: {micStatus === 'granted' ? '🟢 Ready' : micStatus === 'denied' ? '🔴 Denied' : '⚪ Not Tested'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={testPermissions}
            className="py-2.5 px-4 bg-neutral-800 hover:bg-neutral-750 text-white text-xs font-semibold rounded-xl transition"
          >
            Test Camera & Microphone Hardware
          </button>
        </div>
      )}

      {/* Tab 4: Blocked Users List */}
      {activeSubTab === 'blocked' && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white">Blocked Users</h3>
          <p className="text-xs text-neutral-400">
            Blocked accounts cannot message, call, or see your profile.
          </p>

          {blockedUserIds.length === 0 ? (
            <div className="text-center py-6 text-neutral-500 text-xs">
              No blocked users.
            </div>
          ) : (
            <div className="space-y-2">
              {blockedUserIds.map((id) => {
                const user = allUsers.find(u => u.id === id);
                return (
                  <div
                    key={id}
                    className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-2.5">
                      <img
                        src={user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                        alt="avatar"
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <span className="text-xs font-bold text-white">{user?.name || id}</span>
                    </div>

                    <button
                      onClick={() => unblockUser(id)}
                      className="text-xs text-rose-400 hover:text-white font-medium px-3 py-1 bg-neutral-900 border border-neutral-800 rounded-lg"
                    >
                      Unblock
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 5: 18+ Rules & Policy */}
      {activeSubTab === 'terms' && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 space-y-4 text-xs text-neutral-300 leading-relaxed">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>18+ Community Standards & Safety Code</span>
          </h3>

          <div className="space-y-3 bg-neutral-950 p-4 rounded-2xl border border-neutral-800">
            <p><strong>1. Strict 18+ Age Restriction:</strong> You must be 18 years of age or older to use GlobalMeet. Accounts found to be held by minors are permanently terminated.</p>
            <p><strong>2. Zero Harassment & Abuse:</strong> Any hate speech, non-consensual sharing of prohibited media, threats, or harassment in 1-to-1 video calls or private messages will result in immediate device & account ban.</p>
            <p><strong>3. Media Moderation:</strong> Images shared in private chats are subjected to automated content moderation. Users may report any violation at any time.</p>
            <p><strong>4. End-to-End Privacy:</strong> Calls are peer-to-peer and private. We never sell personal identity records or conversation contents.</p>
          </div>
        </div>
      )}

      {/* Tab 6: Firebase Cloud */}
      {activeSubTab === 'firebase' && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Database className="w-4 h-4 text-rose-500" />
              <span>Firebase Cloud Backend Configuration</span>
            </h3>
            <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold flex items-center space-x-1.5 border ${
              isFirebaseConnected 
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isFirebaseConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
              <span>{isFirebaseConnected ? 'Connected to Firebase' : 'Connecting...'}</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="bg-neutral-950 p-3.5 rounded-2xl border border-neutral-800 space-y-1">
              <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">Firebase Project ID</span>
              <p className="font-mono text-white text-xs">{firebaseStatus?.projectId || 'globalmeet-21815'}</p>
            </div>

            <div className="bg-neutral-950 p-3.5 rounded-2xl border border-neutral-800 space-y-1">
              <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">Android Package Name</span>
              <p className="font-mono text-emerald-400 text-xs">com.globalmeet.app</p>
            </div>

            <div className="bg-neutral-950 p-3.5 rounded-2xl border border-neutral-800 space-y-1">
              <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">Firestore Database</span>
              <p className="font-mono text-neutral-300 text-xs truncate" title={firebaseStatus?.databaseId || 'Default'}>
                {firebaseStatus?.databaseId || 'ai-studio-globalmeet-...'}
              </p>
            </div>

            <div className="bg-neutral-950 p-3.5 rounded-2xl border border-neutral-800 space-y-1">
              <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">Cloud Storage Bucket</span>
              <p className="font-mono text-neutral-300 text-xs">globalmeet-21815.firebasestorage.app</p>
            </div>
          </div>

          {/* Test Read/Write Action */}
          <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800 space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-xs font-bold text-white">Live Data Verification</h4>
                <p className="text-[11px] text-neutral-400">Perform an active round-trip write and read test directly to Firestore</p>
              </div>

              <button
                type="button"
                id="btn-verify-firestore"
                disabled={testingFirebase}
                onClick={async () => {
                  setTestingFirebase(true);
                  setTestResult(null);
                  const res = await testFirebaseReadWrite();
                  setTestResult(res);
                  setTestingFirebase(false);
                }}
                className="flex items-center space-x-2 py-2 px-3.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition shadow-sm cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testingFirebase ? 'animate-spin' : ''}`} />
                <span>{testingFirebase ? 'Testing Connection...' : 'Test Live Read & Write'}</span>
              </button>
            </div>

            {testResult && (
              <div className={`p-3 rounded-xl border text-xs ${
                testResult.success 
                  ? 'bg-emerald-950/40 border-emerald-700/50 text-emerald-200' 
                  : 'bg-rose-950/40 border-rose-700/50 text-rose-200'
              }`}>
                <div className="flex items-center space-x-1.5 font-bold mb-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{testResult.message}</span>
                </div>
                {testResult.readData && (
                  <pre className="bg-black/50 p-2.5 rounded-lg text-[11px] font-mono overflow-x-auto text-neutral-300 mt-2">
                    {JSON.stringify(testResult.readData, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Logout & Account Actions */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>
          <h4 className="text-xs font-bold text-white">Session Management</h4>
          <p className="text-[11px] text-neutral-400">Sign out or switch accounts</p>
        </div>

        <button
          onClick={logoutUser}
          className="flex items-center space-x-2 py-2 px-4 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 text-xs font-medium rounded-xl transition"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Log Out</span>
        </button>
      </div>
    </div>
  );
};
