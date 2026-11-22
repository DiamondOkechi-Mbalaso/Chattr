import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { UserProfile, Contact, Conversation, Message } from '../types';

// Read from env or localStorage (allows configuration directly in UI or via Vercel env vars)
export const getSupabaseConfig = () => {
  if (typeof window === 'undefined') {
    return {
      url: import.meta.env.VITE_SUPABASE_URL || '',
      anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
    };
  }
  const url =
    localStorage.getItem('chattr_supabase_url') ||
    import.meta.env.VITE_SUPABASE_URL ||
    '';
  const anonKey =
    localStorage.getItem('chattr_supabase_anon_key') ||
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    '';
  return { url: url.trim(), anonKey: anonKey.trim() };
};

export const setSupabaseConfig = (url: string, anonKey: string) => {
  localStorage.setItem('chattr_supabase_url', url.trim());
  localStorage.setItem('chattr_supabase_anon_key', anonKey.trim());
};

export const clearSupabaseConfig = () => {
  localStorage.removeItem('chattr_supabase_url');
  localStorage.removeItem('chattr_supabase_anon_key');
};

const config = getSupabaseConfig();

export const isSupabaseConfigured = Boolean(
  config.url && config.anonKey && !config.url.includes('placeholder')
);

export let supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(config.url, config.anonKey)
  : null;

export const reinitSupabase = () => {
  const current = getSupabaseConfig();
  if (current.url && current.anonKey && !current.url.includes('placeholder')) {
    supabase = createClient(current.url, current.anonKey);
    return true;
  } else {
    supabase = null;
    return false;
  }
};

/**
 * PostgreSQL Database Sync Service
 */
export class PostgresService {
  /** Test connection to PostgreSQL */
  public async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!supabase) {
      return { success: false, message: 'PostgreSQL credentials are not configured.' };
    }
    try {
      const { error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
      if (error) {
        return { success: false, message: error.message };
      }
      return { success: true, message: 'Connected to PostgreSQL database!' };
    } catch (e: any) {
      return { success: false, message: e.message || 'Connection failed' };
    }
  }

  /** Sync message to PostgreSQL */
  public async saveMessage(msg: Message): Promise<boolean> {
    if (!supabase) return false;
    try {
      const { error } = await supabase.from('messages').upsert({
        id: msg.id,
        conversation_id: msg.conversation_id,
        sender_id: msg.sender_id,
        content: msg.content,
        type: msg.type,
        is_pinned: msg.is_pinned,
        is_starred: msg.is_starred,
        is_edited: msg.is_edited,
        is_deleted: msg.is_deleted,
        status: msg.status,
        created_at: msg.created_at,
      });
      return !error;
    } catch {
      return false;
    }
  }

  /** Sync profile / user to PostgreSQL */
  public async saveUser(user: UserProfile): Promise<boolean> {
    if (!supabase) return false;
    try {
      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        username: user.username,
        display_name: user.display_name,
        email: user.email,
        phone: user.phone || null,
        avatar_url: user.avatar_url,
        bio: user.bio,
        status_text: user.status_text,
        status: user.status,
        is_online: user.is_online,
        last_seen: user.last_seen,
      });
      return !error;
    } catch {
      return false;
    }
  }

  /** Sync contact to PostgreSQL */
  public async saveContact(contact: Contact): Promise<boolean> {
    if (!supabase) return false;
    try {
      const { error } = await supabase.from('contacts').upsert({
        id: contact.id,
        user_id: contact.user_id,
        contact_id: contact.contact_id,
        nickname: contact.nickname || null,
        category: contact.category,
        is_favorite: contact.is_favorite,
        is_blocked: contact.is_blocked,
        created_at: contact.created_at,
      });
      return !error;
    } catch {
      return false;
    }
  }

  /** Fetch messages for a conversation from PostgreSQL */
  public async fetchMessages(conversationId: string): Promise<Message[] | null> {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error || !data) return null;

      return data.map((d: any) => ({
        id: d.id,
        conversation_id: d.conversation_id,
        sender_id: d.sender_id,
        content: d.content || '',
        type: d.type || 'text',
        reactions: [],
        is_pinned: d.is_pinned || false,
        is_starred: d.is_starred || false,
        is_edited: d.is_edited || false,
        is_deleted: d.is_deleted || false,
        status: d.status || 'read',
        created_at: d.created_at,
      }));
    } catch {
      return null;
    }
  }

  /** Subscribe to live PostgreSQL message insertions */
  public subscribeToRealtimeMessages(
    onNewMessage: (msg: any) => void
  ): (() => void) | null {
    if (!supabase) return null;
    try {
      const channel = supabase
        .channel('public:messages')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages' },
          (payload) => {
            onNewMessage(payload.new);
          }
        )
        .subscribe();

      return () => {
        supabase?.removeChannel(channel);
      };
    } catch {
      return null;
    }
  }
}

export const postgresService = new PostgresService();
