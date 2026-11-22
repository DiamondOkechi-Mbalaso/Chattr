import React, { useState } from 'react';
import {
  Palette,
  MessageSquare,
  Shield,
  Bell,
  User,
  Smartphone,
  Download,
  RotateCcw,
  Sun,
  Moon,
  Monitor,
} from 'lucide-react';
import { UserSettings, ThemeMode, BubbleStyle } from '../../types';
import { storage } from '../../services/storage';
import { useToast } from '../common/Toast';
import { Avatar } from '../common/Avatar';

export const SettingsView: React.FC = () => {
  const [settings, setSettings] = useState<UserSettings>(storage.getSettings());
  const [activeTab, setActiveTab] = useState<
    'appearance' | 'chat' | 'privacy' | 'notifications' | 'account'
  >('appearance');

  const current = storage.getCurrentUser();
  const [displayName, setDisplayName] = useState(current.display_name);
  const [username, setUsername] = useState(current.username);
  const [bio, setBio] = useState(current.bio);
  const [avatarUrl, setAvatarUrl] = useState(current.avatar_url);
  const [phone, setPhone] = useState(current.phone || '');

  const toast = useToast();

  const updateSetting = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    const updated = storage.saveSettings({ [key]: value });
    setSettings(updated);
    toast.success('Setting saved');
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      ...current,
      display_name: displayName.trim(),
      username: username.trim(),
      bio: bio.trim(),
      avatar_url: avatarUrl.trim(),
      phone: phone.trim(),
    };
    storage.saveUser(updated);
    toast.success('Profile updated!');
  };

  const handleExportData = () => {
    const data = {
      profile: current,
      settings: storage.getSettings(),
      contacts: storage.getContacts(),
      conversations: storage.getConversations(),
      messages: storage.getAllMessages(),
      exportDate: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chattr_data_${current.username}_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('Account data exported');
  };

  const handleResetData = () => {
    if (confirm('Are you sure you want to reset all chats and restore sample data?')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full bg-[#fcf5eb] dark:bg-[#0c0f14] overflow-hidden select-none transition-colors">
      {/* Settings Navigation Sidebar */}
      <div className="w-full md:w-64 bg-[#ffffff] dark:bg-[#141923] border-r border-[#f0f4f9] dark:border-[#1e2638] p-4 space-y-1 transition-colors">
        <h2 className="text-xl font-bold text-[#111b21] dark:text-[#f8fafc] px-3 mb-4">Settings</h2>

        <button
          onClick={() => setActiveTab('appearance')}
          className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-[50px] text-xs font-semibold text-left transition-colors ${
            activeTab === 'appearance'
              ? 'bg-[#ffe6d4] dark:bg-[#7c2d12] text-[#ff6b00] dark:text-[#ff9500] font-bold'
              : 'text-[#5e5e5e] dark:text-[#94a3b8] hover:text-[#111b21] dark:hover:text-[#f8fafc] hover:bg-[#f0f4f9] dark:hover:bg-[#1e2638]'
          }`}
        >
          <Palette className="w-4 h-4 text-[#ff6b00]" /> Appearance & Theme
        </button>

        <button
          onClick={() => setActiveTab('chat')}
          className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-[50px] text-xs font-semibold text-left transition-colors ${
            activeTab === 'chat'
              ? 'bg-[#ffe6d4] dark:bg-[#7c2d12] text-[#ff6b00] dark:text-[#ff9500] font-bold'
              : 'text-[#5e5e5e] dark:text-[#94a3b8] hover:text-[#111b21] dark:hover:text-[#f8fafc] hover:bg-[#f0f4f9] dark:hover:bg-[#1e2638]'
          }`}
        >
          <MessageSquare className="w-4 h-4 text-[#ff6b00]" /> Chats & Media
        </button>

        <button
          onClick={() => setActiveTab('privacy')}
          className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-[50px] text-xs font-semibold text-left transition-colors ${
            activeTab === 'privacy'
              ? 'bg-[#ffe6d4] dark:bg-[#7c2d12] text-[#ff6b00] dark:text-[#ff9500] font-bold'
              : 'text-[#5e5e5e] dark:text-[#94a3b8] hover:text-[#111b21] dark:hover:text-[#f8fafc] hover:bg-[#f0f4f9] dark:hover:bg-[#1e2638]'
          }`}
        >
          <Shield className="w-4 h-4 text-[#ff6b00]" /> Privacy
        </button>

        <button
          onClick={() => setActiveTab('notifications')}
          className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-[50px] text-xs font-semibold text-left transition-colors ${
            activeTab === 'notifications'
              ? 'bg-[#ffe6d4] dark:bg-[#7c2d12] text-[#ff6b00] dark:text-[#ff9500] font-bold'
              : 'text-[#5e5e5e] dark:text-[#94a3b8] hover:text-[#111b21] dark:hover:text-[#f8fafc] hover:bg-[#f0f4f9] dark:hover:bg-[#1e2638]'
          }`}
        >
          <Bell className="w-4 h-4 text-[#ff6b00]" /> Notifications
        </button>

        <button
          onClick={() => setActiveTab('account')}
          className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-[50px] text-xs font-semibold text-left transition-colors ${
            activeTab === 'account'
              ? 'bg-[#ffe6d4] dark:bg-[#7c2d12] text-[#ff6b00] dark:text-[#ff9500] font-bold'
              : 'text-[#5e5e5e] dark:text-[#94a3b8] hover:text-[#111b21] dark:hover:text-[#f8fafc] hover:bg-[#f0f4f9] dark:hover:bg-[#1e2638]'
          }`}
        >
          <User className="w-4 h-4 text-[#ff6b00]" /> Profile & Account
        </button>
      </div>

      {/* Main Settings Panel */}
      <div className="flex-1 overflow-y-auto p-6 md:p-10 max-w-3xl space-y-6">
        {activeTab === 'appearance' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-[#111b21] dark:text-[#f8fafc] mb-1">Theme</h3>
              <p className="text-xs text-[#5e5e5e] dark:text-[#94a3b8] mb-4">
                Choose between system theme, light sunlit cream, or dark obsidian slate.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={() => updateSetting('theme', 'system')}
                  className={`p-4 rounded-[25px] border text-left transition-all ${
                    settings.theme === 'system'
                      ? 'bg-[#ffffff] dark:bg-[#141923] border-[#ff6b00] shadow-md ring-2 ring-[#ff6b00]/30'
                      : 'bg-[#ffffff] dark:bg-[#141923] border-[#f0f4f9] dark:border-[#1e2638] hover:bg-[#f0f4f9] dark:hover:bg-[#1e2638]'
                  }`}
                >
                  <Monitor className="w-5 h-5 text-[#ff6b00] mb-2" />
                  <div className="text-sm font-bold text-[#111b21] dark:text-[#f8fafc]">System Theme</div>
                  <div className="text-[11px] text-[#5e5e5e] dark:text-[#94a3b8] mt-1">Default: auto adapts to your OS</div>
                </button>

                <button
                  onClick={() => updateSetting('theme', 'light')}
                  className={`p-4 rounded-[25px] border text-left transition-all ${
                    settings.theme === 'light'
                      ? 'bg-[#ffffff] dark:bg-[#141923] border-[#ff6b00] shadow-md ring-2 ring-[#ff6b00]/30'
                      : 'bg-[#ffffff] dark:bg-[#141923] border-[#f0f4f9] dark:border-[#1e2638] hover:bg-[#f0f4f9] dark:hover:bg-[#1e2638]'
                  }`}
                >
                  <Sun className="w-5 h-5 text-amber-500 mb-2" />
                  <div className="text-sm font-bold text-[#111b21] dark:text-[#f8fafc]">Light Canvas</div>
                  <div className="text-[11px] text-[#5e5e5e] dark:text-[#94a3b8] mt-1">Sunlit warm off-white backdrop</div>
                </button>

                <button
                  onClick={() => updateSetting('theme', 'dark')}
                  className={`p-4 rounded-[25px] border text-left transition-all ${
                    settings.theme === 'dark'
                      ? 'bg-[#ffffff] dark:bg-[#141923] border-[#ff6b00] shadow-md ring-2 ring-[#ff6b00]/30'
                      : 'bg-[#ffffff] dark:bg-[#141923] border-[#f0f4f9] dark:border-[#1e2638] hover:bg-[#f0f4f9] dark:hover:bg-[#1e2638]'
                  }`}
                >
                  <Moon className="w-5 h-5 text-indigo-400 mb-2" />
                  <div className="text-sm font-bold text-[#111b21] dark:text-[#f8fafc]">Dark Theme</div>
                  <div className="text-[11px] text-[#5e5e5e] dark:text-[#94a3b8] mt-1">Obsidian night slate with orange</div>
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold text-[#111b21] dark:text-[#f8fafc] mb-1">Font Size</h3>
              <p className="text-xs text-[#5e5e5e] dark:text-[#94a3b8] mb-3">Adjust reading scale for messages.</p>
              <div className="flex gap-2.5">
                {(['small', 'medium', 'large'] as const).map((sz) => (
                  <button
                    key={sz}
                    onClick={() => updateSetting('font_size', sz)}
                    className={`px-5 py-2 rounded-[50px] text-xs font-semibold capitalize transition-all ${
                      settings.font_size === sz
                        ? 'bg-[#ff6b00] text-white shadow-sm'
                        : 'bg-[#ffffff] dark:bg-[#141923] text-[#111b21] dark:text-[#f8fafc] border border-[#f0f4f9] dark:border-[#1e2638] hover:bg-[#f0f4f9] dark:hover:bg-[#1e2638]'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="space-y-4">
            <div className="p-4 bg-[#ffffff] dark:bg-[#141923] border border-[#f0f4f9] dark:border-[#1e2638] rounded-[25px] shadow-sm flex items-center justify-between transition-colors">
              <div>
                <div className="text-sm font-bold text-[#111b21] dark:text-[#f8fafc]">Press Enter to Send</div>
                <div className="text-xs text-[#5e5e5e] dark:text-[#94a3b8]">
                  Enter key will send your message immediately.
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.enter_to_send}
                onChange={(e) => updateSetting('enter_to_send', e.target.checked)}
                className="w-5 h-5 rounded accent-[#ff6b00] cursor-pointer"
              />
            </div>

            <div className="p-4 bg-[#ffffff] dark:bg-[#141923] border border-[#f0f4f9] dark:border-[#1e2638] rounded-[25px] shadow-sm flex items-center justify-between transition-colors">
              <div>
                <div className="text-sm font-bold text-[#111b21] dark:text-[#f8fafc]">Read Receipts</div>
                <div className="text-xs text-[#5e5e5e] dark:text-[#94a3b8]">
                  Show blue double checkmarks when messages are read.
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.read_receipts}
                onChange={(e) => updateSetting('read_receipts', e.target.checked)}
                className="w-5 h-5 rounded accent-[#ff6b00] cursor-pointer"
              />
            </div>

            <div className="p-4 bg-[#ffffff] dark:bg-[#141923] border border-[#f0f4f9] dark:border-[#1e2638] rounded-[25px] shadow-sm flex items-center justify-between transition-colors">
              <div>
                <div className="text-sm font-bold text-[#111b21] dark:text-[#f8fafc]">Disappearing Messages Default</div>
                <div className="text-xs text-[#5e5e5e] dark:text-[#94a3b8]">
                  Default timer for new conversations.
                </div>
              </div>
              <select
                value={settings.disappearing_default}
                onChange={(e) => updateSetting('disappearing_default', Number(e.target.value))}
                className="px-4 py-2 bg-[#f0f4f9] dark:bg-[#1e2638] text-xs text-[#111b21] dark:text-[#f8fafc] rounded-[50px] border border-transparent"
              >
                <option value={0}>Off</option>
                <option value={86400}>24 Hours</option>
                <option value={604800}>7 Days</option>
                <option value={2592000}>90 Days</option>
              </select>
            </div>
          </div>
        )}

        {activeTab === 'privacy' && (
          <div className="space-y-4">
            <div className="p-4 bg-[#ffffff] dark:bg-[#141923] border border-[#f0f4f9] dark:border-[#1e2638] rounded-[25px] shadow-sm flex items-center justify-between transition-colors">
              <div>
                <div className="text-sm font-bold text-[#111b21] dark:text-[#f8fafc]">Last Seen & Online</div>
                <div className="text-xs text-[#5e5e5e] dark:text-[#94a3b8]">
                  Control who sees when you are active.
                </div>
              </div>
              <select
                value={settings.last_seen_visibility}
                onChange={(e) => updateSetting('last_seen_visibility', e.target.value as any)}
                className="px-4 py-2 bg-[#f0f4f9] dark:bg-[#1e2638] text-xs text-[#111b21] dark:text-[#f8fafc] rounded-[50px] border border-transparent"
              >
                <option value="everyone">Everyone</option>
                <option value="contacts">My Contacts</option>
                <option value="nobody">Nobody</option>
              </select>
            </div>

            <div className="p-4 bg-[#ffffff] dark:bg-[#141923] border border-[#f0f4f9] dark:border-[#1e2638] rounded-[25px] shadow-sm flex items-center justify-between transition-colors">
              <div>
                <div className="text-sm font-bold text-[#111b21] dark:text-[#f8fafc]">Profile Photo Visibility</div>
                <div className="text-xs text-[#5e5e5e] dark:text-[#94a3b8]">
                  Control who sees your avatar.
                </div>
              </div>
              <select
                value={settings.profile_photo_visibility}
                onChange={(e) => updateSetting('profile_photo_visibility', e.target.value as any)}
                className="px-4 py-2 bg-[#f0f4f9] dark:bg-[#1e2638] text-xs text-[#111b21] dark:text-[#f8fafc] rounded-[50px] border border-transparent"
              >
                <option value="everyone">Everyone</option>
                <option value="contacts">My Contacts</option>
                <option value="nobody">Nobody</option>
              </select>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-4">
            <div className="p-4 bg-[#ffffff] dark:bg-[#141923] border border-[#f0f4f9] dark:border-[#1e2638] rounded-[25px] shadow-sm flex items-center justify-between transition-colors">
              <div>
                <div className="text-sm font-bold text-[#111b21] dark:text-[#f8fafc]">Message Sounds</div>
                <div className="text-xs text-[#5e5e5e] dark:text-[#94a3b8]">
                  Play chimes for incoming and outgoing messages.
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.sound_notifications}
                onChange={(e) => updateSetting('sound_notifications', e.target.checked)}
                className="w-5 h-5 rounded accent-[#ff6b00] cursor-pointer"
              />
            </div>

            <div className="p-4 bg-[#ffffff] dark:bg-[#141923] border border-[#f0f4f9] dark:border-[#1e2638] rounded-[25px] shadow-sm flex items-center justify-between transition-colors">
              <div>
                <div className="text-sm font-bold text-[#111b21] dark:text-[#f8fafc]">Call Ringtone</div>
                <div className="text-xs text-[#5e5e5e] dark:text-[#94a3b8]">
                  Play melodic synthesized ringtone on calls.
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.call_ringtone}
                onChange={(e) => updateSetting('call_ringtone', e.target.checked)}
                className="w-5 h-5 rounded accent-[#ff6b00] cursor-pointer"
              />
            </div>
          </div>
        )}

        {activeTab === 'account' && (
          <div className="space-y-6">
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="flex items-center gap-4 mb-4">
                <Avatar src={avatarUrl} name={displayName} size="xl" />
                <div className="flex-1">
                  <label className="block text-xs font-bold text-[#111b21] dark:text-[#f8fafc] mb-1">
                    Avatar Image URL
                  </label>
                  <input
                    type="url"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#f0f4f9] dark:bg-[#1e2638] text-xs text-[#111b21] dark:text-[#f8fafc] rounded-[50px] border border-transparent focus:outline-none focus:border-[#ff6b00]"
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#111b21] dark:text-[#f8fafc] mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#f0f4f9] dark:bg-[#1e2638] text-sm text-[#111b21] dark:text-[#f8fafc] rounded-[50px] border border-transparent focus:outline-none focus:border-[#ff6b00]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#111b21] dark:text-[#f8fafc] mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#f0f4f9] dark:bg-[#1e2638] text-sm text-[#111b21] dark:text-[#f8fafc] rounded-[50px] border border-transparent focus:outline-none focus:border-[#ff6b00]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111b21] dark:text-[#f8fafc] mb-1">
                  About
                </label>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#f0f4f9] dark:bg-[#1e2638] text-xs text-[#111b21] dark:text-[#f8fafc] rounded-2xl border border-transparent focus:outline-none focus:border-[#ff6b00] resize-none"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#ff6b00] hover:bg-[#e65c00] text-white rounded-[50px] text-xs font-bold shadow-sm shadow-orange-500/25 transition-all"
                >
                  Save Changes
                </button>
              </div>
            </form>

            <div className="border-t border-[#f0f4f9] dark:border-[#1e2638] pt-6 flex flex-wrap gap-3">
              <button
                onClick={handleExportData}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#ffffff] dark:bg-[#141923] hover:bg-[#f0f4f9] dark:hover:bg-[#1e2638] text-[#111b21] dark:text-[#f8fafc] rounded-[50px] text-xs font-bold border border-[#f0f4f9] dark:border-[#1e2638] shadow-sm transition-colors"
              >
                <Download className="w-4 h-4" /> Export Chat Data
              </button>
              <button
                onClick={handleResetData}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#ffffff] dark:bg-[#141923] hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 rounded-[50px] text-xs font-bold border border-rose-200 dark:border-rose-900 transition-colors"
              >
                <RotateCcw className="w-4 h-4" /> Reset Sample Data
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
