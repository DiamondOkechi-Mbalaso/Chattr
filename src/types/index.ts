export type UserStatus = 'online' | 'busy' | 'away' | 'offline';

export interface UserProfile {
  id: string;
  username: string;
  display_name: string;
  email: string;
  avatar_url: string;
  bio: string;
  status_text: string;
  status: UserStatus;
  is_online: boolean;
  last_seen: string;
  created_at: string;
  banner_url?: string;
  phone?: string;
}

export interface Contact {
  id: string;
  user_id: string;
  contact_id: string;
  contact: UserProfile;
  nickname?: string;
  category: 'Friends' | 'Work' | 'Family' | 'Favorites' | 'General';
  is_favorite: boolean;
  is_blocked: boolean;
  created_at: string;
}

export type ConversationType = 'direct' | 'group' | 'saved';

export interface Conversation {
  id: string;
  type: ConversationType;
  name: string;
  avatar_url?: string;
  description?: string;
  created_by: string;
  participants: UserProfile[];
  admins?: string[]; // user IDs with admin privileges in group
  last_message?: Message;
  unread_count: number;
  is_pinned: boolean;
  is_muted: boolean;
  is_archived: boolean;
  wallpaper?: string;
  accent_theme?: string;
  disappearing_seconds?: number; // 0 for off, or e.g. 86400 (24h)
  created_at: string;
  updated_at: string;
}

export type MessageType = 'text' | 'image' | 'video' | 'audio' | 'voice_note' | 'file' | 'system';
export type MessageDeliveryStatus = 'sending' | 'sent' | 'delivered' | 'read';

export interface MessageReaction {
  emoji: string;
  count: number;
  users: { id: string; display_name: string }[];
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  duration?: number; // for audio/video in seconds
  dimensions?: { width: number; height: number };
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender?: UserProfile;
  content: string;
  type: MessageType;
  attachments?: Attachment[];
  reply_to?: {
    id: string;
    sender_name: string;
    content: string;
    type: MessageType;
  };
  reactions: MessageReaction[];
  is_pinned: boolean;
  is_starred: boolean;
  is_edited: boolean;
  is_deleted: boolean;
  deleted_for_all?: boolean;
  status: MessageDeliveryStatus;
  created_at: string;
  updated_at?: string;
  forwarded_from?: string;
}

export type CallType = 'voice' | 'video';
export type CallStatus = 'ringing' | 'connected' | 'ended' | 'missed' | 'declined' | 'busy';

export interface CallSession {
  id: string;
  conversation_id: string;
  caller: UserProfile;
  participants: UserProfile[];
  type: CallType;
  status: CallStatus;
  started_at: string;
  duration: number; // in seconds
  is_muted: boolean;
  is_camera_off: boolean;
  is_screen_sharing: boolean;
  active_speaker_id?: string;
}

export interface CallHistoryRecord {
  id: string;
  other_user: UserProfile;
  type: CallType;
  direction: 'incoming' | 'outgoing';
  status: 'completed' | 'missed' | 'declined';
  duration: number; // seconds
  timestamp: string;
}

export interface StatusViewer {
  user: UserProfile;
  viewed_at: string;
}

export interface StatusUpdate {
  id: string;
  user_id: string;
  user: UserProfile;
  type: 'text' | 'image' | 'video';
  content: string;
  caption?: string;
  background_color: string;
  created_at: string;
  expires_at: string;
  viewers: StatusViewer[];
}

export type NotificationType = 'message' | 'call' | 'mention' | 'group' | 'contact';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  timestamp: string;
  is_read: boolean;
  avatar_url?: string;
  action_url?: string;
  data?: Record<string, any>;
}

export type ThemeMode = 'dark' | 'light' | 'amoled' | 'discord' | 'telegram' | 'system';
export type BubbleStyle = 'modern' | 'rounded' | 'classic' | 'discord';
export type InterfaceDensity = 'compact' | 'comfortable';
export type FontSize = 'small' | 'medium' | 'large';

export interface UserSettings {
  theme: ThemeMode;
  accent_color: string;
  font_size: FontSize;
  density: InterfaceDensity;
  bubble_style: BubbleStyle;
  enter_to_send: boolean;
  read_receipts: boolean;
  last_seen_visibility: 'everyone' | 'contacts' | 'nobody';
  online_status_visibility: 'everyone' | 'contacts' | 'nobody';
  profile_photo_visibility: 'everyone' | 'contacts' | 'nobody';
  bio_visibility: 'everyone' | 'contacts' | 'nobody';
  sound_notifications: boolean;
  desktop_notifications: boolean;
  call_ringtone: boolean;
  mute_all: boolean;
  custom_wallpaper: string;
  disappearing_default: number; // seconds
  reduced_motion: boolean;
  high_contrast: boolean;
}
