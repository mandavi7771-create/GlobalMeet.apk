import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { SUPPORTED_COUNTRIES, POPULAR_LANGUAGES } from '../data/mockData';
import { Search, Filter, Video, MessageCircle, Globe2, Sparkles, CheckCircle2, UserX } from 'lucide-react';

export const DiscoverScreen: React.FC = () => {
  const { 
    allUsers, 
    blockedUserIds, 
    currentUser, 
    startVideoCall, 
    openChatWith, 
    setViewingProfile 
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('All');
  const [selectedLanguage, setSelectedLanguage] = useState('All Languages');
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'recent'>('all');

  // Filter users based on query and selections
  const filteredUsers = useMemo(() => {
    return allUsers.filter(user => {
      if (user.id === currentUser.id) return false;
      if (blockedUserIds.includes(user.id)) return false;
      if (user.accountStatus === 'banned' || user.accountStatus === 'suspended') return false;

      // Search query match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = user.name.toLowerCase().includes(q);
        const matchesUsername = user.username.toLowerCase().includes(q);
        const matchesBio = user.bio.toLowerCase().includes(q);
        const matchesLang = user.languagesSpoken.some(l => l.toLowerCase().includes(q));
        if (!matchesName && !matchesUsername && !matchesBio && !matchesLang) return false;
      }

      // Country filter
      if (selectedCountry !== 'All' && user.country !== selectedCountry) {
        return false;
      }

      // Language filter
      if (selectedLanguage !== 'All Languages' && !user.languagesSpoken.includes(selectedLanguage)) {
        return false;
      }

      // Status filter
      if (statusFilter === 'online' && user.status !== 'online') return false;
      if (statusFilter === 'recent' && user.status === 'offline') return false;

      return true;
    });
  }, [allUsers, currentUser.id, blockedUserIds, searchQuery, selectedCountry, selectedLanguage, statusFilter]);

  return (
    <div id="discover-screen" className="pb-24 pt-3 px-3 sm:px-4 max-w-5xl mx-auto space-y-5">
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
            <Globe2 className="w-5 h-5 text-rose-500" />
            <span>Discover Global People</span>
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Connect with verified 18+ members across 20 countries by language & culture
          </p>
        </div>

        {/* Total found badge */}
        <div className="text-[11px] bg-neutral-900 border border-neutral-800 text-neutral-300 px-3 py-1 rounded-full self-start sm:self-auto">
          Found <strong className="text-rose-400">{filteredUsers.length}</strong> matching profiles
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3" />
        <input
          type="text"
          id="search-discover-users"
          placeholder="Search by username, language, city, or interests..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500 transition"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-2.5 text-xs text-neutral-400 hover:text-white"
          >
            Clear
          </button>
        )}
      </div>

      {/* Filters Section */}
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-3.5 space-y-3">
        <div className="flex items-center space-x-1.5 text-xs font-semibold text-neutral-300 pb-1 border-b border-neutral-800/80">
          <Filter className="w-3.5 h-3.5 text-rose-400" />
          <span>Filter Connections</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Country Selection */}
          <div>
            <label className="block text-[11px] font-medium text-neutral-400 mb-1">Country</label>
            <select
              id="discover-country-filter"
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
            >
              <option value="All">🌐 All Countries ({SUPPORTED_COUNTRIES.length})</option>
              {SUPPORTED_COUNTRIES.map((c) => (
                <option key={c.code} value={c.name} className="bg-neutral-900">
                  {c.flag} {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Language Selection */}
          <div>
            <label className="block text-[11px] font-medium text-neutral-400 mb-1">Language Spoken</label>
            <select
              id="discover-language-filter"
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
            >
              {POPULAR_LANGUAGES.map((lang) => (
                <option key={lang} value={lang} className="bg-neutral-900">
                  {lang}
                </option>
              ))}
            </select>
          </div>

          {/* Online Status Selection */}
          <div>
            <label className="block text-[11px] font-medium text-neutral-400 mb-1">Status</label>
            <div className="grid grid-cols-3 bg-neutral-950 p-1 rounded-xl border border-neutral-800">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`py-1 text-[11px] font-medium rounded-lg transition ${
                  statusFilter === 'all' ? 'bg-neutral-800 text-white' : 'text-neutral-400'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('online')}
                className={`py-1 text-[11px] font-medium rounded-lg transition flex items-center justify-center space-x-1 ${
                  statusFilter === 'online' ? 'bg-emerald-950/80 text-emerald-300 font-semibold' : 'text-neutral-400'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>Online</span>
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('recent')}
                className={`py-1 text-[11px] font-medium rounded-lg transition flex items-center justify-center space-x-1 ${
                  statusFilter === 'recent' ? 'bg-amber-950/80 text-amber-300 font-semibold' : 'text-neutral-400'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                <span>Active</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filtered Grid */}
      {filteredUsers.length === 0 ? (
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-neutral-800 text-neutral-400 flex items-center justify-center mx-auto">
            <UserX className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-white">No users match these filters</h3>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto">
            Try choosing "All Countries" or "All Languages" to discover more members currently available.
          </p>
          <button
            onClick={() => {
              setSelectedCountry('All');
              setSelectedLanguage('All Languages');
              setStatusFilter('all');
              setSearchQuery('');
            }}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-750 text-white text-xs rounded-xl font-medium transition"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden hover:border-neutral-700 transition flex flex-col group shadow-sm"
            >
              {/* Profile Card Media */}
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
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/90 via-neutral-950/20 to-transparent"></div>

                {/* Country Flag & Online Status */}
                <div className="absolute top-2 left-2 flex items-center space-x-1.5 bg-neutral-950/80 backdrop-blur-md px-2 py-0.5 rounded-full border border-neutral-800">
                  <span className="text-xs">{SUPPORTED_COUNTRIES.find(c => c.name === user.country)?.flag}</span>
                  <span className="text-[10px] text-white font-medium">{user.country}</span>
                </div>

                <div className="absolute top-2 right-2">
                  <span className={`inline-block w-2.5 h-2.5 rounded-full ring-2 ring-neutral-950 ${
                    user.status === 'online' ? 'bg-emerald-400' : 'bg-amber-400'
                  }`}></span>
                </div>

                {/* Bottom details over image */}
                <div className="absolute bottom-2 left-2.5 right-2.5">
                  <div className="flex items-center space-x-1">
                    <span className="text-xs font-bold text-white truncate">{user.name}</span>
                    <span className="text-xs text-neutral-300">({user.age})</span>
                    {user.isVerified && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    )}
                  </div>
                  <p className="text-[10px] text-neutral-300 truncate mt-0.5">
                    🗣️ {user.languagesSpoken.join(', ')}
                  </p>
                </div>
              </div>

              {/* Bio summary */}
              <div className="p-2.5 bg-neutral-900 flex-1 flex flex-col justify-between">
                <p className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed mb-2.5">
                  {user.bio}
                </p>

                {/* Interactive buttons */}
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    id={`btn-discover-chat-${user.id}`}
                    onClick={() => openChatWith(user)}
                    className="flex items-center justify-center space-x-1 py-1.5 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 text-xs font-medium rounded-xl transition"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Chat</span>
                  </button>

                  <button
                    id={`btn-discover-call-${user.id}`}
                    onClick={() => startVideoCall(user)}
                    className="flex items-center justify-center space-x-1 py-1.5 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white text-xs font-semibold rounded-xl shadow-sm transition active:scale-95"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Call 15s</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
