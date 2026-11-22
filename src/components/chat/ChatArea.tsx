import React, { useState, useEffect, useRef } from 'react';
import {
  Phone,
  Video,
  Search,
  MoreVertical,
  Paperclip,
  Smile,
  Mic,
  Send,
  X,
  Pin,
  Clock,
  VolumeX,
  Volume2,
  Trash2,
  ShieldAlert,
  Image as ImageIcon,
  FileText,
  Film,
  Music,
  ChevronDown,
  Info,
} from 'lucide-react';
import {
  Conversation,
  Message,
  UserProfile,
  Attachment,
  BubbleStyle,
} from '../../types';
import { Avatar } from '../common/Avatar';
import { MessageBubble } from './MessageBubble';
import { VoiceNoteRecorder } from './VoiceNoteRecorder';
import { ForwardModal } from './ForwardModal';
import { storage } from '../../services/storage';
import { peerService } from '../../services/peerService';
import { webrtc } from '../../services/webrtc';
import { useToast } from '../common/Toast';

interface ChatAreaProps {
  conversation: Conversation;
  currentUserId: string;
  bubbleStyle?: BubbleStyle;
  onOpenProfile: (user: UserProfile) => void;
  onViewMedia: (attachment: Attachment) => void;
  onBackMobile?: () => void;
}

const EMOJI_CATEGORIES = [
  { name: 'Smileys', emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '😉', '😌', '😍', '🥰', '😘'] },
  { name: 'Gestures', emojis: ['👍', '👎', '👌', '✌️', '🤞', '🤟', '🤙', '👈', '👉', '👆', '👇', '👏', '🙌', '🤝', '🙏'] },
  { name: 'Hearts & Warmth', emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '✨', '⭐', '☕', '🌿'] },
  { name: 'Reactions', emojis: ['🎉', '🚀', '💯', '🫡', '👀', '💡', '⚡', '💻', '🎨', '🎧', '🎯', '🏆', '🍕', '🍻'] },
];

export const ChatArea: React.FC<ChatAreaProps> = ({
  conversation,
  currentUserId,
  onOpenProfile,
  onViewMedia,
  onBackMobile,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([]);
  const [forwardingMessage, setForwardingMessage] = useState<Message | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  const toast = useToast();

  const settings = storage.getSettings();

  useEffect(() => {
    const msgs = storage.getMessages(conversation.id);
    setMessages(msgs);
    scrollToBottom();

    const unsubscribe = storage.subscribeToSync((event) => {
      if (
        event.type === 'NEW_MESSAGE' &&
        event.payload.conversation_id === conversation.id
      ) {
        setMessages((prev) => [...prev, event.payload.message]);
        scrollToBottom();
      } else if (
        event.type === 'MESSAGE_REACTION' &&
        event.payload.conversation_id === conversation.id
      ) {
        setMessages(storage.getMessages(conversation.id));
      } else if (
        event.type === 'TYPING_START' &&
        event.payload.conversation_id === conversation.id
      ) {
        const name = event.payload.user?.display_name || 'Someone';
        setTypingUsers((prev) => (prev.includes(name) ? prev : [...prev, name]));
      } else if (
        event.type === 'TYPING_STOP' &&
        event.payload.conversation_id === conversation.id
      ) {
        const name = event.payload.user?.display_name || 'Someone';
        setTypingUsers((prev) => prev.filter((n) => n !== name));
      }
    });

    return () => {
      unsubscribe();
    };
  }, [conversation.id]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  const otherUser =
    conversation.type === 'direct'
      ? conversation.participants.find((p) => p.id !== currentUserId)
      : null;

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    if (otherUser && otherUser.username) {
      peerService.sendTypingToUser(otherUser.username, true, conversation.id);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = window.setTimeout(() => {
        peerService.sendTypingToUser(otherUser.username, false, conversation.id);
      }, 2000);
    }
  };

  const handleSendMessage = () => {
    if (!inputText.trim() && pendingAttachments.length === 0) return;

    if (editingMessage) {
      const updated = messages.map((m) =>
        m.id === editingMessage.id
          ? {
              ...m,
              content: inputText,
              is_edited: true,
              updated_at: new Date().toISOString(),
            }
          : m
      );
      setMessages(updated);
      storage.saveMessages(conversation.id, updated);
      setEditingMessage(null);
      setInputText('');
      toast.success('Message updated');
      return;
    }

    const type = pendingAttachments.length > 0 ? (pendingAttachments[0].type.startsWith('image') ? 'image' : 'file') : 'text';

    const replyData = replyingTo
      ? {
          id: replyingTo.id,
          sender_name: replyingTo.sender?.display_name || 'Unknown',
          content: replyingTo.content,
          type: replyingTo.type,
        }
      : undefined;

    const newMsg = storage.sendMessage(
      conversation.id,
      inputText,
      type,
      pendingAttachments.length > 0 ? pendingAttachments : undefined,
      replyData
    );

    setMessages((prev) => [...prev, newMsg]);
    setInputText('');
    setPendingAttachments([]);
    setReplyingTo(null);
    scrollToBottom();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && settings.enter_to_send) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleVoiceNoteSend = (url: string, durationSeconds: number) => {
    const attachment: Attachment = {
      id: 'att_voice_' + Date.now(),
      name: `Voice note (${durationSeconds}s)`,
      url,
      type: 'audio/webm',
      size: durationSeconds * 16000,
      duration: durationSeconds,
    };

    const newMsg = storage.sendMessage(
      conversation.id,
      '',
      'voice_note',
      [attachment]
    );

    setMessages((prev) => [...prev, newMsg]);
    setIsRecordingVoice(false);
    scrollToBottom();
  };

  const handleVoiceCall = () => {
    if (otherUser) {
      webrtc.startCall(otherUser, 'voice');
    } else {
      toast.info('Voice call started for ' + conversation.name);
    }
  };

  const handleVideoCall = () => {
    if (otherUser) {
      webrtc.startCall(otherUser, 'video');
    } else {
      toast.info('Video call started for ' + conversation.name);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const att: Attachment = {
        id: 'att_' + Date.now(),
        name: file.name,
        url: result,
        type: file.type || 'application/octet-stream',
        size: file.size,
      };
      setPendingAttachments((prev) => [...prev, att]);
      setShowAttachMenu(false);
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteMessage = (messageId: string) => {
    const updated = messages.filter((m) => m.id !== messageId);
    setMessages(updated);
    storage.saveMessages(conversation.id, updated);
    toast.success('Message deleted');
  };

  const handlePinMessage = (messageId: string) => {
    const updated = messages.map((m) =>
      m.id === messageId ? { ...m, is_pinned: !m.is_pinned } : m
    );
    setMessages(updated);
    storage.saveMessages(conversation.id, updated);
    toast.info('Pinned messages updated');
  };

  const handleStarMessage = (messageId: string) => {
    const updated = messages.map((m) =>
      m.id === messageId ? { ...m, is_starred: !m.is_starred } : m
    );
    setMessages(updated);
    storage.saveMessages(conversation.id, updated);
    toast.success('Starred message updated');
  };

  const handleEditMessage = (message: Message) => {
    setEditingMessage(message);
    setInputText(message.content);
    textareaRef.current?.focus();
  };

  const handleForwardMessage = (message: Message) => {
    setForwardingMessage(message);
  };

  const handleClearChat = () => {
    setMessages([]);
    storage.saveMessages(conversation.id, []);
    setShowMoreMenu(false);
    toast.success('Chat cleared');
  };

  const filteredMessages = searchQuery.trim()
    ? messages.filter((m) =>
        m.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : messages;

  const pinnedMessage = messages.find((m) => m.is_pinned);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#fcf5eb] whatsapp-chat-bg relative overflow-hidden">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* CHAT HEADER — Pure White / Dark Slate Navigation Bar */}
      <div className="h-16 px-4 md:px-6 flex items-center justify-between border-b border-[#f0f4f9] dark:border-[#1e2638] bg-[#ffffff] dark:bg-[#141923] z-20 transition-colors">
        <div className="flex items-center gap-3 min-w-0">
          {onBackMobile && (
            <button
              onClick={onBackMobile}
              className="md:hidden p-1.5 text-[#5e5e5e] dark:text-[#94a3b8] hover:text-[#111b21] dark:hover:text-[#f8fafc] rounded-full"
            >
              <ChevronDown className="w-5 h-5 rotate-90" />
            </button>
          )}

          <div
            className="cursor-pointer flex items-center gap-3 min-w-0"
            onClick={() => otherUser && onOpenProfile(otherUser)}
          >
            <Avatar
              src={conversation.avatar_url}
              name={conversation.name}
              size="md"
              status={otherUser ? otherUser.status : undefined}
              showStatus={conversation.type === 'direct'}
            />
            <div className="min-w-0">
              <div className="font-bold text-sm text-[#111b21] dark:text-[#f8fafc] truncate flex items-center gap-1.5">
                {conversation.name}
                {conversation.is_muted && (
                  <VolumeX className="w-3.5 h-3.5 text-[#5e5e5e] dark:text-[#94a3b8]" />
                )}
              </div>
              <div className="text-[12px] text-[#5e5e5e] dark:text-[#94a3b8] truncate">
                {typingUsers.length > 0 ? (
                  <span className="text-[#ff6b00] font-bold animate-pulse">
                    {typingUsers.join(', ')} is typing...
                  </span>
                ) : conversation.type === 'direct' && otherUser ? (
                  otherUser.is_online ? (
                    <span className="text-[#ff6b00] font-medium">online</span>
                  ) : (
                    `last seen ${new Date(otherUser.last_seen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                  )
                ) : (
                  `${conversation.participants.length} members`
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Header Action Buttons with Pill Hover Style */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleVoiceCall}
            className="p-2.5 text-[#1c1e21] dark:text-[#e2e8f0] hover:bg-[#f0f4f9] dark:hover:bg-[#1e2638] rounded-[50px] transition-colors"
            title="Voice call"
          >
            <Phone className="w-5 h-5" />
          </button>
          <button
            onClick={handleVideoCall}
            className="p-2.5 text-[#1c1e21] dark:text-[#e2e8f0] hover:bg-[#f0f4f9] dark:hover:bg-[#1e2638] rounded-[50px] transition-colors"
            title="Video call"
          >
            <Video className="w-5 h-5" />
          </button>
          <button
            onClick={() => setIsSearching(!isSearching)}
            className={`p-2.5 rounded-[50px] transition-colors ${
              isSearching
                ? 'bg-[#ffe6d4] dark:bg-[#7c2d12] text-[#ff6b00] dark:text-[#ff9500]'
                : 'text-[#1c1e21] dark:text-[#e2e8f0] hover:bg-[#f0f4f9] dark:hover:bg-[#1e2638]'
            }`}
            title="Search"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* More options dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className="p-2.5 text-[#1c1e21] dark:text-[#e2e8f0] hover:bg-[#f0f4f9] dark:hover:bg-[#1e2638] rounded-[50px] transition-colors"
              title="More"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {showMoreMenu && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-[#ffffff] dark:bg-[#141923] border border-[#f0f4f9] dark:border-[#1e2638] rounded-2xl shadow-xl p-1.5 z-40 animate-slide-up text-xs font-medium text-[#111b21] dark:text-[#f8fafc]">
                {otherUser && (
                  <button
                    onClick={() => {
                      onOpenProfile(otherUser);
                      setShowMoreMenu(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-[#fcf5eb] dark:hover:bg-[#1e2638] rounded-xl text-left"
                  >
                    <Info className="w-4 h-4 text-[#5e5e5e] dark:text-[#94a3b8]" /> Contact Info
                  </button>
                )}
                <button
                  onClick={() => {
                    const convs = storage.getConversations();
                    const c = convs.find((conv) => conv.id === conversation.id);
                    if (c) c.is_muted = !c.is_muted;
                    storage.saveConversations(convs);
                    setShowMoreMenu(false);
                    toast.info(c?.is_muted ? 'Notifications muted' : 'Notifications unmuted');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-[#fcf5eb] dark:hover:bg-[#1e2638] rounded-xl text-left"
                >
                  {conversation.is_muted ? (
                    <>
                      <Volume2 className="w-4 h-4 text-[#5e5e5e] dark:text-[#94a3b8]" /> Unmute Notifications
                    </>
                  ) : (
                    <>
                      <VolumeX className="w-4 h-4 text-[#5e5e5e] dark:text-[#94a3b8]" /> Mute Notifications
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    const duration = conversation.disappearing_seconds === 86400 ? 0 : 86400;
                    const convs = storage.getConversations();
                    const c = convs.find((conv) => conv.id === conversation.id);
                    if (c) c.disappearing_seconds = duration;
                    storage.saveConversations(convs);
                    setShowMoreMenu(false);
                    toast.info(duration ? 'Disappearing messages set to 24h' : 'Disappearing messages turned off');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-[#fcf5eb] dark:hover:bg-[#1e2638] rounded-xl text-left"
                >
                  <Clock className="w-4 h-4 text-[#5e5e5e] dark:text-[#94a3b8]" /> Disappearing Messages
                </button>
                <div className="h-px bg-[#f0f4f9] dark:bg-[#1e2638] my-1" />
                <button
                  onClick={handleClearChat}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl text-left"
                >
                  <Trash2 className="w-4 h-4" /> Clear Messages
                </button>
                {otherUser && (
                  <button
                    onClick={() => {
                      const contacts = storage.getContacts();
                      const c = contacts.find((item) => item.contact_id === otherUser.id);
                      if (c) storage.toggleBlockContact(c.id);
                      setShowMoreMenu(false);
                      toast.info(`Updated block status for ${otherUser.display_name}`);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl text-left"
                  >
                    <ShieldAlert className="w-4 h-4" /> Block Contact
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SEARCH BAR (WHEN ACTIVE) */}
      {isSearching && (
        <div className="px-6 py-2 bg-[#ffffff] dark:bg-[#141923] border-b border-[#f0f4f9] dark:border-[#1e2638] flex items-center gap-2 animate-slide-up">
          <Search className="w-4 h-4 text-[#5e5e5e] dark:text-[#94a3b8]" />
          <input
            type="text"
            placeholder="Search in this conversation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-[#111b21] dark:text-[#f8fafc] focus:outline-none placeholder-[#5e5e5e] dark:placeholder-[#94a3b8]"
            autoFocus
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="p-1 text-[#5e5e5e] dark:text-[#94a3b8] hover:text-[#111b21] dark:hover:text-[#f8fafc]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* PINNED MESSAGE BANNER */}
      {pinnedMessage && (
        <div className="px-4 py-2 bg-[#ffe6d4] dark:bg-[#7c2d12]/40 border-b border-[#ff6b00]/20 flex items-center justify-between text-xs text-[#111b21] dark:text-[#f8fafc]">
          <div className="flex items-center gap-2 truncate">
            <Pin className="w-3.5 h-3.5 text-[#ff6b00] fill-[#ff6b00] flex-shrink-0" />
            <span className="font-bold text-[#ff6b00]">Pinned:</span>
            <span className="truncate text-[#5e5e5e] dark:text-[#94a3b8]">{pinnedMessage.content}</span>
          </div>
          <button
            onClick={() => handlePinMessage(pinnedMessage.id)}
            className="p-1 hover:text-[#111b21] dark:hover:text-[#f8fafc] text-[#5e5e5e] dark:text-[#94a3b8]"
            title="Unpin"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* MESSAGES LIST — FLOATING BUBBLES OVER CREAM CANVAS */}
      <div className="flex-1 overflow-y-auto px-2 md:px-6 py-4 space-y-1">
        {filteredMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#5e5e5e] dark:text-[#94a3b8]">
            <div className="w-16 h-16 rounded-[50px] bg-[#ffffff] dark:bg-[#141923] border border-[#f0f4f9] dark:border-[#1e2638] shadow-sm flex items-center justify-center mb-3 text-[#ff6b00]">
              <Smile className="w-8 h-8" />
            </div>
            <p className="text-base font-bold text-[#111b21] dark:text-[#f8fafc]">
              {searchQuery ? 'No matching messages' : 'Say hello!'}
            </p>
            <p className="text-xs text-[#5e5e5e] dark:text-[#94a3b8] max-w-xs mt-1">
              Messages are end-to-end encrypted on Chattr. Send a message to start chatting with {conversation.name}.
            </p>
          </div>
        ) : (
          filteredMessages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              currentUserId={currentUserId}
              isGroup={conversation.type === 'group'}
              onReply={(m) => setReplyingTo(m)}
              onEdit={handleEditMessage}
              onDelete={handleDeleteMessage}
              onPin={handlePinMessage}
              onStar={handleStarMessage}
              onForward={handleForwardMessage}
              onViewMedia={onViewMedia}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* REPLY BANNER */}
      {replyingTo && (
        <div className="px-6 py-2 bg-[#ffffff] dark:bg-[#141923] border-t border-[#f0f4f9] dark:border-[#1e2638] flex items-center justify-between animate-slide-up">
          <div className="flex items-center gap-2 text-xs truncate">
            <div className="w-1 h-8 bg-[#ff6b00] rounded-full" />
            <div>
              <span className="font-bold text-[#ff6b00]">
                Replying to {replyingTo.sender?.display_name || 'Message'}:
              </span>
              <p className="text-[#5e5e5e] dark:text-[#94a3b8] truncate">{replyingTo.content}</p>
            </div>
          </div>
          <button
            onClick={() => setReplyingTo(null)}
            className="p-1 text-[#5e5e5e] dark:text-[#94a3b8] hover:text-[#111b21] dark:hover:text-[#f8fafc]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* EDIT BANNER */}
      {editingMessage && (
        <div className="px-6 py-2 bg-[#ffffff] dark:bg-[#141923] border-t border-[#f0f4f9] dark:border-[#1e2638] flex items-center justify-between animate-slide-up">
          <div className="flex items-center gap-2 text-xs text-[#ff6b00] font-bold">
            <span>Editing message</span>
          </div>
          <button
            onClick={() => {
              setEditingMessage(null);
              setInputText('');
            }}
            className="p-1 text-[#5e5e5e] dark:text-[#94a3b8] hover:text-[#111b21] dark:hover:text-[#f8fafc]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* PENDING ATTACHMENTS */}
      {pendingAttachments.length > 0 && (
        <div className="px-6 py-2 bg-[#ffffff] dark:bg-[#141923] border-t border-[#f0f4f9] dark:border-[#1e2638] flex items-center gap-2 overflow-x-auto">
          {pendingAttachments.map((att, idx) => (
            <div
              key={idx}
              className="relative p-2 bg-[#f0f4f9] dark:bg-[#1e2638] rounded-xl flex items-center gap-2 pr-6"
            >
              {att.type.startsWith('image') ? (
                <img src={att.url} alt="" className="w-10 h-10 object-cover rounded-lg" />
              ) : (
                <FileText className="w-6 h-6 text-[#ff6b00]" />
              )}
              <span className="text-xs text-[#111b21] dark:text-[#f8fafc] max-w-[120px] truncate">{att.name}</span>
              <button
                onClick={() =>
                  setPendingAttachments((prev) => prev.filter((_, i) => i !== idx))
                }
                className="absolute top-1 right-1 p-0.5 text-[#5e5e5e] dark:text-[#94a3b8] hover:text-[#111b21] dark:hover:text-[#f8fafc]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* EMOJI DRAWER */}
      {showEmojiPicker && (
        <div className="p-3 bg-[#ffffff] dark:bg-[#141923] border-t border-[#f0f4f9] dark:border-[#1e2638] max-h-52 overflow-y-auto z-20 animate-slide-up transition-colors">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#f0f4f9] dark:border-[#1e2638] text-xs font-bold text-[#5e5e5e] dark:text-[#94a3b8]">
            <span>Emojis</span>
            <button
              onClick={() => setShowEmojiPicker(false)}
              className="text-[#5e5e5e] dark:text-[#94a3b8] hover:text-[#111b21] dark:hover:text-[#f8fafc]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3">
            {EMOJI_CATEGORIES.map((cat) => (
              <div key={cat.name}>
                <div className="text-[11px] font-bold text-[#5e5e5e] dark:text-[#94a3b8] uppercase tracking-wider mb-1.5">
                  {cat.name}
                </div>
                <div className="grid grid-cols-8 md:grid-cols-12 gap-1.5">
                  {cat.emojis.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => {
                        setInputText((prev) => prev + emoji);
                        textareaRef.current?.focus();
                      }}
                      className="text-xl p-1.5 rounded-full hover:bg-[#f0f4f9] dark:hover:bg-[#1e2638] transition-transform hover:scale-125"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* BOTTOM INPUT BAR — CHATTR PILL INPUT (50PX RADIUS) & ORANGE SEND BUTTON */}
      <div className="p-3 md:p-3.5 bg-[#ffffff] dark:bg-[#141923] border-t border-[#f0f4f9] dark:border-[#1e2638] z-20 transition-colors">
        {isRecordingVoice ? (
          <VoiceNoteRecorder
            onSend={handleVoiceNoteSend}
            onCancel={() => setIsRecordingVoice(false)}
          />
        ) : (
          <div className="flex items-end gap-2">
            {/* Attachment Button */}
            <div className="relative">
              <button
                onClick={() => setShowAttachMenu(!showAttachMenu)}
                className="p-2.5 text-[#5e5e5e] dark:text-[#94a3b8] hover:text-[#111b21] dark:hover:text-[#f8fafc] hover:bg-[#f0f4f9] dark:hover:bg-[#1e2638] rounded-[50px] transition-colors"
                title="Attach"
              >
                <Paperclip className="w-5 h-5" />
              </button>

              {showAttachMenu && (
                <div className="absolute bottom-full left-0 mb-2 w-48 bg-[#ffffff] dark:bg-[#141923] border border-[#f0f4f9] dark:border-[#1e2638] rounded-2xl shadow-xl p-1.5 z-40 animate-slide-up text-xs font-medium text-[#111b21] dark:text-[#f8fafc]">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-[#fcf5eb] dark:hover:bg-[#1e2638] rounded-xl text-left"
                  >
                    <ImageIcon className="w-4 h-4 text-[#ff6b00]" /> Photos & Videos
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-[#fcf5eb] dark:hover:bg-[#1e2638] rounded-xl text-left"
                  >
                    <FileText className="w-4 h-4 text-[#0373e9]" /> Document
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-[#fcf5eb] dark:hover:bg-[#1e2638] rounded-xl text-left"
                  >
                    <Music className="w-4 h-4 text-purple-500" /> Audio
                  </button>
                </div>
              )}
            </div>

            {/* Emoji Toggle */}
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-2.5 text-[#5e5e5e] dark:text-[#94a3b8] hover:text-[#111b21] dark:hover:text-[#f8fafc] hover:bg-[#f0f4f9] dark:hover:bg-[#1e2638] rounded-[50px] transition-colors"
              title="Emoji"
            >
              <Smile className="w-5 h-5" />
            </button>

            {/* Chattr 50px Pill Input Container */}
            <div className="flex-1 bg-[#f0f4f9] dark:bg-[#1e2638] rounded-[50px] px-4 py-2.5 focus-within:ring-1 focus-within:ring-[#ff6b00] transition-all">
              <textarea
                ref={textareaRef}
                rows={1}
                value={inputText}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={
                  editingMessage
                    ? 'Edit message...'
                    : 'Type a message'
                }
                className="w-full bg-transparent text-sm text-[#111b21] dark:text-[#f8fafc] focus:outline-none resize-none max-h-32 placeholder-[#5e5e5e] dark:placeholder-[#94a3b8] leading-relaxed"
              />
            </div>

            {/* Chattr Orange (#ff6b00) Pill/Circular Send Action */}
            {inputText.trim() || pendingAttachments.length > 0 ? (
              <button
                onClick={handleSendMessage}
                className="p-3 bg-[#ff6b00] hover:bg-[#e65c00] text-white rounded-[50px] shadow-sm shadow-orange-500/30 transition-all transform hover:scale-105 active:scale-95"
                title="Send"
              >
                <Send className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={() => setIsRecordingVoice(true)}
                className="p-3 text-[#5e5e5e] dark:text-[#94a3b8] hover:text-[#111b21] dark:hover:text-[#f8fafc] hover:bg-[#f0f4f9] dark:hover:bg-[#1e2638] rounded-[50px] transition-colors"
                title="Voice note"
              >
                <Mic className="w-5 h-5" />
              </button>
            )}
          </div>
        )}
      </div>

      <ForwardModal
        isOpen={Boolean(forwardingMessage)}
        message={forwardingMessage}
        onClose={() => setForwardingMessage(null)}
      />
    </div>
  );
};
