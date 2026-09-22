import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { SUPPORTED_COUNTRIES, POPULAR_LANGUAGES } from '../data/mockData';
import { X, Globe2, User, Mail, Lock, Calendar, Sparkles } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { showAuthModal, setShowAuthModal, loginUser } = useApp();

  const [mode, setMode] = useState<'signup' | 'login'>('signup');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [dob, setDob] = useState('2002-05-14'); // default 24 years old
  const [countryCode, setCountryCode] = useState('IN');
  const [language, setLanguage] = useState('Hindi');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('female');
  const [error, setError] = useState('');

  if (!showAuthModal) return null;

  const calculateAge = (birthDateString: string): number => {
    const today = new Date();
    const birthDate = new Date(birthDateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleGoogleLogin = () => {
    loginUser({
      name: 'Alex Vance',
      username: 'alex_global',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      age: 23,
      country: 'USA',
      countryCode: 'US',
      language: 'English',
      languagesSpoken: ['English', 'Spanish'],
      gender: 'female',
      bio: 'Excited to chat and learn new languages worldwide! 🌍',
      coins: 50,
      isPremium: false,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (mode === 'signup') {
      if (!username.trim() || !name.trim()) {
        setError('Please enter your name and username.');
        return;
      }
      const age = calculateAge(dob);
      if (isNaN(age) || age < 18) {
        setError('You must be 18 years of age or older to register.');
        return;
      }

      const selectedCountryObj = SUPPORTED_COUNTRIES.find(c => c.code === countryCode) || SUPPORTED_COUNTRIES[0];

      // Sample friendly avatar based on gender
      const avatarUrl = gender === 'female' 
        ? 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80';

      loginUser({
        name,
        username: username.toLowerCase().replace(/\s+/g, '_'),
        avatar: avatarUrl,
        age,
        country: selectedCountryObj.name,
        countryCode: selectedCountryObj.code,
        language,
        languagesSpoken: [language, 'English'],
        gender,
        bio: `Hi there! I am connecting from ${selectedCountryObj.name}. Let's chat! 🌟`,
        coins: 50,
        isPremium: false,
      });
    } else {
      // Login simulation
      if (!email.trim() || !password.trim()) {
        setError('Please enter your email and password.');
        return;
      }
      loginUser({
        name: email.split('@')[0] || 'Member',
        username: (email.split('@')[0] || 'member').toLowerCase(),
        coins: 60,
      });
    }
  };

  return (
    <div id="auth-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div id="auth-modal-card" className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl p-6 md:p-8 shadow-2xl relative my-auto">
        {/* Close button */}
        <button 
          id="btn-close-auth-modal"
          onClick={() => setShowAuthModal(false)}
          className="absolute top-5 right-5 p-2 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center space-x-1.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold px-3 py-1 rounded-full mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Join 100,000+ Global Members</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            {mode === 'signup' ? 'Create Your Account' : 'Welcome Back'}
          </h2>
          <p className="text-neutral-400 text-xs mt-1">
            {mode === 'signup' ? 'Start discovering 1-to-1 video chat partners worldwide' : 'Sign in to access your chats, coins and calls'}
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="grid grid-cols-2 bg-neutral-950 p-1 rounded-xl border border-neutral-800 mb-5">
          <button
            type="button"
            onClick={() => { setMode('signup'); setError(''); }}
            className={`py-2 text-xs font-semibold rounded-lg transition ${
              mode === 'signup' ? 'bg-neutral-800 text-white shadow' : 'text-neutral-400 hover:text-white'
            }`}
          >
            New Account (18+)
          </button>
          <button
            type="button"
            onClick={() => { setMode('login'); setError(''); }}
            className={`py-2 text-xs font-semibold rounded-lg transition ${
              mode === 'login' ? 'bg-neutral-800 text-white shadow' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
        </div>

        {/* 1-Click Google Login Button */}
        <button
          id="btn-google-login"
          type="button"
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center space-x-3 py-3 px-4 bg-white text-neutral-900 rounded-xl font-medium text-xs hover:bg-neutral-100 transition shadow-sm mb-4"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"/>
            <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
          </svg>
          <span>Continue with Google</span>
        </button>

        <div className="flex items-center my-4">
          <div className="flex-1 border-t border-neutral-800"></div>
          <span className="px-3 text-[11px] text-neutral-500 uppercase tracking-wider">or with email</span>
          <div className="flex-1 border-t border-neutral-800"></div>
        </div>

        {error && (
          <div className="p-3 bg-rose-950/40 border border-rose-900/60 rounded-xl text-rose-300 text-xs mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'signup' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-neutral-400 mb-1">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      id="input-name"
                      placeholder="e.g. Priya Roy"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-neutral-400 mb-1">Username</label>
                  <input
                    type="text"
                    id="input-username"
                    placeholder="priya_roy"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              {/* Country & Language */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-neutral-400 mb-1">Your Country</label>
                  <select
                    id="select-country"
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                  >
                    {SUPPORTED_COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code} className="bg-neutral-900">
                        {c.flag} {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-neutral-400 mb-1">Primary Language</label>
                  <select
                    id="select-language"
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

              {/* Date of Birth & Gender */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                    Date of Birth <span className="text-rose-400">(18+ Required)</span>
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
                    <input
                      type="date"
                      id="input-dob"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-2 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-neutral-400 mb-1">Gender</label>
                  <select
                    id="select-gender"
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                  >
                    <option value="female" className="bg-neutral-900">Female</option>
                    <option value="male" className="bg-neutral-900">Male</option>
                    <option value="other" className="bg-neutral-900">Other</option>
                  </select>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-[11px] font-medium text-neutral-400 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
              <input
                type="email"
                id="input-email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-neutral-400 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
              <input
                type="password"
                id="input-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          <button
            type="submit"
            id="btn-auth-submit"
            className="w-full py-3 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-rose-600/20 active:scale-[0.98] transition mt-2"
          >
            {mode === 'signup' ? 'Create 18+ Verified Profile' : 'Sign In Now'}
          </button>
        </form>

        <p className="text-[11px] text-neutral-500 text-center mt-4">
          By continuing, you agree to our strict 18+ Community Safety Guidelines & Anti-Harassment Terms.
        </p>
      </div>
    </div>
  );
};
