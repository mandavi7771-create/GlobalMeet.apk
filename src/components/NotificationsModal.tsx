import React from 'react';
import { useApp } from '../context/AppContext';
import { X, Bell, MessageCircle, PhoneCall, Coins, Crown, Eye, ShieldCheck, CheckCheck } from 'lucide-react';

export const NotificationsModal: React.FC = () => {
  const { 
    isNotificationCenterOpen, 
    setIsNotificationCenterOpen, 
    notifications, 
    markAllNotificationsRead,
    allUsers,
    openChatWith
  } = useApp();

  if (!isNotificationCenterOpen) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'message': return <MessageCircle className="w-4 h-4 text-blue-400" />;
      case 'call': return <PhoneCall className="w-4 h-4 text-rose-400" />;
      case 'coin': return <Coins className="w-4 h-4 text-amber-400" />;
      case 'premium': return <Crown className="w-4 h-4 text-amber-300" />;
      case 'view': return <Eye className="w-4 h-4 text-purple-400" />;
      default: return <ShieldCheck className="w-4 h-4 text-emerald-400" />;
    }
  };

  const handleNotificationClick = (notif: any) => {
    if (notif.actionUserId) {
      const target = allUsers.find(u => u.id === notif.actionUserId);
      if (target) {
        setIsNotificationCenterOpen(false);
        openChatWith(target);
      }
    }
  };

  return (
    <div id="notifications-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div id="notifications-modal-card" className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="bg-neutral-950 px-5 py-3.5 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bell className="w-4 h-4 text-rose-500" />
            <h3 className="text-sm font-bold text-white">Notifications Center</h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={markAllNotificationsRead}
              className="text-[11px] text-neutral-400 hover:text-white flex items-center space-x-1"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark read</span>
            </button>
            <button
              onClick={() => setIsNotificationCenterOpen(false)}
              className="p-1.5 rounded-full text-neutral-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {notifications.length === 0 ? (
            <div className="text-center py-10 text-neutral-500 text-xs">
              No notifications yet.
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`p-3 rounded-2xl border transition flex items-start space-x-3 ${
                  notif.actionUserId ? 'cursor-pointer hover:border-neutral-700' : ''
                } ${
                  notif.read
                    ? 'bg-neutral-950/60 border-neutral-850 text-neutral-400'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-200'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center shrink-0">
                  {getIcon(notif.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <h4 className="text-xs font-semibold text-white truncate">{notif.title}</h4>
                    <span className="text-[10px] text-neutral-500 shrink-0 ml-2">{notif.timestamp}</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-neutral-400">
                    {notif.message}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
