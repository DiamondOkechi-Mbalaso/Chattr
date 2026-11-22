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
  Database,
  Server,
  ExternalLink,
  Code,
  Check,
} from 'lucide-react';
import { UserSettings, ThemeMode } from '../../types';
import { storage } from '../../services/storage';
import { aiService } from '../../services/aiService';
import { peerService } from '../../services/peerService';
import {
  getSupabaseConfig,
  setSupabaseConfig,
  clearSupabaseConfig,
  isSupabaseConfigured,
  postgresService,
  reinitSupabase,
} from '../../services/supabase';
import { useToast } from '../common/Toast';
import { Avatar } from '../common/Avatar';

export const SettingsView: React.FC = () => {
  const [settings, setSettings] = useState<UserSettings>(storage.getSettings());
  const [activeTab, setActiveTab] = useState<
    'appearance' | 'chat' | 'privacy' | 'notifications' | 'account' | 'ai' | 'database'
  >('appearance');

  const current = storage.getCurrentUser();
  const [displayName, setDisplayName] = useState(current.display_name);
  const [username, setUsername] = useState(current.username);
  const [bio, setBio] = useState(current.bio);
  const [avatarUrl, setAvatarUrl] = useState(current.avatar_url);
  const [phone, setPhone] = useState(current.phone || '');
  const [geminiKey, setGeminiKey] = useState(localStorage.getItem('chattr_gemini_api_key') || '');
  const [showKey, setShowKey] = useState(false);

  // PostgreSQL settings state
  const initialDbConfig = getSupabaseConfig();
  const [supabaseUrl, setSupabaseUrl] = useState(initialDbConfig.url);
  const [supabaseKey, setSupabaseKey] = useState(initialDbConfig.anonKey);
  const [showDbKey, setShowDbKey] = useState(false);
  const [isDbTesting, setIsDbTesting] = useState(false);
  const [isPostgresConnected, setIsPostgresConnected] = useState(isSupabaseConfigured);
  const [copiedSchema, setCopiedSchema] = useState(false);

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

  const handleSavePostgres = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabaseUrl.trim() || !supabaseKey.trim()) {
      toast.error('Please enter both Project URL and Anon Public Key');
      return;
    }

    setSupabaseConfig(supabaseUrl, supabaseKey);
    const reinitOk = reinitSupabase();
    if (!reinitOk) {
      toast.error('Invalid Supabase configuration');
      return;
    }

    setIsDbTesting(true);
    const result = await postgresService.testConnection();
    setIsDbTesting(false);

    if (result.success) {
      setIsPostgresConnected(true);
      toast.success('Connected to PostgreSQL database! 🚀');
    } else {
      setIsPostgresConnected(false);
      toast.error(`Connection check: ${result.message}`);
    }
  };

  const handleDisconnectPostgres = () => {
    clearSupabaseConfig();
    reinitSupabase();
    setSupabaseUrl('');
    setSupabaseKey('');
    setIsPostgresConnected(false);
    toast.success('PostgreSQL disconnected. Reverted to Local Storage mode.');
  };

  const handleCopySchema = () => {
    const schemaSql = `-- CHATTR POSTGRESQL SCHEMA
create table if not exists public.profiles (
  id text primary key default gen_random_uuid()::text,
  username text unique not null,
  display_name text not null,
  email text not null,
  phone text,
  avatar_url text,
  bio text default '',
  status text default 'online',
  is_online boolean default true,
  last_seen timestamptz default now(),
  created_at timestamptz default now()
);

create table if not exists public.contacts (
  id text primary key default gen_random_uuid()::text,
  user_id text references public.profiles(id) on delete cascade not null,
  contact_id text references public.profiles(id) on delete cascade not null,
  nickname text,
  category text default 'General',
  is_favorite boolean default false,
  is_blocked boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.messages (
  id text primary key default gen_random_uuid()::text,
  conversation_id text not null,
  sender_id text references public.profiles(id) on delete set null not null,
  content text default '',
  type text default 'text' not null,
  status text default 'sent',
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;
alter table public.contacts enable row level security;
alter table public.messages enable row level security;

create policy "Allow all profiles" on public.profiles for all using (true) with check (true);
create policy "Allow all contacts" on public.contacts for all using (true) with check (true);
create policy "Allow all messages" on public.messages for all using (true) with check (true);`;

    navigator.clipboard.writeText(schemaSql);
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 2500);
    toast.success('PostgreSQL SQL Schema copied! Paste it into your Supabase SQL Editor 📋');
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
      <div className="w-full md:w-64 bg-[#ffffff] dark:bg-[#141923] border-r border-[#f0f4f9] dark:border-[#1e2638] p-4 space-y-1 transition-colors flex-shrink-0">
        <h2 className="text-xl font-bold text-[#111b21] dark:text-[#f8fafc] px-3 mb-4">Settings</h2>
        {navBtn('appearance', 'Appearance & Theme', Palette)}
        {navBtn('chat', 'Chats & Media', MessageSquare)}
        {navBtn('database', 'PostgreSQL Database', Database)}
        {navBtn('ai', 'AI & Contacts', Bot)}
        {navBtn('privacy', 'Privacy', Shield)}
        {navBtn('notifications', 'Notifications', Bell)}
        {navBtn('account', 'Profile & Account', User)}
      </div>

      {/* Main Panel */}
      <div className="flex-1 overflow-y-auto p-6 md:p-10 max-w-3xl space-y-6">
        {/* ── POSTGRESQL DATABASE ── */}
        {activeTab === 'database' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-[#111b21] dark:text-[#f8fafc] flex items-center gap-2">
                <Database className="w-5 h-5 text-[#ff6b00]" /> PostgreSQL Cloud Database
              </h3>
              <p className="text-xs text-[#5e5e5e] dark:text-[#94a3b8] mt-1">
                Store and synchronize your Chattr messages, contacts, and user accounts in a persistent PostgreSQL database.
              </p>
            </div>

            {/* Status Banner */}
            <div
              className={`p-4 rounded-2xl border flex items-center justify-between ${
                isPostgresConnected
                  ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                  : 'bg-amber-50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <Server className="w-5 h-5 flex-shrink-0" />
                <div>
                  <p className="font-bold text-xs">
                    {isPostgresConnected
                      ? '🟢 Connected to PostgreSQL (Supabase)'
                      : '🟡 Local Storage Mode (Ready for PostgreSQL)'}
                  </p>
                  <p className="text-[11px] opacity-90 mt-0.5">
                    {isPostgresConnected
                      ? 'Messages, user accounts, and contacts are saving to PostgreSQL.'
                      : 'Data is currently saved on this device. Connect PostgreSQL below to sync across all devices.'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCopySchema}
                className="px-3.5 py-1.5 bg-[#ffffff] dark:bg-[#141923] text-xs font-bold rounded-[50px] border shadow-sm hover:scale-105 transition-all flex items-center gap-1.5 flex-shrink-0 ml-3"
              >
                {copiedSchema ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-[#ff6b00]" />}
                {copiedSchema ? 'Copied!' : 'Copy SQL Schema'}
              </button>
            </div>

            {/* Configuration Form */}
            <form onSubmit={handleSavePostgres} className="p-5 bg-[#ffffff] dark:bg-[#141923] border border-[#f0f4f9] dark:border-[#1e2638] rounded-[25px] space-y-4">
              <h4 className="font-bold text-xs text-[#111b21] dark:text-[#f8fafc]">PostgreSQL Connection Settings</h4>

              <div>
                <label className="block text-xs font-bold text-[#111b21] dark:text-[#f8fafc] mb-1.5">
                  PostgreSQL / Supabase Project URL
                </label>
                <input
                  type="url"
                  placeholder="https://xyzcompany.supabase.co"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#f0f4f9] dark:bg-[#1e2638] text-xs text-[#111b21] dark:text-[#f8fafc] font-mono rounded-[50px] border border-transparent focus:outline-none focus:border-[#ff6b00]"
                  required
                />
                <p className="text-[11px] text-[#5e5e5e] dark:text-[#94a3b8] mt-1 pl-1">
                  Found in your Supabase dashboard under <strong>Project Settings → API → Project URL</strong>.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111b21] dark:text-[#f8fafc] mb-1.5">
                  Anon / Public API Key
                </label>
                <div className="relative">
                  <input
                    type={showDbKey ? 'text' : 'password'}
                    placeholder="eyJhbGciOi..."
                    value={supabaseKey}
                    onChange={(e) => setSupabaseKey(e.target.value)}
                    className="w-full pl-4 pr-10 py-2.5 bg-[#f0f4f9] dark:bg-[#1e2638] text-xs text-[#111b21] dark:text-[#f8fafc] font-mono rounded-[50px] border border-transparent focus:outline-none focus:border-[#ff6b00]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowDbKey(!showDbKey)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#5e5e5e] dark:text-[#94a3b8] hover:text-[#ff6b00]"
                  >
                    {showDbKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-[#5e5e5e] dark:text-[#94a3b8] mt-1 pl-1">
                  Your <code>anon public</code> key. Safe to use in web clients with PostgreSQL Row-Level Security.
                </p>
              </div>

              <div className="flex items-center justify-between pt-2">
                {isPostgresConnected ? (
                  <button
                    type="button"
                    onClick={handleDisconnectPostgres}
                    className="px-4 py-2 text-xs font-semibold text-rose-500 hover:text-rose-600 transition-colors"
                  >
                    Disconnect & Revert to Local
                  </button>
                ) : (
                  <span />
                )}
                <button
                  type="submit"
                  disabled={isDbTesting}
                  className="px-6 py-2.5 bg-[#ff6b00] hover:bg-[#e65c00] text-white rounded-[50px] text-xs font-bold shadow-sm shadow-orange-500/25 transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                >
                  {isDbTesting ? 'Testing Connection...' : 'Connect to PostgreSQL 🚀'}
                </button>
              </div>
            </form>

            {/* Step by Step Setup Guide */}
            <div className="p-5 bg-[#ffffff] dark:bg-[#141923] border border-[#f0f4f9] dark:border-[#1e2638] rounded-[25px] space-y-3">
              <h4 className="font-bold text-xs text-[#111b21] dark:text-[#f8fafc] flex items-center gap-1.5">
                <Code className="w-4 h-4 text-[#ff6b00]" /> 1-Minute PostgreSQL Setup Guide
              </h4>
              <ol className="list-decimal pl-5 space-y-1.5 text-xs text-[#5e5e5e] dark:text-[#94a3b8] leading-relaxed">
                <li>
                  Open{' '}
                  <a
                    href="https://supabase.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#ff6b00] font-semibold underline inline-flex items-center gap-0.5"
                  >
                    supabase.com <ExternalLink className="w-3 h-3" />
                  </a>{' '}
                  and click <strong>New Project</strong> (100% free hosted PostgreSQL).
                </li>
                <li>In your Supabase project dashboard, open the <strong>SQL Editor</strong> tab on the left.</li>
                <li>
                  Click the <strong>"Copy SQL Schema"</strong> button above, paste the SQL query, and click <strong>Run</strong>.
                </li>
                <li>
                  Go to <strong>Project Settings → API</strong>, copy your <strong>Project URL</strong> and <strong>anon public key</strong>, and paste them in the form above!
                </li>
              </ol>
            </div>
          </div>
        )}

        {/* ── APPEARANCE & THEME ── */}
        {activeTab === 'appearance' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-[#111b21] dark:text-[#f8fafc]">Appearance</h3>
              <p className="text-xs text-[#5e5e5e] dark:text-[#94a3b8] mt-1">
                Customize how Chattr looks on your screen.
              </p>
            </div>

            <div className="p-5 bg-[#ffffff] dark:bg-[#141923] border border-[#f0f4f9] dark:border-[#1e2638] rounded-[25px] space-y-4">
              <label className="block text-xs font-bold text-[#111b21] dark:text-[#f8fafc]">Theme Mode</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { mode: 'system' as ThemeMode, label: 'System (Default)', icon: Monitor },
                  { mode: 'light' as ThemeMode, label: 'Light', icon: Sun },
                  { mode: 'dark' as ThemeMode, label: 'Dark', icon: Moon },
                ].map(({ mode, label, icon: Icon }) => (
                  <button
                    key={mode}
                    onClick={() => updateSetting('theme', mode)}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border text-xs font-semibold transition-all ${
                      settings.theme === mode
                        ? 'border-[#ff6b00] bg-[#ffe6d4] dark:bg-[#7c2d12] text-[#ff6b00] dark:text-[#ff9500] shadow-sm'
                        : 'border-[#f0f4f9] dark:border-[#1e2638] bg-[#f0f4f9]/50 dark:bg-[#1e2638]/50 text-[#5e5e5e] dark:text-[#94a3b8] hover:border-[#ff6b00]/50'
                    }`}
                  >
                    <Icon className="w-5 h-5 mb-2" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-5 bg-[#ffffff] dark:bg-[#141923] border border-[#f0f4f9] dark:border-[#1e2638] rounded-[25px] space-y-4">
              <label className="block text-xs font-bold text-[#111b21] dark:text-[#f8fafc]">Font Size</label>
              <div className="grid grid-cols-3 gap-3">
                {(['small', 'medium', 'large'] as const).map((size) => (
                  <button
                    key={size}
                    onClick={() => updateSetting('font_size', size)}
                    className={`p-3 rounded-[50px] border text-xs font-semibold capitalize transition-all ${
                      settings.font_size === size
                        ? 'border-[#ff6b00] bg-[#ffe6d4] dark:bg-[#7c2d12] text-[#ff6b00] dark:text-[#ff9500]'
                        : 'border-[#f0f4f9] dark:border-[#1e2638] text-[#5e5e5e] dark:text-[#94a3b8]'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── CHATS & MEDIA ── */}
        {activeTab === 'chat' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-[#111b21] dark:text-[#f8fafc]">Chats & Media</h3>
              <p className="text-xs text-[#5e5e5e] dark:text-[#94a3b8] mt-1">Control chat behavior and input options.</p>
            </div>

            <div className="p-5 bg-[#ffffff] dark:bg-[#141923] border border-[#f0f4f9] dark:border-[#1e2638] rounded-[25px] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-[#111b21] dark:text-[#f8fafc]">Enter is Send</p>
                  <p className="text-[11px] text-[#5e5e5e] dark:text-[#94a3b8]">Press Enter to send, Shift+Enter for new line.</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.enter_to_send}
                  onChange={(e) => updateSetting('enter_to_send', e.target.checked)}
                  className="w-4 h-4 accent-[#ff6b00] rounded"
                />
              </div>

              <div className="border-t border-[#f0f4f9] dark:border-[#1e2638] pt-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-[#111b21] dark:text-[#f8fafc]">Read Receipts</p>
                  <p className="text-[11px] text-[#5e5e5e] dark:text-[#94a3b8]">Show two blue checkmarks when messages are read.</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.read_receipts}
                  onChange={(e) => updateSetting('read_receipts', e.target.checked)}
                  className="w-4 h-4 accent-[#ff6b00] rounded"
                />
              </div>
            </div>
          </div>
        )}

        {/* ── PRIVACY ── */}
        {activeTab === 'privacy' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-[#111b21] dark:text-[#f8fafc]">Privacy</h3>
              <p className="text-xs text-[#5e5e5e] dark:text-[#94a3b8] mt-1">Manage who can see your activity.</p>
            </div>

            <div className="p-5 bg-[#ffffff] dark:bg-[#141923] border border-[#f0f4f9] dark:border-[#1e2638] rounded-[25px] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-[#111b21] dark:text-[#f8fafc]">Last Seen Visibility</p>
                  <p className="text-[11px] text-[#5e5e5e] dark:text-[#94a3b8]">Who can see when you were last online.</p>
                </div>
                <select
                  value={settings.last_seen_visibility}
                  onChange={(e) => updateSetting('last_seen_visibility', e.target.value as any)}
                  className="bg-[#f0f4f9] dark:bg-[#1e2638] text-xs font-semibold px-3 py-1.5 rounded-[50px] border-none text-[#111b21] dark:text-[#f8fafc]"
                >
                  <option value="everyone">Everyone</option>
                  <option value="contacts">My Contacts</option>
                  <option value="nobody">Nobody</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* ── NOTIFICATIONS ── */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-[#111b21] dark:text-[#f8fafc]">Notifications</h3>
              <p className="text-xs text-[#5e5e5e] dark:text-[#94a3b8] mt-1">Configure audio and visual alerts.</p>
            </div>

            <div className="p-5 bg-[#ffffff] dark:bg-[#141923] border border-[#f0f4f9] dark:border-[#1e2638] rounded-[25px] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-[#111b21] dark:text-[#f8fafc]">Sound Effects</p>
                  <p className="text-[11px] text-[#5e5e5e] dark:text-[#94a3b8]">Play tones when messages are sent or received.</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.sound_notifications}
                  onChange={(e) => updateSetting('sound_notifications', e.target.checked)}
                  className="w-4 h-4 accent-[#ff6b00] rounded"
                />
              </div>
            </div>
          </div>
        )}

        {/* ── AI & CONTACTS ── */}
        {activeTab === 'ai' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-[#111b21] dark:text-[#f8fafc] flex items-center gap-2">
                <Bot className="w-5 h-5 text-[#ff6b00]" /> AI Responses & Contacts
              </h3>
              <p className="text-xs text-[#5e5e5e] dark:text-[#94a3b8] mt-1">
                Configure Google Gemini AI for demo contacts, or connect with real people.
              </p>
            </div>

            <div className="p-5 bg-[#ffffff] dark:bg-[#141923] border border-[#f0f4f9] dark:border-[#1e2638] rounded-[25px] space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold text-[#111b21] dark:text-[#f8fafc]">Google Gemini API Key</p>
                  <p className="text-[11px] text-[#5e5e5e] dark:text-[#94a3b8] mt-0.5">
                    Enables intelligent real-time conversational responses from all demo contacts using Gemini 2.0 Flash.
                  </p>
                </div>
                {aiService.hasApiKey() && (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full">
                    <CheckCircle className="w-3.5 h-3.5" /> AI Active
                  </span>
                )}
              </div>

              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  placeholder="Paste your Gemini API key (AIzaSy...)"
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  className="w-full pl-4 pr-10 py-2.5 bg-[#f0f4f9] dark:bg-[#1e2638] text-xs text-[#111b21] dark:text-[#f8fafc] font-mono rounded-[50px] border border-transparent focus:outline-none focus:border-[#ff6b00]"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#5e5e5e] dark:text-[#94a3b8] hover:text-[#ff6b00]"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex items-center justify-between pt-1">
                <a
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-[#ff6b00] hover:underline font-semibold"
                >
                  Get free key at aistudio.google.com →
                </a>

                <div className="flex gap-2">
                  {geminiKey && (
                    <button
                      type="button"
                      onClick={handleClearKey}
                      className="px-4 py-2 text-xs font-semibold text-rose-500 hover:text-rose-600 transition-colors"
                    >
                      Remove Key
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleSaveGeminiKey}
                    className="px-5 py-2 bg-[#ff6b00] hover:bg-[#e65c00] text-white rounded-[50px] text-xs font-bold shadow-sm shadow-orange-500/25 transition-all"
                  >
                    Save API Key
                  </button>
                </div>
              </div>
            </div>

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
