import React from 'react';
import { useApp } from '../context/AppContext';
import { SUPPORTED_COUNTRIES } from '../data/mockData';
import { X, Video, MessageCircle, ShieldAlert, Ban, CheckCircle2, Globe2, Sparkles } from 'lucide-react';

export const UserProfileModal: React.FC = () => {
  const { 
    viewingProfile, 
    setViewingProfile, 
    startVideoCall, 
    openChatWith, 
    blockUser, 
    setReportModalUser,
    setPremiumModalOpen 
  } = useApp();

  if (!viewingProfile) return null;

  const countryInfo = SUPPORTED_COUNTRIES.find(c => c.name === viewingProfile.country);

  const handleStartCall = () => {
    const target = viewingProfile;
    setViewingProfile(null);
    startVideoCall(target);
  };

  const handleStartChat = () => {
    const target = viewingProfile;
    setViewingProfile(null);
    openChatWith(target);
  };

  const handleBlock = () => {
    if (window.confirm(`Are you sure you want to block ${viewingProfile.name}? They won't be able to message or call you.`)) {
      blockUser(viewingProfile.id);
    }
  };

  const handleReport = () => {
    setReportModalUser(viewingProfile);
  };

  return (
    <div id="user-profile-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div id="user-profile-card" className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl relative my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Close Button */}
        <button
          onClick={() => setViewingProfile(null)}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-neutral-950/70 text-neutral-300 hover:text-white backdrop-blur-md transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Hero Photo Banner */}
        <div className="relative h-72 w-full bg-neutral-950">
          <img
            src={viewingProfile.avatar}
            alt={viewingProfile.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-neutral-900/40 to-transparent"></div>

          {/* Badges on hero */}
          <div className="absolute top-4 left-4 flex items-center space-x-2">
            <span className="bg-neutral-950/80 backdrop-blur-md border border-neutral-800 text-xs text-white font-medium px-2.5 py-1 rounded-full flex items-center space-x-1">
              <span>{countryInfo?.flag}</span>
              <span>{viewingProfile.country}</span>
            </span>

            {viewingProfile.isPremium && (
              <button
                id="btn-profile-vip-badge"
                onClick={() => setPremiumModalOpen(true)}
                className="bg-amber-500/25 hover:bg-amber-500/35 backdrop-blur-md border border-amber-500/50 text-amber-300 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center space-x-1 cursor-pointer transition active:scale-95"
                title="VIP Member - Click to view Premium perks"
              >
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>VIP Member ⭐</span>
              </button>
            )}
          </div>

          {/* Floating Profile Identity */}
          <div className="absolute bottom-4 left-5 right-5">
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold text-white">{viewingProfile.name}</h2>
              <span className="text-sm font-semibold text-neutral-300">({viewingProfile.age})</span>
              {viewingProfile.isVerified && (
                <CheckCircle2 className="w-4 h-4 text-blue-400" />
              )}
            </div>
            <p className="text-xs text-neutral-300 mt-0.5">@{viewingProfile.username}</p>
          </div>
        </div>

        {/* Profile Content Body */}
        <div className="p-5 space-y-4">
          {/* Status & Languages Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center space-x-1.5 bg-neutral-950 border border-neutral-800 px-3 py-1 rounded-full text-xs">
              <span className={`w-2 h-2 rounded-full ${
                viewingProfile.status === 'online' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}></span>
              <span className="text-neutral-200 capitalize">{viewingProfile.status}</span>
            </div>

            <div className="flex items-center space-x-1.5 bg-neutral-950 border border-neutral-800 px-3 py-1 rounded-full text-xs text-neutral-300">
              <Globe2 className="w-3.5 h-3.5 text-neutral-400" />
              <span>Languages: {viewingProfile.languagesSpoken.join(', ')}</span>
            </div>
          </div>

          {/* About / Bio */}
          <div>
            <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">About</h4>
            <p className="text-xs text-neutral-200 leading-relaxed bg-neutral-950/60 p-3 rounded-xl border border-neutral-800/80">
              {viewingProfile.bio}
            </p>
          </div>

          {/* Photo Gallery if available */}
          {viewingProfile.photos && viewingProfile.photos.length > 1 && (
            <div>
              <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Photos</h4>
              <div className="grid grid-cols-2 gap-2">
                {viewingProfile.photos.map((photo, i) => (
                  <img
                    key={i}
                    src={photo}
                    alt={`gallery-${i}`}
                    className="w-full h-24 object-cover rounded-xl border border-neutral-800 bg-neutral-800"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Main Action Buttons: Call & Chat */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              id="btn-profile-chat"
              onClick={handleStartChat}
              className="py-3 px-4 bg-neutral-800 hover:bg-neutral-750 text-white font-semibold text-xs rounded-2xl flex items-center justify-center space-x-2 transition active:scale-[0.98]"
            >
              <MessageCircle className="w-4 h-4 text-neutral-300" />
              <span>Send Message</span>
            </button>

            <button
              id="btn-profile-call"
              onClick={handleStartCall}
              className="py-3 px-4 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold text-xs rounded-2xl flex items-center justify-center space-x-2 shadow-lg shadow-rose-600/25 transition active:scale-[0.98]"
            >
              <Video className="w-4 h-4" />
              <span>Start Video Call</span>
            </button>
          </div>

          {/* Safety: Block & Report Options */}
          <div className="flex items-center justify-between pt-3 border-t border-neutral-800/80 text-xs">
            <button
              id="btn-profile-report"
              onClick={handleReport}
              className="flex items-center space-x-1.5 text-neutral-400 hover:text-amber-400 transition"
            >
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              <span>Report Profile</span>
            </button>

            <button
              id="btn-profile-block"
              onClick={handleBlock}
              className="flex items-center space-x-1.5 text-neutral-400 hover:text-rose-400 transition"
            >
              <Ban className="w-4 h-4 text-rose-500" />
              <span>Block User</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
