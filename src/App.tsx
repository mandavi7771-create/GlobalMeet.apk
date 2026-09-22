import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { HomeScreen } from './components/HomeScreen';
import { DiscoverScreen } from './components/DiscoverScreen';
import { ConversationsListScreen } from './components/ConversationsListScreen';
import { CallHistoryScreen } from './components/CallHistoryScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { AdminDashboard } from './components/AdminDashboard';
import { SplashModal } from './components/SplashModal';
import { AuthModal } from './components/AuthModal';
import { UserProfileModal } from './components/UserProfileModal';
import { ChatScreen } from './components/ChatScreen';
import { VideoCallModal } from './components/VideoCallModal';
import { RewardedAdModal } from './components/RewardedAdModal';
import { PremiumModal } from './components/PremiumModal';
import { NotificationsModal } from './components/NotificationsModal';
import { SafetyModal } from './components/SafetyModal';

const MainLayout: React.FC = () => {
  const { activeTab, activeChatUser, activeCall } = useApp();

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans">
      {/* Top Navigation */}
      <Navbar />

      {/* Main Tab Content */}
      <main className="flex-1">
        {activeTab === 'home' && <HomeScreen />}
        {activeTab === 'discover' && <DiscoverScreen />}
        {activeTab === 'messages' && <ConversationsListScreen />}
        {activeTab === 'calls' && <CallHistoryScreen />}
        {activeTab === 'profile' && <SettingsScreen />}
        {activeTab === 'admin' && <AdminDashboard />}
      </main>

      {/* Persistent Bottom Navigation (hidden during active call or full chat) */}
      {!activeCall && !activeChatUser && <BottomNav />}

      {/* Modals and Overlays */}
      <SplashModal />
      <AuthModal />
      <UserProfileModal />
      <ChatScreen />
      <VideoCallModal />
      <RewardedAdModal />
      <PremiumModal />
      <NotificationsModal />
      <SafetyModal />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
