import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ShieldCheck, Video, MessageCircle, Globe2, AlertTriangle } from 'lucide-react';

export const SplashModal: React.FC = () => {
  const { showSplash, dismissSplash, isAgeConfirmed, confirmAge } = useApp();
  const [isChecked, setIsChecked] = useState(false);
  const [error, setError] = useState('');

  if (!showSplash && isAgeConfirmed) return null;

  const handleProceed = () => {
    if (!isChecked) {
      setError('You must confirm you are 18 years of age or older to enter GlobalMeet.');
      return;
    }
    confirmAge();
    dismissSplash();
  };

  return (
    <div id="splash-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/95 backdrop-blur-md p-4">
      <div id="splash-card" className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-2xl text-center flex flex-col items-center">
        {/* App Logo & Animated Rings */}
        <div className="relative mb-6">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-rose-600 via-pink-600 to-amber-500 p-1 shadow-lg shadow-rose-500/20 flex items-center justify-center animate-pulse">
            <div className="w-full h-full bg-neutral-900 rounded-[22px] flex items-center justify-center">
              <div className="flex items-center space-x-1">
                <Video className="w-8 h-8 text-rose-500" />
                <Globe2 className="w-6 h-6 text-amber-400" />
              </div>
            </div>
          </div>
          <div className="absolute -bottom-2 -right-2 bg-rose-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-full border-2 border-neutral-900">
            18+ ONLY
          </div>
        </div>

        {/* App Name & Tagline */}
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
          Global<span className="text-rose-500">Meet</span>
        </h1>
        <p className="text-rose-400 font-medium text-sm tracking-wide uppercase mb-3">
          Connect • Chat • Video
        </p>
        <p className="text-neutral-400 text-sm mb-6 leading-relaxed">
          The premier international 1-to-1 video calling & messaging community. Discover people from 20+ countries by language and culture.
        </p>

        {/* 18+ Age Gate & Rules Box */}
        <div className="w-full bg-neutral-950/80 border border-neutral-800 rounded-2xl p-4 text-left mb-6">
          <div className="flex items-start space-x-3 mb-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-semibold text-neutral-200">Strict 18+ Community Guidelines</h4>
              <p className="text-[12px] text-neutral-400 leading-snug mt-0.5">
                Zero tolerance for harassment, abuse, fake profiles, or illegal media. Strict moderation is active 24/7.
              </p>
            </div>
          </div>

          <label className="flex items-center space-x-3 mt-4 pt-3 border-t border-neutral-800 cursor-pointer select-none">
            <input 
              type="checkbox"
              id="age-checkbox"
              checked={isChecked}
              onChange={(e) => {
                setIsChecked(e.target.checked);
                if (e.target.checked) setError('');
              }}
              className="w-5 h-5 rounded border-neutral-700 bg-neutral-800 text-rose-600 focus:ring-rose-500 focus:ring-offset-neutral-900 accent-rose-500"
            />
            <span className="text-xs font-medium text-neutral-200">
              I certify that I am at least <strong className="text-rose-400">18 years of age</strong> and agree to follow all safety policies.
            </span>
          </label>
        </div>

        {error && (
          <div className="flex items-center space-x-2 text-rose-400 text-xs mb-4 bg-rose-950/40 border border-rose-900/50 px-3 py-2 rounded-lg w-full text-left">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Action Button */}
        <button
          id="btn-confirm-age-proceed"
          onClick={handleProceed}
          className={`w-full py-3.5 px-6 rounded-2xl font-semibold text-sm transition-all duration-200 shadow-lg ${
            isChecked 
              ? 'bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white shadow-rose-600/25 active:scale-[0.98]' 
              : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
          }`}
        >
          Enter GlobalMeet
        </button>

        {/* Feature Icons Footer */}
        <div className="flex items-center justify-center space-x-6 text-xs text-neutral-500 mt-6 pt-4 border-t border-neutral-800/60 w-full">
          <span className="flex items-center space-x-1.5">
            <Globe2 className="w-3.5 h-3.5 text-neutral-400" />
            <span>20+ Countries</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <Video className="w-3.5 h-3.5 text-neutral-400" />
            <span>1-to-1 Live Call</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <MessageCircle className="w-3.5 h-3.5 text-neutral-400" />
            <span>Private Chat</span>
          </span>
        </div>
      </div>
    </div>
  );
};
