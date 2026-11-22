import {
  UserProfile,
  Contact,
  Conversation,
  Message,
  StatusUpdate,
  CallHistoryRecord,
  NotificationItem,
  UserSettings,
} from '../types';
import {
  DEMO_USERS,
  INITIAL_CONTACTS,
  INITIAL_CONVERSATIONS,
  INITIAL_MESSAGES,
  INITIAL_STATUS_UPDATES,
  INITIAL_CALL_HISTORY,
} from './mockData';
import { sounds } from '../utils/sound';
import { peerService } from './peerService';

const STORAGE_KEYS = {
  CURRENT_USER_ID: 'chattr_current_user_id',
  USERS: 'chattr_users',
  CONTACTS: 'chattr_contacts',
  CONVERSATIONS: 'chattr_conversations',
  MESSAGES: 'chattr_messages',
  STATUSES: 'chattr_statuses',
  CALL_HISTORY: 'chattr_call_history',
  NOTIFICATIONS: 'chattr_notifications',
  SETTINGS: 'chattr_settings',
};

export const DEFAULT_SETTINGS: UserSettings = {
  theme: 'system', // Default is system theme as requested!
  accent_color: '#ff6b00', // Chattr vibrant orange matching the logo
  font_size: 'medium',
  density: 'comfortable',
  bubble_style: 'modern',
  enter_to_send: true,
  read_receipts: true,
  last_seen_visibility: 'everyone',
  online_status_visibility: 'everyone',
  profile_photo_visibility: 'everyone',
  bio_visibility: 'everyone',
  sound_notifications: true,
  desktop_notifications: false,
  call_ringtone: true,
  mute_all: false,
  custom_wallpaper: '',
  disappearing_default: 0,
  reduced_motion: false,
  high_contrast: false,
};

// Cross-tab real-time communication channel
export interface SyncEvent {
  type:
    | 'NEW_MESSAGE'
    | 'UPDATE_MESSAGE'
    | 'DELETE_MESSAGE'
    | 'MESSAGE_REACTION'
    | 'TYPING_START'
    | 'TYPING_STOP'
    | 'CALL_OFFER'
    | 'CALL_ANSWER'
    | 'CALL_ICE'
    | 'CALL_END'
    | 'STATUS_NEW'
    | 'STATUS_VIEWED'
    | 'USER_STATUS';
  sender_id: string;
  payload: any;
}

type SyncListener = (event: SyncEvent) => void;

class StorageService {
  private channel: BroadcastChannel | null = null;
  private syncListeners: Set<SyncListener> = new Set();
  private mediaQueryListenerAttached = false;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        this.channel = new BroadcastChannel('chattr_sync');
        this.channel.onmessage = (ev) => {
          this.syncListeners.forEach((fn) => fn(ev.data));
        };
      } catch (e) {
        console.warn('BroadcastChannel not supported in this environment');
      }
    }
  }

  public subscribeToSync(listener: SyncListener) {
    this.syncListeners.add(listener);
    return () => {
      this.syncListeners.delete(listener);
    };
  }

  public broadcast(event: SyncEvent) {
    if (this.channel) {
      try {
        this.channel.postMessage(event);
      } catch (e) {}
    }
  }

  // Current User
  getCurrentUser(): UserProfile {
    if (typeof window === 'undefined') return DEMO_USERS[0];
    const uid = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID) || DEMO_USERS[0].id;
    const users = this.getUsers();
    return users.find((u) => u.id === uid) || DEMO_USERS[0];
  }

  setCurrentUser(userId: string) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, userId);
    this.broadcast({
      type: 'USER_STATUS',
      sender_id: userId,
      payload: { is_online: true, last_seen: new Date().toISOString() },
    });
  }

  // Users
  getUsers(): UserProfile[] {
    if (typeof window === 'undefined') return DEMO_USERS;
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEMO_USERS));
      return DEMO_USERS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return DEMO_USERS;
    }
  }

  saveUser(user: UserProfile) {
    const users = this.getUsers();
    const idx = users.findIndex((u) => u.id === user.id);
    if (idx >= 0) {
      users[idx] = user;
    } else {
      users.push(user);
    }
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }

  // Contacts
  getContacts(): Contact[] {
    if (typeof window === 'undefined') return INITIAL_CONTACTS;
    const raw = localStorage.getItem(STORAGE_KEYS.CONTACTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.CONTACTS, JSON.stringify(INITIAL_CONTACTS));
      return INITIAL_CONTACTS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_CONTACTS;
    }
  }

  addContact(contactUser: UserProfile, category: Contact['category'] = 'General'): Contact {
    const contacts = this.getContacts();
    const current = this.getCurrentUser();
    const newContact: Contact = {
      id: 'c_' + Date.now(),
      user_id: current.id,
      contact_id: contactUser.id,
      contact: contactUser,
      category,
      is_favorite: false,
      is_blocked: false,
      created_at: new Date().toISOString(),
    };
    contacts.push(newContact);
    localStorage.setItem(STORAGE_KEYS.CONTACTS, JSON.stringify(contacts));
    return newContact;
  }

  deleteContact(contactId: string) {
    const contacts = this.getContacts().filter((c) => c.id !== contactId);
    localStorage.setItem(STORAGE_KEYS.CONTACTS, JSON.stringify(contacts));
  }

  toggleBlockContact(contactId: string): boolean {
    const contacts = this.getContacts();
    const c = contacts.find((item) => item.id === contactId);
    if (c) {
      c.is_blocked = !c.is_blocked;
      localStorage.setItem(STORAGE_KEYS.CONTACTS, JSON.stringify(contacts));
      return c.is_blocked;
    }
    return false;
  }

  saveContacts(contacts: Contact[]) {
    localStorage.setItem(STORAGE_KEYS.CONTACTS, JSON.stringify(contacts));
  }

  // Conversations
  getConversations(): Conversation[] {
    if (typeof window === 'undefined') return INITIAL_CONVERSATIONS;
    const raw = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(INITIAL_CONVERSATIONS));
      return INITIAL_CONVERSATIONS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_CONVERSATIONS;
    }
  }

  saveConversations(conversations: Conversation[]) {
    localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(conversations));
  }

  createConversation(conv: Partial<Conversation>): Conversation {
    const list = this.getConversations();
    const current = this.getCurrentUser();
    const newConv: Conversation = {
      id: conv.id || 'conv_' + Date.now(),
      type: conv.type || 'direct',
      name: conv.name || 'New Chat',
      avatar_url: conv.avatar_url,
      description: conv.description || '',
      created_by: current.id,
      participants: conv.participants || [current],
      admins: conv.admins || [current.id],
      unread_count: 0,
      is_pinned: false,
      is_muted: false,
      is_archived: false,
      disappearing_seconds: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...conv,
    };
    list.unshift(newConv);
    this.saveConversations(list);
    return newConv;
  }

  // Messages
  getAllMessages(): Record<string, Message[]> {
    if (typeof window === 'undefined') return INITIAL_MESSAGES;
    const raw = localStorage.getItem(STORAGE_KEYS.MESSAGES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(INITIAL_MESSAGES));
      return INITIAL_MESSAGES;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_MESSAGES;
    }
  }

  getMessages(conversationId: string): Message[] {
    const all = this.getAllMessages();
    return all[conversationId] || [];
  }

  saveMessages(conversationId: string, messages: Message[]) {
    const all = this.getAllMessages();
    all[conversationId] = messages;
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(all));
  }

  upsertExternalUser(user: UserProfile) {
    const users = this.getUsers();
    const idx = users.findIndex((u) => u.username.toLowerCase() === user.username.toLowerCase());
    if (idx >= 0) {
      users[idx] = { ...users[idx], ...user };
    } else {
      users.push(user);
    }
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }

  receiveRemoteMessage(message: Message, senderUser: UserProfile) {
    this.upsertExternalUser(senderUser);
    const current = this.getCurrentUser();
    let convs = this.getConversations();
    let conv = convs.find(
      (c) =>
        c.type === 'direct' &&
        c.participants.some(
          (p) => p.username.toLowerCase() === senderUser.username.toLowerCase()
        )
    );

    if (!conv) {
      conv = this.createConversation({
        type: 'direct',
        name: senderUser.display_name,
        avatar_url: senderUser.avatar_url,
        participants: [current, senderUser],
      });
      convs = this.getConversations();
    }

    const messageToSave: Message = {
      ...message,
      conversation_id: conv.id,
      sender: senderUser,
    };

    const messages = this.getMessages(conv.id);
    if (!messages.some((m) => m.id === message.id)) {
      messages.push(messageToSave);
      this.saveMessages(conv.id, messages);

      conv.last_message = messageToSave;
      conv.unread_count = (conv.unread_count || 0) + 1;
      conv.updated_at = messageToSave.created_at;

      const filtered = convs.filter((item) => item.id !== conv!.id);
      filtered.unshift(conv);
      this.saveConversations(filtered);

      sounds.playReceived();

      this.broadcast({
        type: 'NEW_MESSAGE',
        sender_id: senderUser.id,
        payload: { conversation_id: conv.id, message: messageToSave },
      });
    }
  }

  sendMessage(
    conversationId: string,
    content: string,
    type: Message['type'] = 'text',
    attachments?: Message['attachments'],
    reply_to?: Message['reply_to']
  ): Message {
    const current = this.getCurrentUser();
    const newMessage: Message = {
      id: 'm_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      conversation_id: conversationId,
      sender_id: current.id,
      sender: current,
      content,
      type,
      attachments,
      reply_to,
      reactions: [],
      is_pinned: false,
      is_starred: false,
      is_edited: false,
      is_deleted: false,
      status: 'sent',
      created_at: new Date().toISOString(),
    };

    const messages = this.getMessages(conversationId);
    messages.push(newMessage);
    this.saveMessages(conversationId, messages);

    const convs = this.getConversations();
    const c = convs.find((conv) => conv.id === conversationId);
    if (c) {
      c.last_message = newMessage;
      c.updated_at = newMessage.created_at;
      const filtered = convs.filter((item) => item.id !== conversationId);
      filtered.unshift(c);
      this.saveConversations(filtered);
    }

    sounds.playSent();

    this.broadcast({
      type: 'NEW_MESSAGE',
      sender_id: current.id,
      payload: { conversation_id: conversationId, message: newMessage },
    });

    // Send to peer across the network
    const activeConv = this.getConversations().find((item) => item.id === conversationId);
    if (activeConv && activeConv.type === 'direct') {
      const otherUser = activeConv.participants.find((p) => p.id !== current.id);
      if (otherUser && otherUser.username) {
        peerService.sendMessageToUser(otherUser.username, newMessage);
      }
    }

    this.triggerSimulatedResponse(conversationId, content, current.id);

    return newMessage;
  }

  private triggerSimulatedResponse(conversationId: string, userMessage: string, senderId: string) {
    const conv = this.getConversations().find((c) => c.id === conversationId);
    if (!conv || conv.type !== 'direct') return;

    const otherUser = conv.participants.find((p) => p.id !== senderId);
    if (!otherUser) return;

    setTimeout(() => {
      this.broadcast({
        type: 'TYPING_START',
        sender_id: otherUser.id,
        payload: { conversation_id: conversationId, user: otherUser },
      });
    }, 800);

    setTimeout(() => {
      this.broadcast({
        type: 'TYPING_STOP',
        sender_id: otherUser.id,
        payload: { conversation_id: conversationId, user: otherUser },
      });

      const replyPool = [
        `Sounds awesome! Really loving the new Chattr orange vibe. 🔥`,
        `Checked it out — Chattr feels so smooth and instant! 🚀`,
        `Nice! Let me know if you want to jump on a quick voice or video call on Chattr. 📞`,
        `Got it! The glowing logo looks incredible too. ✨`,
        `Message received loud and clear on Chattr! 😊`,
      ];
      const randomReply = replyPool[Math.floor(Math.random() * replyPool.length)];

      const botMessage: Message = {
        id: 'm_' + Date.now() + '_bot',
        conversation_id: conversationId,
        sender_id: otherUser.id,
        sender: otherUser,
        content: randomReply,
        type: 'text',
        reactions: [],
        is_pinned: false,
        is_starred: false,
        is_edited: false,
        is_deleted: false,
        status: 'read',
        created_at: new Date().toISOString(),
      };

      const msgs = this.getMessages(conversationId);
      msgs.push(botMessage);
      this.saveMessages(conversationId, msgs);

      const convs = this.getConversations();
      const c = convs.find((item) => item.id === conversationId);
      if (c) {
        c.last_message = botMessage;
        c.updated_at = botMessage.created_at;
        this.saveConversations(convs);
      }

      sounds.playReceived();

      this.broadcast({
        type: 'NEW_MESSAGE',
        sender_id: otherUser.id,
        payload: { conversation_id: conversationId, message: botMessage },
      });
    }, 2400);
  }

  // Reactions
  toggleReaction(conversationId: string, messageId: string, emoji: string) {
    const current = this.getCurrentUser();
    const messages = this.getMessages(conversationId);
    const msg = messages.find((m) => m.id === messageId);
    if (!msg) return;

    let reaction = msg.reactions.find((r) => r.emoji === emoji);
    if (!reaction) {
      reaction = { emoji, count: 0, users: [] };
      msg.reactions.push(reaction);
    }

    const userIdx = reaction.users.findIndex((u) => u.id === current.id);
    if (userIdx >= 0) {
      reaction.users.splice(userIdx, 1);
      reaction.count--;
      if (reaction.count <= 0) {
        msg.reactions = msg.reactions.filter((r) => r.emoji !== emoji);
      }
    } else {
      reaction.users.push({ id: current.id, display_name: current.display_name });
      reaction.count++;
      sounds.playReaction();
    }

    this.saveMessages(conversationId, messages);

    this.broadcast({
      type: 'MESSAGE_REACTION',
      sender_id: current.id,
      payload: { conversation_id: conversationId, messageId, emoji },
    });
  }

  // Status Updates / Stories
  getStatuses(): StatusUpdate[] {
    if (typeof window === 'undefined') return INITIAL_STATUS_UPDATES;
    const raw = localStorage.getItem(STORAGE_KEYS.STATUSES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.STATUSES, JSON.stringify(INITIAL_STATUS_UPDATES));
      return INITIAL_STATUS_UPDATES;
    }
    try {
      const list: StatusUpdate[] = JSON.parse(raw);
      const now = Date.now();
      return list.filter((s) => new Date(s.expires_at).getTime() > now);
    } catch {
      return INITIAL_STATUS_UPDATES;
    }
  }

  addStatus(status: Omit<StatusUpdate, 'id' | 'created_at' | 'expires_at' | 'viewers'>): StatusUpdate {
    const list = this.getStatuses();
    const newStatus: StatusUpdate = {
      ...status,
      id: 'st_' + Date.now(),
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      viewers: [],
    };
    list.unshift(newStatus);
    localStorage.setItem(STORAGE_KEYS.STATUSES, JSON.stringify(list));
    this.broadcast({
      type: 'STATUS_NEW',
      sender_id: status.user_id,
      payload: newStatus,
    });
    return newStatus;
  }

  recordStatusView(statusId: string) {
    const list = this.getStatuses();
    const current = this.getCurrentUser();
    const st = list.find((s) => s.id === statusId);
    if (st && !st.viewers.some((v) => v.user.id === current.id)) {
      st.viewers.push({
        user: current,
        viewed_at: new Date().toISOString(),
      });
      localStorage.setItem(STORAGE_KEYS.STATUSES, JSON.stringify(list));
    }
  }

  saveStatuses(statuses: StatusUpdate[]) {
    localStorage.setItem(STORAGE_KEYS.STATUSES, JSON.stringify(statuses));
  }

  // Call History
  getCallHistory(): CallHistoryRecord[] {
    if (typeof window === 'undefined') return INITIAL_CALL_HISTORY;
    const raw = localStorage.getItem(STORAGE_KEYS.CALL_HISTORY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.CALL_HISTORY, JSON.stringify(INITIAL_CALL_HISTORY));
      return INITIAL_CALL_HISTORY;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_CALL_HISTORY;
    }
  }

  clearCallHistory() {
    localStorage.setItem(STORAGE_KEYS.CALL_HISTORY, JSON.stringify([]));
  }

  addCallHistory(call: Omit<CallHistoryRecord, 'id'>) {
    const list = this.getCallHistory();
    const record: CallHistoryRecord = {
      ...call,
      id: 'ch_' + Date.now(),
    };
    list.unshift(record);
    localStorage.setItem(STORAGE_KEYS.CALL_HISTORY, JSON.stringify(list));
  }

  // Settings
  getSettings(): UserSettings {
    if (typeof window === 'undefined') return DEFAULT_SETTINGS;
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    try {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  saveSettings(settings: Partial<UserSettings>): UserSettings {
    const current = this.getSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    this.applySettingsToDOM(updated);
    return updated;
  }

  applySettingsToDOM(settings: UserSettings) {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;

    const applyTheme = (isDark: boolean) => {
      if (isDark) {
        root.classList.add('theme-dark', 'dark');
      } else {
        root.classList.remove('theme-dark', 'dark');
      }
    };

    if (settings.theme === 'system') {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      applyTheme(prefersDark);

      // Listen for OS system theme changes
      if (!this.mediaQueryListenerAttached && window.matchMedia) {
        this.mediaQueryListenerAttached = true;
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
          const currentSettings = this.getSettings();
          if (currentSettings.theme === 'system') {
            applyTheme(e.matches);
          }
        });
      }
    } else if (settings.theme === 'dark' || settings.theme === 'amoled') {
      applyTheme(true);
    } else {
      applyTheme(false);
    }

    // Font size
    if (settings.font_size === 'small') {
      root.style.fontSize = '14px';
    } else if (settings.font_size === 'large') {
      root.style.fontSize = '18px';
    } else {
      root.style.fontSize = '16px';
    }
  }
}

export const storage = new StorageService();
