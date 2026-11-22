import React, { useState } from 'react';
import {
  UserPlus,
  Search,
  MessageSquare,
  Phone,
  Video,
  Star,
  Trash2,
  Users,
  Smartphone,
  AtSign,
  User,
  Share2,
} from 'lucide-react';
import { Contact, UserProfile } from '../../types';
import { Avatar } from '../common/Avatar';
import { Modal } from '../common/Modal';
import { storage } from '../../services/storage';
import { webrtc } from '../../services/webrtc';
import { useToast } from '../common/Toast';

interface ContactsViewProps {
  onStartChat: (userId: string) => void;
  onOpenProfile: (user: UserProfile) => void;
}

export const ContactsView: React.FC<ContactsViewProps> = ({
  onStartChat,
  onOpenProfile,
}) => {
  const [contacts, setContacts] = useState<Contact[]>(storage.getContacts());
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Add Contact Form States
  const [addMode, setAddMode] = useState<'phone' | 'username'>('phone');
  const [newPhone, setNewPhone] = useState('');
  const [newName, setNewName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newCategory, setNewCategory] = useState<'Friends' | 'Work' | 'Family' | 'Favorites' | 'General'>('Friends');

  const toast = useToast();
  const allUsers = storage.getUsers();
  const current = storage.getCurrentUser();

  const categories = ['All', 'Favorites', 'Friends', 'Work', 'Family', 'General'];

  const filtered = contacts.filter((c) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = c.contact.display_name.toLowerCase().includes(q);
      const matchUser = c.contact.username.toLowerCase().includes(q);
      const matchNick = c.nickname?.toLowerCase().includes(q);
      const matchPhone = c.contact.phone?.toLowerCase().includes(q);
      if (!matchName && !matchUser && !matchNick && !matchPhone) return false;
    }
    if (activeCategory === 'Favorites') return c.is_favorite;
    if (activeCategory !== 'All') return c.category === activeCategory;
    return true;
  });

  const handleToggleFavorite = (contactId: string) => {
    const updated = contacts.map((c) =>
      c.id === contactId ? { ...c, is_favorite: !c.is_favorite } : c
    );
    setContacts(updated);
    storage.saveContacts(updated);
    toast.success('Contact updated');
  };

  const handleDelete = (contactId: string) => {
    storage.deleteContact(contactId);
    setContacts(storage.getContacts());
    toast.success('Contact removed');
  };

  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault();

    if (addMode === 'phone') {
      const phoneClean = newPhone.trim();
      const digits = phoneClean.replace(/[^0-9]/g, '');

      if (!digits || digits.length < 4) {
        toast.error('Please enter a valid phone number (at least 4 digits)');
        return;
      }

      // Check if trying to add own phone
      if (current.phone && current.phone.replace(/[^0-9]/g, '') === digits) {
        toast.error('You cannot add your own phone number');
        return;
      }

      // Check if contact already exists by phone
      if (
        contacts.some(
          (c) => c.contact.phone && c.contact.phone.replace(/[^0-9]/g, '') === digits
        )
      ) {
        toast.error(`Phone number ${phoneClean} is already in your contacts`);
        return;
      }

      // Find if any known user has this phone number
      const foundUser = allUsers.find(
        (u) => u.phone && u.phone.replace(/[^0-9]/g, '') === digits
      );

      let targetUser = foundUser;
      if (!targetUser) {
        const contactName = newName.trim() || `Contact ${phoneClean}`;
        targetUser = {
          id: 'user_p_' + digits,
          username: 'p_' + digits,
          display_name: contactName,
          phone: phoneClean,
          email: `${digits}@chattr.net`,
          avatar_url: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80`,
          bio: 'Chattr phone contact',
          status_text: 'Available on Chattr',
          status: 'online',
          is_online: true,
          last_seen: new Date().toISOString(),
          created_at: new Date().toISOString(),
        };
        storage.upsertExternalUser(targetUser);
      }

      storage.addContact(targetUser, newCategory);
      setContacts(storage.getContacts());
      setNewPhone('');
      setNewName('');
      setIsAddModalOpen(false);
      toast.success(`Added ${targetUser.display_name} (${phoneClean}) to contacts!`);
    } else {
      // Username mode
      const usernameClean = newUsername.trim().toLowerCase().replace('@', '');
      if (!usernameClean) {
        toast.error('Please enter a username');
        return;
      }

      if (usernameClean === current.username.toLowerCase()) {
        toast.error('You cannot add yourself');
        return;
      }

      const foundUser = allUsers.find(
        (u) => u.username.toLowerCase() === usernameClean
      );

      let targetUser = foundUser;
      if (!targetUser) {
        targetUser = {
          id: 'user_' + usernameClean,
          username: usernameClean,
          display_name: usernameClean.charAt(0).toUpperCase() + usernameClean.slice(1),
          email: `${usernameClean}@chattr.net`,
          avatar_url: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80`,
          bio: 'Hey there! I am using Chattr.',
          status_text: 'Available',
          status: 'online',
          is_online: true,
          last_seen: new Date().toISOString(),
          created_at: new Date().toISOString(),
        };
        storage.upsertExternalUser(targetUser);
      }

      if (
        contacts.some(
          (c) =>
            c.contact_id === targetUser!.id ||
            c.contact.username.toLowerCase() === usernameClean
        )
      ) {
        toast.error(`@${usernameClean} is already in your contacts`);
        return;
      }

      storage.addContact(targetUser, newCategory);
      setContacts(storage.getContacts());
      setNewUsername('');
      setIsAddModalOpen(false);
      toast.success(`Added @${targetUser.username} to contacts!`);
    }
  };

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(window.location.origin);
    toast.success('Chattr link copied! Share it so friends can join and call you 🔗');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#fcf5eb] dark:bg-[#0c0f14] overflow-hidden select-none transition-colors">
      {/* Header — Chattr Navigation bar */}
      <div className="h-16 px-6 flex items-center justify-between border-b border-[#f0f4f9] dark:border-[#1e2638] bg-[#ffffff] dark:bg-[#141923] transition-colors">
        <div>
          <h2 className="text-xl font-bold text-[#111b21] dark:text-[#f8fafc]">Contacts</h2>
          <p className="text-xs text-[#5e5e5e] dark:text-[#94a3b8]">
            {contacts.length} connections • Chat & Call real people
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyInvite}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 bg-[#ffe6d4] dark:bg-[#7c2d12] hover:bg-[#ff6b00] text-[#ff6b00] dark:text-[#ffedd5] hover:text-white rounded-[50px] text-xs font-bold transition-all"
            title="Invite friends"
          >
            <Share2 className="w-3.5 h-3.5" /> Invite Friends
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#ff6b00] hover:bg-[#e65c00] text-white rounded-[50px] text-sm font-bold shadow-sm shadow-orange-500/25 transition-all transform hover:scale-105 active:scale-95"
          >
            <UserPlus className="w-4 h-4" /> Add Contact
          </button>
        </div>
      </div>

      {/* Search & Category Pills */}
      <div className="p-4 md:px-6 border-b border-[#f0f4f9] dark:border-[#1e2638] bg-[#ffffff]/60 dark:bg-[#141923]/60 flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5e5e5e] dark:text-[#94a3b8]" />
          <input
            type="text"
            placeholder="Search by name, phone number, or username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#f0f4f9] dark:bg-[#1e2638] text-xs text-[#111b21] dark:text-[#f8fafc] rounded-[50px] border border-transparent focus:outline-none focus:border-[#ff6b00] transition-colors placeholder-[#5e5e5e] dark:placeholder-[#94a3b8]"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-[50px] text-xs font-semibold whitespace-nowrap transition-colors ${
                activeCategory === cat
                  ? 'bg-[#ff6b00] text-white shadow-sm'
                  : 'bg-[#ffffff] dark:bg-[#141923] text-[#1c1e21] dark:text-[#e2e8f0] border border-[#f0f4f9] dark:border-[#1e2638] hover:bg-[#f0f4f9] dark:hover:bg-[#1e2638]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Contacts Grid */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 auto-rows-max">
        {filtered.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center h-64 text-center text-[#5e5e5e] dark:text-[#94a3b8]">
            <Users className="w-10 h-10 text-[#5e5e5e] dark:text-[#94a3b8] mb-3" />
            <p className="text-base font-bold text-[#111b21] dark:text-[#f8fafc]">No contacts found</p>
            <p className="text-xs text-[#5e5e5e] dark:text-[#94a3b8] mt-1 max-w-sm">
              Add someone by their phone number or username to chat and call in real-time.
            </p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="mt-4 px-5 py-2 bg-[#ff6b00] hover:bg-[#e65c00] text-white rounded-[50px] text-xs font-bold transition-all"
            >
              + Add First Contact
            </button>
          </div>
        ) : (
          filtered.map((c) => (
            <div
              key={c.id}
              className="p-4 bg-[#ffffff] dark:bg-[#141923] border border-[#f0f4f9] dark:border-[#1e2638] rounded-[25px] shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className="flex items-center gap-3.5 cursor-pointer min-w-0"
                  onClick={() => onOpenProfile(c.contact)}
                >
                  <Avatar
                    src={c.contact.avatar_url}
                    name={c.contact.display_name}
                    size="lg"
                    status={c.contact.status}
                    showStatus
                  />
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm text-[#111b21] dark:text-[#f8fafc] hover:text-[#ff6b00] dark:hover:text-[#ff9500] transition-colors truncate">
                      {c.contact.display_name}
                    </h3>
                    <p className="text-xs text-[#5e5e5e] dark:text-[#94a3b8] truncate">
                      @{c.contact.username}
                    </p>
                    {c.contact.phone && (
                      <p className="text-[11px] text-[#ff6b00] dark:text-[#ff9500] font-medium flex items-center gap-1 mt-0.5 truncate">
                        <Smartphone className="w-3 h-3 flex-shrink-0" /> {c.contact.phone}
                      </p>
                    )}
                    <span className="inline-block px-2 py-0.5 mt-1 rounded-[50px] bg-[#f0f4f9] dark:bg-[#1e2638] text-[10px] font-medium text-[#111b21] dark:text-[#f8fafc]">
                      {c.category}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleToggleFavorite(c.id)}
                  className={`p-1.5 rounded-full transition-colors ${
                    c.is_favorite
                      ? 'text-amber-500'
                      : 'text-[#5e5e5e] dark:text-[#94a3b8] hover:text-[#111b21] dark:hover:text-[#f8fafc]'
                  }`}
                  title={c.is_favorite ? 'Favorited' : 'Favorite'}
                >
                  <Star className={`w-4 h-4 ${c.is_favorite ? 'fill-current' : ''}`} />
                </button>
              </div>

              {c.contact.bio && (
                <p className="text-xs text-[#5e5e5e] dark:text-[#94a3b8] line-clamp-2 mb-3.5 leading-relaxed">
                  "{c.contact.bio}"
                </p>
              )}

              {/* Action buttons with 50px pill radius */}
              <div className="flex items-center gap-2 pt-3 border-t border-[#f0f4f9] dark:border-[#1e2638]">
                <button
                  onClick={() => onStartChat(c.contact_id)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-[#ffe6d4] dark:bg-[#7c2d12] hover:bg-[#ff6b00] dark:hover:bg-[#ff6b00] text-[#ff6b00] dark:text-[#ffedd5] hover:text-white dark:hover:text-white rounded-[50px] text-xs font-bold transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5" /> Message
                </button>
                <button
                  onClick={() => webrtc.startCall(c.contact, 'voice')}
                  className="p-2 text-[#1c1e21] dark:text-[#e2e8f0] hover:bg-[#f0f4f9] dark:hover:bg-[#1e2638] rounded-[50px] transition-colors"
                  title="Voice call"
                >
                  <Phone className="w-4 h-4" />
                </button>
                <button
                  onClick={() => webrtc.startCall(c.contact, 'video')}
                  className="p-2 text-[#1c1e21] dark:text-[#e2e8f0] hover:bg-[#f0f4f9] dark:hover:bg-[#1e2638] rounded-[50px] transition-colors"
                  title="Video call"
                >
                  <Video className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(c.id)}
                  className="p-2 text-[#5e5e5e] dark:text-[#94a3b8] hover:text-rose-600 rounded-[50px] transition-colors"
                  title="Remove"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Contact Modal — Phone Number & Username Support */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Contact"
      >
        <form onSubmit={handleAddContact} className="space-y-4">
          {/* Mode Switcher: Phone Number vs Username */}
          <div className="flex bg-[#f0f4f9] dark:bg-[#1e2638] p-1 rounded-[50px]">
            <button
              type="button"
              onClick={() => setAddMode('phone')}
              className={`flex-1 py-2 rounded-[50px] text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                addMode === 'phone'
                  ? 'bg-[#ff6b00] text-white shadow-sm'
                  : 'text-[#5e5e5e] dark:text-[#94a3b8] hover:text-[#111b21] dark:hover:text-[#f8fafc]'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" /> Phone Number
            </button>
            <button
              type="button"
              onClick={() => setAddMode('username')}
              className={`flex-1 py-2 rounded-[50px] text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                addMode === 'username'
                  ? 'bg-[#ff6b00] text-white shadow-sm'
                  : 'text-[#5e5e5e] dark:text-[#94a3b8] hover:text-[#111b21] dark:hover:text-[#f8fafc]'
              }`}
            >
              <AtSign className="w-3.5 h-3.5" /> Username
            </button>
          </div>

          {addMode === 'phone' ? (
            <>
              <div>
                <label className="block text-xs font-bold text-[#111b21] dark:text-[#f8fafc] mb-1.5">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5e5e5e] dark:text-[#94a3b8]" />
                  <input
                    type="tel"
                    placeholder="e.g. +1 (555) 234-5678 or 0712345678"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#f0f4f9] dark:bg-[#1e2638] text-sm text-[#111b21] dark:text-[#f8fafc] rounded-[50px] border border-transparent focus:outline-none focus:border-[#ff6b00]"
                    autoFocus
                    required
                  />
                </div>
                <p className="text-[11px] text-[#5e5e5e] dark:text-[#94a3b8] mt-1 pl-1">
                  Enter any friend's phone number to connect and call them for free.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111b21] dark:text-[#f8fafc] mb-1.5">
                  Contact Name <span className="font-normal text-[#5e5e5e] dark:text-[#94a3b8]">(Optional)</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5e5e5e] dark:text-[#94a3b8]" />
                  <input
                    type="text"
                    placeholder="e.g. Sarah Miller"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#f0f4f9] dark:bg-[#1e2638] text-sm text-[#111b21] dark:text-[#f8fafc] rounded-[50px] border border-transparent focus:outline-none focus:border-[#ff6b00]"
                  />
                </div>
              </div>
            </>
          ) : (
            <div>
              <label className="block text-xs font-bold text-[#111b21] dark:text-[#f8fafc] mb-1.5">
                Username
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5e5e5e] dark:text-[#94a3b8] text-sm">
                  @
                </span>
                <input
                  type="text"
                  placeholder="e.g. elena_v, marcus_c, sophia_art"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 bg-[#f0f4f9] dark:bg-[#1e2638] text-sm text-[#111b21] dark:text-[#f8fafc] rounded-[50px] border border-transparent focus:outline-none focus:border-[#ff6b00]"
                  autoFocus
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#111b21] dark:text-[#f8fafc] mb-1.5">
              Category
            </label>
            <div className="flex flex-wrap gap-1.5">
              {(['Friends', 'Work', 'Family', 'General'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setNewCategory(cat)}
                  className={`px-3 py-1 rounded-[50px] text-xs font-medium transition-colors ${
                    newCategory === cat
                      ? 'bg-[#ff6b00] text-white'
                      : 'bg-[#f0f4f9] dark:bg-[#1e2638] text-[#111b21] dark:text-[#f8fafc] hover:bg-[#ffe6d4]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Suggestions */}
          <div className="p-3.5 bg-[#fcf5eb] dark:bg-[#0c0f14] rounded-2xl border border-[#f0f4f9] dark:border-[#1e2638] text-xs text-[#5e5e5e] dark:text-[#94a3b8] space-y-1.5">
            <span className="font-bold text-[#111b21] dark:text-[#f8fafc]">
              Quick Demo Contacts:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {allUsers
                .filter((u) => u.id !== current.id)
                .map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => {
                      if (addMode === 'phone' && u.phone) {
                        setNewPhone(u.phone);
                        setNewName(u.display_name);
                      } else {
                        setNewUsername(u.username);
                      }
                    }}
                    className="px-3 py-1 bg-[#ffffff] dark:bg-[#141923] hover:bg-[#ffe6d4] dark:hover:bg-[#7c2d12] text-[#111b21] dark:text-[#f8fafc] rounded-[50px] text-xs font-medium border border-[#f0f4f9] dark:border-[#1e2638] transition-colors"
                  >
                    {u.display_name} {u.phone ? `(${u.phone})` : `@${u.username}`}
                  </button>
                ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-[#5e5e5e] dark:text-[#94a3b8] hover:text-[#111b21] dark:hover:text-[#f8fafc]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#ff6b00] hover:bg-[#e65c00] text-white rounded-[50px] text-xs font-bold shadow-sm shadow-orange-500/25 transition-all"
            >
              Add Contact
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
