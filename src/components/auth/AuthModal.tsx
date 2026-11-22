import React, { useState } from 'react';
import { Mail, Lock, User, Phone } from 'lucide-react';
import { UserProfile } from '../../types';
import { Modal } from '../common/Modal';
import { storage } from '../../services/storage';
import { useToast } from '../common/Toast';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticated: (user: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthenticated,
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const toast = useToast();

  const allUsers = storage.getUsers();

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === 'login') {
      const searchClean = email.trim().toLowerCase();
      const searchDigits = email.replace(/[^0-9]/g, '');

      const existing = allUsers.find(
        (u) =>
          u.email.toLowerCase() === searchClean ||
          u.username.toLowerCase() === searchClean ||
          (searchDigits.length >= 4 && u.phone && u.phone.replace(/[^0-9]/g, '') === searchDigits)
      );

      if (existing) {
        storage.setCurrentUser(existing.id);
        onAuthenticated(existing);
        toast.success(`Welcome back, ${existing.display_name}!`);
        onClose();
      } else {
        const isPhone = searchDigits.length >= 4 && !email.includes('@');
        const newUser: UserProfile = {
          id: 'user_' + Date.now(),
          username: isPhone ? `phone_${searchDigits}` : email.split('@')[0].toLowerCase(),
          display_name: isPhone ? email.trim() : email.split('@')[0],
          email: isPhone ? `${searchDigits}@chattr.net` : email.trim(),
          phone: isPhone ? email.trim() : undefined,
          avatar_url: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80`,
          bio: 'Hey there! I am using Chattr.',
          status_text: 'Available',
          status: 'online',
          is_online: true,
          last_seen: new Date().toISOString(),
          created_at: new Date().toISOString(),
        };
        storage.saveUser(newUser);
        storage.setCurrentUser(newUser.id);
        onAuthenticated(newUser);
        toast.success(`Logged in as ${newUser.display_name}`);
        onClose();
      }
    } else if (mode === 'register') {
      if (!username || !displayName) {
        toast.error('Please fill in all registration fields');
        return;
      }
      const newUser: UserProfile = {
        id: 'user_' + Date.now(),
        username: username.trim().toLowerCase(),
        display_name: displayName.trim(),
        email: email.trim() || `${username.trim().toLowerCase()}@chattr.net`,
        phone: phone.trim() || undefined,
        avatar_url: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80`,
        bio: 'Hey there! I am using Chattr.',
        status_text: 'Available ☕',
        status: 'online',
        is_online: true,
        last_seen: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };
      storage.saveUser(newUser);
      storage.setCurrentUser(newUser.id);
      onAuthenticated(newUser);
      toast.success(`Account created! Welcome, ${newUser.display_name}`);
      onClose();
    } else {
      toast.success('Password reset link sent to ' + email);
      setMode('login');
    }
  };

  const handleQuickLogin = (u: UserProfile) => {
    storage.setCurrentUser(u.id);
    onAuthenticated(u);
    toast.success(`Logged in as ${u.display_name}`);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="sm">
      <div className="text-center mb-6">
        <div className="w-14 h-14 rounded-2xl mx-auto mb-3 shadow-md overflow-hidden p-0.5 bg-gradient-to-tr from-[#ff6b00] to-[#ff9500] ring-2 ring-[#ff6b00]/30">
          <img src="/logo.png" alt="Chattr" className="w-full h-full object-cover rounded-xl" />
        </div>
        <h2 className="text-xl font-bold text-[#111b21] dark:text-[#f8fafc]">
          {mode === 'login'
            ? 'Sign in to Chattr'
            : mode === 'register'
            ? 'Create Chattr account'
            : 'Reset password'}
        </h2>
        <p className="text-xs text-[#5e5e5e] dark:text-[#94a3b8] mt-1">
          Simple. Reliable. Private.
        </p>
      </div>

      <form onSubmit={handleAuth} className="space-y-3.5">
        {mode === 'register' && (
          <>
            <div>
              <label className="block text-xs font-bold text-[#111b21] dark:text-[#f8fafc] mb-1">
                Display Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5e5e5e] dark:text-[#94a3b8]" />
                <input
                  type="text"
                  placeholder="e.g. Alex Rivera"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#f0f4f9] dark:bg-[#1e2638] text-xs text-[#111b21] dark:text-[#f8fafc] rounded-[50px] border border-transparent focus:outline-none focus:border-[#ff6b00]"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#111b21] dark:text-[#f8fafc] mb-1">
                Username
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5e5e5e] dark:text-[#94a3b8] text-xs">
                  @
                </span>
                <input
                  type="text"
                  placeholder="e.g. alex"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 bg-[#f0f4f9] dark:bg-[#1e2638] text-xs text-[#111b21] dark:text-[#f8fafc] rounded-[50px] border border-transparent focus:outline-none focus:border-[#ff6b00]"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#111b21] dark:text-[#f8fafc] mb-1">
                Phone Number <span className="font-normal text-[#5e5e5e] dark:text-[#94a3b8]">(Optional - for direct calls)</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5e5e5e] dark:text-[#94a3b8]" />
                <input
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#f0f4f9] dark:bg-[#1e2638] text-xs text-[#111b21] dark:text-[#f8fafc] rounded-[50px] border border-transparent focus:outline-none focus:border-[#ff6b00]"
                />
              </div>
            </div>
          </>
        )}

        <div>
          <label className="block text-xs font-bold text-[#111b21] dark:text-[#f8fafc] mb-1">
            {mode === 'login' ? 'Phone Number, Username, or Email' : 'Email'}
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5e5e5e] dark:text-[#94a3b8]" />
            <input
              type="text"
              placeholder={mode === 'login' ? '+1 (555) 000-0000 or username' : 'name@chattr.app'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#f0f4f9] dark:bg-[#1e2638] text-xs text-[#111b21] dark:text-[#f8fafc] rounded-[50px] border border-transparent focus:outline-none focus:border-[#ff6b00]"
              required
            />
          </div>
        </div>

        {mode !== 'forgot' && (
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-[#111b21] dark:text-[#f8fafc]">Password</label>
              {mode === 'login' && (
                <button
                  type="button"
                  onClick={() => setMode('forgot')}
                  className="text-[11px] text-[#ff6b00] hover:underline"
                >
                  Forgot?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5e5e5e] dark:text-[#94a3b8]" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#f0f4f9] dark:bg-[#1e2638] text-xs text-[#111b21] dark:text-[#f8fafc] rounded-[50px] border border-transparent focus:outline-none focus:border-[#ff6b00]"
                required
              />
            </div>
          </div>
        )}

        <button
          type="submit"
          className="w-full py-2.5 bg-[#ff6b00] hover:bg-[#e65c00] text-white rounded-[50px] text-xs font-bold shadow-sm shadow-orange-500/25 transition-all transform hover:scale-[1.01] active:scale-95 mt-2"
        >
          {mode === 'login' ? 'Continue' : mode === 'register' ? 'Agree & Continue' : 'Send Link'}
        </button>

        <div className="text-center pt-2 text-xs text-[#5e5e5e] dark:text-[#94a3b8]">
          {mode === 'login' ? (
            <>
              New to Chattr?{' '}
              <button
                type="button"
                onClick={() => setMode('register')}
                className="text-[#ff6b00] font-bold hover:underline"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-[#ff6b00] font-bold hover:underline"
              >
                Sign in
              </button>
            </>
          )}
        </div>
      </form>

      {/* Quick Test Accounts */}
      <div className="border-t border-[#f0f4f9] dark:border-[#1e2638] mt-5 pt-4">
        <p className="text-[11px] font-bold text-[#5e5e5e] dark:text-[#94a3b8] text-center uppercase tracking-wider mb-2.5">
          Or Quick Test Account
        </p>
        <div className="grid grid-cols-2 gap-2">
          {allUsers.slice(0, 4).map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => handleQuickLogin(u)}
              className="flex items-center gap-2 p-2 bg-[#fcf5eb] dark:bg-[#0c0f14] hover:bg-[#ffe6d4] dark:hover:bg-[#7c2d12] rounded-[25px] text-left border border-[#f0f4f9] dark:border-[#1e2638] transition-colors"
            >
              <img src={u.avatar_url} alt="" className="w-6 h-6 rounded-full object-cover" />
              <div className="truncate">
                <div className="text-[11px] font-bold text-[#111b21] dark:text-[#f8fafc] truncate">
                  {u.display_name.split(' ')[0]}
                </div>
                <div className="text-[9px] text-[#5e5e5e] dark:text-[#94a3b8]">@{u.username}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
};
