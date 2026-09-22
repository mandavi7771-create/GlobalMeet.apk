import React from 'react';
import { useApp } from '../context/AppContext';
import { PhoneCall, PhoneIncoming, PhoneOutgoing, Video, MessageCircle, Clock, Trash2 } from 'lucide-react';

export const CallHistoryScreen: React.FC = () => {
  const { callHistory, allUsers, startVideoCall, openChatWith } = useApp();

  return (
    <div id="call-history-screen" className="pb-24 pt-3 px-3 sm:px-4 max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between px-1">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
            <PhoneCall className="w-5 h-5 text-rose-500" />
            <span>Call History</span>
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Log of your international 1-to-1 video calls
          </p>
        </div>
        <span className="text-xs bg-neutral-900 border border-neutral-800 px-2.5 py-1 rounded-full text-neutral-400">
          {callHistory.length} calls
        </span>
      </div>

      {callHistory.length === 0 ? (
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-neutral-800 text-neutral-500 flex items-center justify-center mx-auto">
            <Video className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-white">No calls yet</h3>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto">
            Explore users on Home or Discover to make your first free 15-second international video call!
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {callHistory.map((call) => {
            const peer = allUsers.find(u => u.id === call.peerId);

            return (
              <div
                key={call.id}
                className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3 flex items-center justify-between hover:border-neutral-750 transition"
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <img
                      src={call.peerAvatar}
                      alt={call.peerName}
                      className="w-11 h-11 rounded-full object-cover bg-neutral-800"
                    />
                    <div className="absolute -bottom-1 -right-1 p-1 bg-neutral-950 rounded-full border border-neutral-800">
                      {call.direction === 'incoming' ? (
                        <PhoneIncoming className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <PhoneOutgoing className="w-3 h-3 text-rose-400" />
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-white">{call.peerName}</h4>
                    <div className="flex items-center space-x-2 text-[11px] text-neutral-400 mt-0.5">
                      <span className="capitalize">{call.direction} video call</span>
                      <span>•</span>
                      <span>{call.durationSeconds}s</span>
                      <span>•</span>
                      <span>{call.timestamp}</span>
                    </div>
                  </div>
                </div>

                {/* Quick actions */}
                <div className="flex items-center space-x-1.5">
                  {peer && (
                    <>
                      <button
                        onClick={() => openChatWith(peer)}
                        className="p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition"
                        title="Chat"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => startVideoCall(peer)}
                        className="p-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl shadow-sm transition active:scale-95"
                        title="Video Call Again"
                      >
                        <Video className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
