import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { SUPPORTED_COUNTRIES } from '../data/mockData';
import { MessageCircle, Search, Video, Sparkles } from 'lucide-react';

export const ConversationsListScreen: React.FC = () => {
  const { conversations, allUsers, openChatWith, startVideoCall, blockedUserIds } = useApp();
  const [search, setSearch] = useState('');

  const filteredConversations = conversations.filter(c => {
    const peer = allUsers.find(u => u.id === c.participantId);
    if (!peer || blockedUserIds.includes(peer.id)) return false;
    if (search.trim()) {
      return peer.name.toLowerCase().includes(search.toLowerCase()) || peer.username.toLowerCase().includes(search.toLowerCase());
    }
    return true;
  });

  return (
    <div id="messages-screen" className="pb-24 pt-3 px-3 sm:px-4 max-w-4xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
            <MessageCircle className="w-5 h-5 text-rose-500" />
            <span>Messages</span>
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Private 1-to-1 conversations with international friends
          </p>
        </div>
      </div>

      {/* Search Messages */}
      <div className="relative">
        <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="Search chats..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500 transition"
        />
      </div>

      {/* Conversation list */}
      {filteredConversations.length === 0 ? (
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-neutral-800 text-neutral-500 flex items-center justify-center mx-auto">
            <MessageCircle className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-white">No active chats</h3>
          <p className="text-xs text-neutral-400 max-w-xs mx-auto">
            Start a conversation with online members on the Home or Discover tabs!
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredConversations.map((conv) => {
            const peer = allUsers.find(u => u.id === conv.participantId);
            if (!peer) return null;
            const countryInfo = SUPPORTED_COUNTRIES.find(c => c.name === peer.country);

            return (
              <div
                key={conv.id}
                onClick={() => openChatWith(peer)}
                className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3 flex items-center justify-between hover:border-neutral-700 cursor-pointer transition select-none group"
              >
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <div className="relative shrink-0">
                    <img
                      src={peer.avatar}
                      alt={peer.name}
                      className="w-12 h-12 rounded-2xl object-cover bg-neutral-800 group-hover:scale-105 transition"
                    />
                    <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-neutral-900 ${
                      peer.status === 'online' ? 'bg-emerald-400' : 'bg-amber-400'
                    }`}></span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-1.5 mb-0.5">
                      <h4 className="text-xs font-bold text-white truncate">{peer.name}</h4>
                      <span className="text-xs">{countryInfo?.flag}</span>
                      {peer.isPremium && (
                        <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-neutral-400 truncate">
                      {conv.lastMessage?.text || 'Sent an image'}
                    </p>
                  </div>
                </div>

                {/* Right time & badge & call action */}
                <div className="flex items-center space-x-2 pl-3">
                  <div className="text-right">
                    <span className="text-[10px] text-neutral-500 block">{conv.lastMessage?.timestamp}</span>
                    {conv.unreadCount > 0 && (
                      <span className="inline-block mt-1 bg-rose-600 text-white font-bold text-[9px] px-1.5 py-0.2 rounded-full">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      startVideoCall(peer);
                    }}
                    className="p-2 bg-neutral-800 hover:bg-rose-600 hover:text-white text-neutral-300 rounded-xl transition"
                    title="Start Call"
                  >
                    <Video className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
