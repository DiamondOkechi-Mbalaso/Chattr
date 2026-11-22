import React, { useState, useEffect } from 'react';
import { ToastProvider } from './components/common/Toast';
import { NavigationSidebar, NavigationTab } from './components/layout/NavigationSidebar';
import { ConversationList } from './components/chat/ConversationList';
import { ChatArea } from './components/chat/ChatArea';
import { ContactsView } from './components/contacts/ContactsView';
import { CallHistoryView } from './components/calls/CallHistoryView';
import { StatusView } from './components/status/StatusView';
import { SettingsView } from './components/settings/SettingsView';
import { CallOverlay } from './components/calls/CallOverlay';
import { IncomingCallModal } from './components/calls/IncomingCallModal';
import { MediaViewer } from './components/chat/MediaViewer';
import { UserProfileModal } from './components/profile/UserProfileModal';
import { GroupManagerModal } from './components/groups/GroupManagerModal';
import { AuthModal } from './components/auth/AuthModal';
import { storage } from './services/storage';
import { peerService } from './services/peerService';
import { Conversation, UserProfile, Attachment } from './types';
import { Lock, ArrowRight, Download } from 'lucide-react';

export const AppContent: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserProfile>(storage.getCurrentUser());
  const [activeTab, setActiveTab] = useState<NavigationTab>('chats');
  const [conversations, setConversations] = useState<Conversation[]>(storage.getConversations());
  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    storage.getConversations()[0]?.id || null
  );

  const [viewingProfileUser, setViewingProfileUser] = useState<UserProfile | null>(null);
  const [viewingMedia, setViewingMedia] = useState<Attachment | null>(null);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    storage.applySettingsToDOM(storage.getSettings());
    peerService.init();

    const storedUser = localStorage.getItem('chattr_current_user_id');
    if (!storedUser) {
      setIsAuthModalOpen(true);
    }

    const unsubscribe = storage.subscribeToSync((event) => {
      if (
        event.type === 'NEW_MESSAGE' ||
        event.type === 'UPDATE_MESSAGE' ||
        event.type === 'DELETE_MESSAGE'
      ) {
        setConversations(storage.getConversations());
      } else if (event.type === 'USER_STATUS') {
        setConversations(storage.getConversations());
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
    setActiveTab('chats');

    const updated = conversations.map((c) =>
      c.id === id ? { ...c, unread_count: 0 } : c
    );
    setConversations(updated);
    storage.saveConversations(updated);
  };

  const handleUserSwitch = (user: UserProfile) => {
    storage.setCurrentUser(user.id);
    setCurrentUser(user);
    peerService.init();
    setConversations(storage.getConversations());
    setActiveConversationId(storage.getConversations()[0]?.id || null);
  };

  const handleStartDirectChat = (targetUserId: string) => {
    const allUsers = storage.getUsers();
    const targetUser = allUsers.find((u) => u.id === targetUserId);
    if (!targetUser) return;

    const existing = conversations.find(
      (c) =>
        c.type === 'direct' &&
        c.participants.some((p) => p.id === targetUserId)
    );

    if (existing) {
      handleSelectConversation(existing.id);
    } else {
      const newConv = storage.createConversation({
        type: 'direct',
        name: targetUser.display_name,
        avatar_url: targetUser.avatar_url,
        participants: [currentUser, targetUser],
      });
      setConversations(storage.getConversations());
      handleSelectConversation(newConv.id);
    }
  };

  const activeConversation = conversations.find((c) => c.id === activeConversationId);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#fcf5eb] dark:bg-[#0c0f14] text-[#111b21] dark:text-[#f8fafc] transition-colors">
      {/* Left Navigation Dock */}
      <NavigationSidebar
        activeTab={activeTab}
        onTabChange={(tab) => {
          if (tab === 'saved') {
            handleSelectConversation('conv_saved');
          } else {
            setActiveTab(tab);
          }
        }}
        currentUser={currentUser}
        onUserSwitch={handleUserSwitch}
      />

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#fcf5eb] dark:bg-[#0c0f14] transition-colors">
        {/* Top Header — Pure White / Dark Slate Navigation Bar */}
        <div className="h-14 px-6 bg-[#ffffff] dark:bg-[#141923] border-b border-[#f0f4f9] dark:border-[#1e2638] flex items-center justify-between text-xs text-[#1c1e21] dark:text-[#e2e8f0] select-none z-10 transition-colors">
          <div className="flex items-center gap-3">
            <span className="font-bold text-base tracking-tight text-[#111b21] dark:text-[#f8fafc] flex items-center gap-2">
              <img src="/logo.png" alt="Chattr" className="w-6 h-6 rounded-full object-cover shadow-sm" />
              <span className="text-[#ff6b00]">Chattr</span>
            </span>
            <span className="hidden sm:inline text-[#5e5e5e] dark:text-[#94a3b8]">•</span>
            <span className="hidden sm:inline text-[#5e5e5e] dark:text-[#94a3b8]">
              Connected as <strong className="text-[#111b21] dark:text-[#f8fafc]">{currentUser.display_name}</strong>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden md:inline-flex items-center gap-1.5 text-[#5e5e5e] dark:text-[#94a3b8] text-xs">
              <Lock className="w-3.5 h-3.5 text-[#ff6b00]" /> End-to-end encrypted
            </span>

            {/* Account Portal Button */}
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="px-4 py-1.5 rounded-[50px] border border-[#1c1e21] dark:border-[#334155] text-[#1c1e21] dark:text-[#e2e8f0] hover:bg-[#f0f4f9] dark:hover:bg-[#1e2638] font-medium transition-colors flex items-center gap-1 text-xs"
            >
              Account <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Dynamic Tab Views */}
        <div className="flex-1 flex overflow-hidden">
          {activeTab === 'chats' && (
            <>
              {/* Conversation list */}
              <div
                className={`${
                  activeConversationId ? 'hidden md:flex' : 'flex'
                } h-full`}
              >
                <ConversationList
                  conversations={conversations}
                  activeConversationId={activeConversationId}
                  currentUserId={currentUser.id}
                  onSelectConversation={handleSelectConversation}
                  onNewChat={() => setActiveTab('contacts')}
                  onNewGroup={() => setIsGroupModalOpen(true)}
                />
              </div>

              {/* Chat Area or Sunlit Welcome Screen */}
              {activeConversation ? (
                <ChatArea
                  key={activeConversation.id}
                  conversation={activeConversation}
                  currentUserId={currentUser.id}
                  bubbleStyle="modern"
                  onOpenProfile={(u) => setViewingProfileUser(u)}
                  onViewMedia={(att) => setViewingMedia(att)}
                  onBackMobile={() => setActiveConversationId(null)}
                />
              ) : (
                /* Chattr Welcome Canvas */
                <div className="hidden md:flex flex-1 flex-col items-center justify-center text-center p-8 bg-[#fcf5eb] dark:bg-[#0c0f14] text-[#1c1e21] dark:text-[#f8fafc] select-none transition-colors">
                  {/* Glowing Chattr Planet Logo */}
                  <div className="w-24 h-24 rounded-[25px] bg-[#ffffff] dark:bg-[#141923] border border-[#f0f4f9] dark:border-[#1e2638] flex items-center justify-center mb-6 shadow-md overflow-hidden p-3 ring-4 ring-[#ff6b00]/15">
                    <img src="/logo.png" alt="Chattr" className="w-full h-full object-cover rounded-2xl" />
                  </div>
                  <h3 className="text-3xl font-bold text-[#111b21] dark:text-[#f8fafc] mb-2 tracking-tight">
                    Welcome to Chattr
                  </h3>
                  <p className="text-sm text-[#5e5e5e] dark:text-[#94a3b8] max-w-md leading-relaxed mb-6">
                    Real-time messaging, crisp voice & video calls, media sharing, and customizable communities — fast, private, and simple.
                  </p>
                  {/* Primary CTA Pill Button: 50px radius, #ff6b00 vibrant orange background */}
                  <button
                    onClick={() => setActiveTab('contacts')}
                    className="flex items-center gap-2 px-8 py-3 bg-[#ff6b00] hover:bg-[#e65c00] text-white rounded-[50px] text-base font-bold shadow-md shadow-orange-500/25 transition-all transform hover:scale-105 active:scale-95"
                  >
                    <ArrowRight className="w-5 h-5" /> Start a Conversation
                  </button>
                  <div className="flex items-center gap-1.5 text-xs text-[#5e5e5e] dark:text-[#94a3b8] mt-12">
                    <Lock className="w-3.5 h-3.5 text-[#ff6b00]" /> Your personal chats are end-to-end encrypted
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'contacts' && (
            <ContactsView
              onStartChat={(uid) => handleStartDirectChat(uid)}
              onOpenProfile={(u) => setViewingProfileUser(u)}
            />
          )}

          {activeTab === 'calls' && <CallHistoryView />}

          {activeTab === 'status' && <StatusView />}

          {activeTab === 'settings' && <SettingsView />}
        </div>
      </div>

      {/* Global Modals & Lightboxes */}
      <CallOverlay />
      <IncomingCallModal />
      <MediaViewer
        attachment={viewingMedia}
        onClose={() => setViewingMedia(null)}
      />
      <UserProfileModal
        user={viewingProfileUser}
        isOpen={Boolean(viewingProfileUser)}
        onClose={() => setViewingProfileUser(null)}
        onStartChat={(uid) => handleStartDirectChat(uid)}
      />
      <GroupManagerModal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        onGroupCreated={(conv) => {
          setConversations(storage.getConversations());
          handleSelectConversation(conv.id);
        }}
      />
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthenticated={(u) => handleUserSwitch(u)}
      />
    </div>
  );
};

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}
