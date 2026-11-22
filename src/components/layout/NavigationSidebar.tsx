import React, { useState } from 'react';
import {
  MessageSquare,
  Users,
  Phone,
  Sparkles,
  Bookmark,
  Settings,
  Sun,
  Moon,
  Monitor,
} from 'lucide-react';
import { UserProfile, ThemeMode } from '../../types';
import { Avatar } from '../common/Avatar';
import { storage } from '../../services/storage';
import { useToast } from '../common/Toast';

export type NavigationTab = 'chats' | 'contacts' | 'calls' | 'status' | 'saved' | 'settings';

interface NavigationSidebarProps {
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  currentUser: UserProfile;
  onUserSwitch: (user: UserProfile) => void;
}

export const NavigationSidebar: React.FC<NavigationSidebarProps> = ({
  activeTab,
  onTabChange,
  currentUser,
  onUserSwitch,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const allUsers = storage.getUsers();
  const settings = storage.getSettings();
  const toast = useToast();

  const handleCycleTheme = () => {
    const cycle: ThemeMode[] = ['system', 'light', 'dark'];
    const nextIdx = (cycle.indexOf(settings.theme) + 1) % cycle.length;
    const nextTheme = cycle[nextIdx];
    storage.saveSettings({ theme: nextTheme });
    toast.info(`Theme set to ${nextTheme}`);
  };

  const navItems: { id: NavigationTab; label: string; icon: React.ElementType }[] = [
    { id: 'chats', label: 'Chats', icon: MessageSquare },
    { id: 'contacts', label: 'Contacts', icon: Users },
    { id: 'calls', label: 'Calls', icon: Phone },
    { id: 'status', label: 'Status', icon: Sparkles },
    { id: 'saved', label: 'Saved', icon: Bookmark },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Desktop / Tablet Left Dock — Chattr Orange Navigation */}
      <div className="hidden md:flex flex-col items-center justify-between w-16 lg:w-20 h-full bg-[#ffffff] dark:bg-[#141923] border-r border-[#f0f4f9] dark:border-[#1e2638] py-5 select-none z-30 transition-colors">
        {/* Brand Logo with Chattr Image Logo */}
        <div className="flex flex-col items-center gap-6">
          <div
            onClick={() => onTabChange('chats')}
            className="w-12 h-12 rounded-[50px] overflow-hidden shadow-md cursor-pointer transform hover:scale-105 transition-all p-0.5 bg-gradient-to-tr from-[#ff6b00] to-[#ff9500] ring-2 ring-[#ff6b00]/30"
            title="Chattr"
          >
            <img
              src="/logo.png"
              alt="Chattr"
              className="w-full h-full object-cover rounded-full"
            />
          </div>

          {/* Navigation Tab Icons with Chattr Orange Pill Style */}
          <div className="flex flex-col items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`relative p-3 rounded-[50px] transition-all duration-150 ${
                    isActive
                      ? 'bg-[#ffe6d4] dark:bg-[#ff6b00]/25 text-[#ff6b00] dark:text-[#ff9500] font-bold'
                      : 'text-[#5e5e5e] dark:text-[#94a3b8] hover:text-[#ff6b00] hover:bg-[#f0f4f9] dark:hover:bg-[#1e2638]'
                  }`}
                  title={item.label}
                >
                  <Icon className="w-5 h-5" />
                  {item.id === 'status' && (
                    <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#ff6b00] ring-2 ring-[#ffffff] dark:ring-[#141923]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom User Avatar & Theme Switcher */}
        <div className="flex flex-col items-center gap-4 relative">
          <button
            onClick={handleCycleTheme}
            className="p-2.5 text-[#5e5e5e] dark:text-[#94a3b8] hover:text-[#ff6b00] hover:bg-[#f0f4f9] dark:hover:bg-[#1e2638] rounded-[50px] transition-colors"
            title={`Current theme: ${settings.theme} (click to switch)`}
          >
            {settings.theme === 'system' ? (
              <Monitor className="w-5 h-5 text-[#ff6b00]" />
            ) : settings.theme === 'dark' ? (
              <Moon className="w-5 h-5 text-indigo-400" />
            ) : (
              <Sun className="w-5 h-5 text-amber-500" />
            )}
          </button>

          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="p-0.5 rounded-full ring-2 ring-[#ff6b00] hover:scale-105 transition-all cursor-pointer"
              title={`${currentUser.display_name} (Switch account)`}
            >
              <Avatar
                src={currentUser.avatar_url}
                name={currentUser.display_name}
                size="sm"
                status={currentUser.status}
                showStatus
              />
            </button>

            {/* Quick Switch User Popup */}
            {showUserMenu && (
              <div className="absolute bottom-0 left-full ml-3 w-56 bg-[#ffffff] dark:bg-[#141923] border border-[#f0f4f9] dark:border-[#1e2638] rounded-2xl shadow-xl p-2 z-50 animate-slide-up text-xs font-medium text-[#111b21] dark:text-[#f8fafc]">
                <div className="px-3 py-2 border-b border-[#f0f4f9] dark:border-[#1e2638] mb-1.5">
                  <div className="font-bold truncate">
                    {currentUser.display_name}
                  </div>
                  <div className="text-[10px] text-[#5e5e5e] dark:text-[#94a3b8]">@{currentUser.username}</div>
                </div>

                <div className="text-[10px] uppercase font-bold text-[#5e5e5e] dark:text-[#94a3b8] px-3 py-1">
                  Switch Account
                </div>
                {allUsers.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => {
                      onUserSwitch(u);
                      setShowUserMenu(false);
                      toast.success(`Switched to ${u.display_name}`);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-colors ${
                      u.id === currentUser.id
                        ? 'bg-[#ffe6d4] dark:bg-[#ff6b00]/25 text-[#ff6b00] font-bold'
                        : 'hover:bg-[#fcf5eb] dark:hover:bg-[#1e2638]'
                    }`}
                  >
                    <Avatar src={u.avatar_url} name={u.display_name} size="xs" />
                    <span className="truncate">{u.display_name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden flex items-center justify-around h-16 bg-[#ffffff] dark:bg-[#141923] border-t border-[#f0f4f9] dark:border-[#1e2638] px-2 select-none z-30">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`p-2.5 rounded-[50px] transition-colors ${
                isActive ? 'text-[#ff6b00]' : 'text-[#5e5e5e] dark:text-[#94a3b8]'
              }`}
            >
              <Icon className="w-5 h-5" />
            </button>
          );
        })}
      </div>
    </>
  );
};
