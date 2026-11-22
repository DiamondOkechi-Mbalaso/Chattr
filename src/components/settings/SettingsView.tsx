import React, { useState } from 'react';
import {
  Palette,
  MessageSquare,
  Shield,
  Bell,
  User,
  Download,
  RotateCcw,
  Sun,
  Moon,
  Monitor,
  Bot,
  Eye,
  EyeOff,
  CheckCircle,
  Link,
  Copy,
} from 'lucide-react';
import { UserSettings, ThemeMode } from '../../types';
import { storage } from '../../services/storage';
import { aiService } from '../../services/aiService';
import { peerService } from '../../services/peerService';
import { useToast } from '../common/Toast';
import { Avatar } from '../common/Avatar';

export const SettingsView: React.FC = () => {
  const [settings, setSettings] = useState<UserSettings>(storage.getSettings());
  const [activeTab, setActiveTab] = useState<
    'appearance' | 'chat' | 'privacy' | 'notifications' | 'account' | 'ai'
  >('appearance');

  const current = storage.getCurrentUser();
  const [displayName, setDisplayName] = useState(current.display_name);
  const [username, setUsername] = useState(current.username);
  const [bio, setBio] = useState(current.bio);
  const [avatarUrl, setAvatarUrl] = useState(current.avatar_url);
  const [phone, setPhone] = useState(current.phone || '');
  const [geminiKey, setGeminiKey] = useState(localStorage.getItem('chattr_gemini_api_key') || '');
  const [showKey, setShowKey] = useState(false);

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
    peerService.init();
    toast.success('Profile updated!');
  };

  const handleSaveGeminiKey = () => {
    if (!geminiKey.trim()) {
      toast.error('Please paste your Gemini API key first');
      return;
    }
    aiService.setApiKey(geminiKey.trim());
    toast.success('Gemini API key saved! Demo contacts will now respond with AI 🤖');
  };

  const handleClearKey = () => {
    setGeminiKey('');
    localStorage.removeItem('chattr_gemini_api_key');
    toast.success('API key removed');
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

  const handleCopyInviteLink = () => {
    const url = window.location.origin;
    navigator.clipboard.writeText(url);
    toast.success('Invite link copied! Share it so friends can join Chattr 🔗');
  };

  const navBtn = (tab: typeof activeTab, label: string, Icon: React.ElementType) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-[50px] text-xs font-semibold text-left transition-colors ${
        activeTab === tab
          ? 'bg-[#ffe6d4] dark:bg-[#7c2d12] text-[#ff6b00] dark:text-[#ff9500] font-bold'
          : 'text-[#5e5e5e] dark:text-[#94a3b8] hover:text-[#111b21] dark:hover:text-[#f8fafc] hover:bg-[#f0f4f9] dark:hover:bg-[#1e2638]'
      }`}
    >
      <Icon className="w-4 h-4 text-[#ff6b00]" /> {label}
    </button>
  );

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full bg-[#fcf5eb] dark:bg-[#0c0f14] overflow-hidden select-none transition-colors">
      {/* Settings Nav */}
      <div className="w-full md:w-64 bg-[#ffffff] dark:bg-[#141923] border-r border-[#f0f4f9] dark:border-[#1e2638] p-4 space-y-1 transition-colors">
        <h2 className="text-xl font-bold text-[#111b21] dark:text-[#f8fafc] px-3 mb-4">Settings</h2>
        {navBtn('appearance', 'Appearance & Theme', Palette)}
        {navBtn('chat', 'Chats & Media', MessageSquare)}
        {navBtn('privacy', 'Privacy', Shield)}
        {navBtn('notifications', 'Notifications', Bell)}
        {navBtn('ai', 'AI & Contacts', Bot)}
        {navBtn('account', 'Profile & Account', User)}
      </div>

      {/* Main Panel */}
      <div className="flex-1 overflow-y-auto p-6 md:p-10 max-w-3xl space-y-6">

        {/* ── APPEARANCE ── */}
        {activeTab === 'appearance' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-[#111b21] dark:text-[#f8fafc] mb-1">Theme</h3>
              <p className="text-xs text-[#5e5e5e] dark:text-[#94a3b8] mb-4">
                Choose between system theme, light sunlit cream, or dark obsidian slate.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {([
                  { value: 'system', label: 'System Theme', sub: 'Default: auto adapts to your OS', Icon: Monitor },
                  { value: 'light', label: 'Light Canvas', sub: 'Sunlit warm off-white backdrop', Icon: Sun },
                  { value: 'dark', label: 'Dark Theme', sub: 'Obsidian night slate with orange', Icon: Moon },
                ] as const).map(({ value, label, sub, Icon }) => (
                  <button
                    key={value}
                    onClick={() => updateSetting('theme', value)}
                    className={`p-4 rounded-[25px] border text-left transition-all ${
                      settings.theme === value
                        ? 'bg-[#ffffff] dark:bg-[#141923] border-[#ff6b00] shadow-md ring-2 ring-[#ff6b00]/30'
                        : 'bg-[#ffffff] dark:bg-[#141923] border-[#f0f4f9] dark:border-[#1e2638] hover:bg-[#f0f4f9] dark:hover:bg-[#1e2638]'
                    }`}
                  >
                    <Icon className="w-5 h-5 text-[#ff6b00] mb-2" />
                    <div className="text-sm font-bold text-[#111b21] dark:text-[#f8fafc]">{label}</div>
                    <div className="text-[11px] text-[#5e5e5e] dark:text-[#94a3b8] mt-1">{sub}</div>
                  </button>
                ))}
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

        {/* ── CHAT ── */}
        {activeTab === 'chat' && (
          <div className="space-y-4">
            {[
              { key: 'enter_to_send' as const, label: 'Press Enter to Send', sub: 'Enter key will send your message immediately.' },
              { key: 'read_receipts' as const, label: 'Read Receipts', sub: 'Show double checkmarks when messages are read.' },
            ].map(({ key, label, sub }) => (
              <div key={key} className="p-4 bg-[#ffffff] dark:bg-[#141923] border border-[#f0f4f9] dark:border-[#1e2638] rounded-[25px] shadow-sm flex items-center justify-between transition-colors">
                <div>
                  <div className="text-sm font-bold text-[#111b21] dark:text-[#f8fafc]">{label}</div>
                  <div className="text-xs text-[#5e5e5e] dark:text-[#94a3b8]">{sub}</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings[key] as boolean}
                  onChange={(e) => updateSetting(key, e.target.checked)}
                  className="w-5 h-5 rounded accent-[#ff6b00] cursor-pointer"
                />
              </div>
            ))}
          </div>
        )}

        {/* ── PRIVACY ── */}
        {activeTab === 'privacy' && (
          <div className="space-y-4">
            {[
              { key: 'last_seen_visibility' as const, label: 'Last Seen & Online', sub: 'Control who sees when you are active.' },
              { key: 'profile_photo_visibility' as const, label: 'Profile Photo Visibility', sub: 'Control who sees your avatar.' },
            ].map(({ key, label, sub }) => (
              <div key={key} className="p-4 bg-[#ffffff] dark:bg-[#141923] border border-[#f0f4f9] dark:border-[#1e2638] rounded-[25px] shadow-sm flex items-center justify-between transition-colors">
                <div>
                  <div className="text-sm font-bold text-[#111b21] dark:text-[#f8fafc]">{label}</div>
                  <div className="text-xs text-[#5e5e5e] dark:text-[#94a3b8]">{sub}</div>
                </div>
                <select
                  value={settings[key] as string}
                  onChange={(e) => updateSetting(key, e.target.value as any)}
                  className="px-4 py-2 bg-[#f0f4f9] dark:bg-[#1e2638] text-xs text-[#111b21] dark:text-[#f8fafc] rounded-[50px] border border-transparent"
                >
                  <option value="everyone">Everyone</option>
                  <option value="contacts">My Contacts</option>
                  <option value="nobody">Nobody</option>
                </select>
              </div>
            ))}
          </div>
        )}

        {/* ── NOTIFICATIONS ── */}
        {activeTab === 'notifications' && (
          <div className="space-y-4">
            {[
              { key: 'sound_notifications' as const, label: 'Message Sounds', sub: 'Play chimes for incoming and outgoing messages.' },
              { key: 'call_ringtone' as const, label: 'Call Ringtone', sub: 'Play melodic synthesized ringtone on calls.' },
            ].map(({ key, label, sub }) => (
              <div key={key} className="p-4 bg-[#ffffff] dark:bg-[#141923] border border-[#f0f4f9] dark:border-[#1e2638] rounded-[25px] shadow-sm flex items-center justify-between transition-colors">
                <div>
                  <div className="text-sm font-bold text-[#111b21] dark:text-[#f8fafc]">{label}</div>
                  <div className="text-xs text-[#5e5e5e] dark:text-[#94a3b8]">{sub}</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings[key] as boolean}
                  onChange={(e) => updateSetting(key, e.target.checked)}
                  className="w-5 h-5 rounded accent-[#ff6b00] cursor-pointer"
                />
              </div>
            ))}
          </div>
        )}

        {/* ── AI & CONTACTS ── */}
        {activeTab === 'ai' && (
          <div className="space-y-6">

            {/* AI Replies */}
            <div>
              <h3 className="text-xl font-bold text-[#111b21] dark:text-[#f8fafc] mb-1">AI-Powered Demo Contacts</h3>
              <p className="text-xs text-[#5e5e5e] dark:text-[#94a3b8] mb-4">
                Add your free Gemini API key so Alex, Elena, Marcus, Sophia and Liam respond intelligently
                to anything you say — in character, as themselves.
              </p>

              <div className="p-5 bg-[#ffffff] dark:bg-[#141923] border border-[#f0f4f9] dark:border-[#1e2638] rounded-[25px] space-y-4">
                {aiService.hasApiKey() && (
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle className="w-4 h-4" />
                    Gemini API key active — AI replies enabled ✨
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-[#111b21] dark:text-[#f8fafc] mb-1.5">
                    Gemini API Key
                  </label>
                  <div className="relative">
                    <input
                      type={showKey ? 'text' : 'password'}
                      value={geminiKey}
                      onChange={(e) => setGeminiKey(e.target.value)}
                      placeholder="AIzaSy..."
                      className="w-full pl-4 pr-12 py-2.5 bg-[#f0f4f9] dark:bg-[#1e2638] text-sm text-[#111b21] dark:text-[#f8fafc] rounded-[50px] border border-transparent focus:outline-none focus:border-[#ff6b00] font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#5e5e5e] dark:text-[#94a3b8]"
                    >
                      {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-[#5e5e5e] dark:text-[#94a3b8] mt-1.5 pl-1">
                    Get your free key at{' '}
                    <a
                      href="https://aistudio.google.com/apikey"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#ff6b00] underline"
                    >
                      aistudio.google.com/apikey
                    </a>
                    . Your key is stored only in your browser — never sent to any server.
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleSaveGeminiKey}
                    className="px-5 py-2 bg-[#ff6b00] hover:bg-[#e65c00] text-white text-xs font-bold rounded-[50px] shadow-sm transition-all"
                  >
                    Save API Key
                  </button>
                  {aiService.hasApiKey() && (
                    <button
                      onClick={handleClearKey}
                      className="px-5 py-2 bg-[#f0f4f9] dark:bg-[#1e2638] hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 text-xs font-bold rounded-[50px] transition-all"
                    >
                      Remove Key
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* How to chat with real people */}
            <div>
              <h3 className="text-xl font-bold text-[#111b21] dark:text-[#f8fafc] mb-1">Chat With Real People</h3>
              <p className="text-xs text-[#5e5e5e] dark:text-[#94a3b8] mb-4">
                Chattr uses peer-to-peer WebRTC — no phone numbers needed. Anyone with the link can join and you can chat directly.
              </p>

              <div className="p-5 bg-[#ffffff] dark:bg-[#141923] border border-[#f0f4f9] dark:border-[#1e2638] rounded-[25px] space-y-4">
                <div className="text-xs text-[#111b21] dark:text-[#f8fafc] space-y-2">
                  <p className="font-bold">How to chat and call with friends:</p>
                  <ol className="list-decimal pl-4 space-y-1.5 text-[#5e5e5e] dark:text-[#94a3b8] leading-relaxed">
                    <li>Copy your Chattr link below and send it to your friend.</li>
                    <li>Have your friend open the website and enter their <span className="font-semibold text-[#ff6b00]">Phone Number</span> or Username.</li>
                    <li>Go to <span className="font-semibold text-[#ff6b00]">Contacts → + Add Contact</span>, type their Phone Number or Username, and tap Add!</li>
                    <li>You can now chat in real-time, send voice notes, and make crystal-clear peer-to-peer voice & video calls!</li>
                  </ol>
                </div>

                <div className="flex items-center gap-2 p-3 bg-[#f0f4f9] dark:bg-[#1e2638] rounded-2xl text-xs font-mono text-[#5e5e5e] dark:text-[#94a3b8] break-all">
                  <Link className="w-4 h-4 text-[#ff6b00] flex-shrink-0" />
                  <span className="flex-1">{window.location.origin}</span>
                  <button
                    onClick={handleCopyInviteLink}
                    className="p-1.5 hover:text-[#ff6b00] transition-colors flex-shrink-0"
                    title="Copy link"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="p-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900 rounded-2xl text-xs text-orange-900 dark:text-orange-200">
                  <p className="font-bold mb-1 flex items-center gap-1.5">
                    📞 Real Peer Calling & Chatting
                  </p>
                  <p className="leading-relaxed">
                    Chattr uses encrypted WebRTC peer technology so you can call and chat with real people globally using their phone numbers or usernames — with zero carrier charges, no SIM card restrictions, and ultra HD audio!
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── ACCOUNT ── */}
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
                  <label className="block text-xs font-bold text-[#111b21] dark:text-[#f8fafc] mb-1">Display Name</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#f0f4f9] dark:bg-[#1e2638] text-sm text-[#111b21] dark:text-[#f8fafc] rounded-[50px] border border-transparent focus:outline-none focus:border-[#ff6b00]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#111b21] dark:text-[#f8fafc] mb-1">Username</label>
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
                <label className="block text-xs font-bold text-[#111b21] dark:text-[#f8fafc] mb-1">About</label>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#f0f4f9] dark:bg-[#1e2638] text-xs text-[#111b21] dark:text-[#f8fafc] rounded-2xl border border-transparent focus:outline-none focus:border-[#ff6b00] resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111b21] dark:text-[#f8fafc] mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-4 py-2.5 bg-[#f0f4f9] dark:bg-[#1e2638] text-sm text-[#111b21] dark:text-[#f8fafc] rounded-[50px] border border-transparent focus:outline-none focus:border-[#ff6b00]"
                />
                <p className="text-[11px] text-[#5e5e5e] dark:text-[#94a3b8] mt-1 pl-1">
                  Your phone number shows on your profile for contacts to identify you.
                </p>
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
