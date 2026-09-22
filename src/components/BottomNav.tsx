import React from 'react';
import { useApp } from '../context/AppContext';
import { Home, Compass, MessageCircle, PhoneCall, User } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, conversations } = useApp();

  const totalUnreadMessages = conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);

  interface TabItem {
    id: 'home' | 'discover' | 'messages' | 'calls' | 'profile';
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }

  const tabs: TabItem[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'discover', label: 'Discover', icon: Compass },
    { id: 'messages', label: 'Messages', icon: MessageCircle, badge: totalUnreadMessages },
    { id: 'calls', label: 'Calls', icon: PhoneCall },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <nav id="bottom-navigation-bar" className="fixed bottom-0 left-0 right-0 z-40 bg-neutral-950/95 backdrop-blur-lg border-t border-neutral-850 px-2 py-1.5 sm:py-2">
      <div className="max-w-md mx-auto flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              id={`nav-tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex flex-col items-center justify-center flex-1 py-1 px-2 rounded-xl transition duration-150 ${
                isActive 
                  ? 'text-rose-500' 
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 stroke-[2.2]' : 'stroke-[1.8]'}`} />
                {tab.badge && tab.badge > 0 ? (
                  <span className="absolute -top-1.5 -right-2 bg-rose-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full min-w-[14px] text-center border border-neutral-950">
                    {tab.badge}
                  </span>
                ) : null}
              </div>
              <span className={`text-[10px] mt-1 font-medium tracking-tight ${isActive ? 'font-bold text-rose-500' : 'text-neutral-400'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
