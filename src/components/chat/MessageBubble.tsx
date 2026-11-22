import React, { useState } from 'react';
import {
  Check,
  CheckCheck,
  Smile,
  Reply,
  MoreVertical,
  Pin,
  Star,
  Copy,
  Trash2,
  Edit2,
  FileText,
  Download,
  Play,
  Pause,
  Forward,
} from 'lucide-react';
import { Message, UserProfile, Attachment, BubbleStyle } from '../../types';
import { Avatar } from '../common/Avatar';
import { storage } from '../../services/storage';
import { useToast } from '../common/Toast';

interface MessageBubbleProps {
  message: Message;
  currentUserId: string;
  isGroup?: boolean;
  bubbleStyle?: BubbleStyle;
  onReply: (message: Message) => void;
  onEdit: (message: Message) => void;
  onDelete: (messageId: string) => void;
  onPin: (messageId: string) => void;
  onStar: (messageId: string) => void;
  onForward: (message: Message) => void;
  onViewMedia: (attachment: Attachment) => void;
}

const COMMON_EMOJIS = ['👍', '❤️', '😂', '😮', '🙏', '🔥'];

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  currentUserId,
  isGroup = false,
  onReply,
  onEdit,
  onDelete,
  onPin,
  onStar,
  onForward,
  onViewMedia,
}) => {
  const [showReactionsPicker, setShowReactionsPicker] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const toast = useToast();

  const isMe = message.sender_id === currentUserId;

  if (message.type === 'system') {
    return (
      <div className="flex justify-center my-2.5">
        <span className="px-3 py-1 text-[11px] font-medium text-[#5e5e5e] bg-[#ffffff]/90 rounded-[50px] shadow-sm border border-[#f0f4f9]">
          {message.content}
        </span>
      </div>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    toast.success('Message copied');
    setShowMenu(false);
  };

  const handleToggleReaction = (emoji: string) => {
    storage.toggleReaction(message.conversation_id, message.id, emoji);
    setShowReactionsPicker(false);
  };

  const togglePlayAudio = (url: string) => {
    if (!audioRef.current) {
      audioRef.current = new Audio(url);
      audioRef.current.onended = () => setIsPlayingAudio(false);
    }
    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioRef.current.play().catch(() => {});
      setIsPlayingAudio(true);
    }
  };

  const formatTimestamp = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // WhatsApp authentic radii: 8px outer, 2px on the tail corner
  const bubbleTailClass = isMe
    ? 'rounded-t-[8px] rounded-bl-[8px] rounded-br-[2px]'
    : 'rounded-t-[8px] rounded-br-[8px] rounded-bl-[2px]';

  return (
    <div
      className={`group relative flex items-start gap-2 my-1 px-2 md:px-4 ${
        isMe ? 'flex-row-reverse' : 'flex-row'
      }`}
    >
      {/* Sender Avatar in Group chats */}
      {isGroup && !isMe && message.sender && (
        <Avatar
          src={message.sender.avatar_url}
          name={message.sender.display_name}
          size="xs"
          className="mt-0.5"
        />
      )}

      {/* Bubble Container */}
      <div className={`relative max-w-[85%] md:max-w-[65%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
        {/* Sender Name in Group chats */}
        {isGroup && !isMe && message.sender && (
          <div className="flex items-center gap-2 mb-0.5 px-1">
            <span className="text-[12px] font-bold text-[#0373e9]">
              {message.sender.display_name}
            </span>
          </div>
        )}

        {/* Replying banner */}
        {message.reply_to && (
          <div
            className={`flex items-center gap-2 px-3 py-1.5 mb-0.5 text-xs rounded-[8px] border-l-4 border-l-[#ff6b00] bg-[#f0f4f9] dark:bg-[#1e2638] max-w-full truncate`}
          >
            <div className="truncate">
              <span className="font-bold text-[#ff6b00]">
                {message.reply_to.sender_name}:
              </span>{' '}
              <span className="text-[#5e5e5e] dark:text-[#94a3b8]">{message.reply_to.content}</span>
            </div>
          </div>
        )}

        {/* Message Content Bubble (Chattr Pure White incoming, Warm Orange #ffe6d4 outgoing) */}
        <div
          className={`relative px-3.5 py-2 text-sm transition-all duration-150 shadow-sm border border-transparent ${bubbleTailClass} ${
            isMe
              ? 'bg-[#ffe6d4] dark:bg-[#7c2d12] text-[#111b21] dark:text-[#ffedd5]'
              : 'bg-[#ffffff] dark:bg-[#141923] text-[#111b21] dark:text-[#f8fafc] border-[#f0f4f9] dark:border-[#1e2638]'
          } ${message.is_pinned ? 'ring-2 ring-[#ff6b00]/40' : ''}`}
        >
          {/* Pinned pill */}
          {message.is_pinned && (
            <div className="flex items-center gap-1 text-[10px] text-[#ff6b00] font-bold mb-1">
              <Pin className="w-3 h-3 fill-current" /> Pinned message
            </div>
          )}

          {/* Forwarded pill */}
          {message.forwarded_from && (
            <div className="flex items-center gap-1 text-[10px] text-[#5e5e5e] font-medium italic mb-1">
              <Forward className="w-3 h-3" /> Forwarded
            </div>
          )}

          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="space-y-1.5 mb-1.5">
              {message.attachments.map((att) => {
                const isImage = att.type.startsWith('image') || att.name.match(/\.(jpg|jpeg|png|webp|gif)$/i);
                const isVideo = att.type.startsWith('video') || att.name.match(/\.(mp4|webm)$/i);
                const isAudio = att.type.startsWith('audio') || att.name.match(/\.(webm|mp3|ogg|wav)$/i);

                if (isImage) {
                  return (
                    <div
                      key={att.id}
                      onClick={() => onViewMedia(att)}
                      className="cursor-pointer overflow-hidden rounded-[8px] group/media relative"
                    >
                      <img
                        src={att.url}
                        alt={att.name}
                        className="max-h-72 w-full object-cover rounded-[8px] transition-transform duration-200 group-hover/media:scale-[1.01]"
                      />
                    </div>
                  );
                }

                if (isVideo) {
                  return (
                    <div key={att.id} className="rounded-[8px] overflow-hidden">
                      <video
                        src={att.url}
                        controls
                        className="max-h-72 w-full rounded-[8px] object-contain bg-black"
                      />
                    </div>
                  );
                }

                if (isAudio) {
                  return (
                    <div
                      key={att.id}
                      className="flex items-center gap-3 p-2 bg-black/5 rounded-[8px]"
                    >
                      <button
                        onClick={() => togglePlayAudio(att.url)}
                        className="p-2 bg-[#25d366] text-white rounded-full hover:scale-105 transition-transform"
                      >
                        {isPlayingAudio ? (
                          <Pause className="w-3.5 h-3.5 fill-current" />
                        ) : (
                          <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                        )}
                      </button>
                      <div className="flex-1">
                        <div className="text-xs font-semibold text-[#111b21]">{att.name}</div>
                        <div className="flex gap-1 h-2.5 items-center mt-1">
                          {[30, 70, 45, 90, 60, 40, 85, 50, 30, 60, 80, 40].map((h, i) => (
                            <span
                              key={i}
                              className={`w-1 rounded-full ${
                                isPlayingAudio ? 'bg-[#25d366]' : 'bg-[#5e5e5e]'
                              }`}
                              style={{ height: `${h}%` }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={att.id}
                    className="flex items-center gap-3 p-2.5 bg-black/5 rounded-[8px]"
                  >
                    <FileText className="w-6 h-6 text-[#25d366] flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-[#111b21] truncate">{att.name}</div>
                      <div className="text-[10px] text-[#5e5e5e]">
                        {(att.size / 1024).toFixed(1)} KB
                      </div>
                    </div>
                    <a
                      href={att.url}
                      download={att.name}
                      className="p-1.5 hover:bg-black/10 rounded-full text-[#111b21] transition-colors"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                );
              })}
            </div>
          )}

          {/* Text Content */}
          {message.content && (
            <p className="whitespace-pre-wrap break-words leading-relaxed text-[#111b21]">
              {message.content}
            </p>
          )}

          {/* Timestamp & WhatsApp Blue Double Checkmark */}
          <div className="flex items-center justify-end gap-1 mt-0.5 text-[11px] text-[#5e5e5e]">
            {message.is_edited && <span className="italic">edited</span>}
            {message.is_starred && <Star className="w-3 h-3 fill-amber-400 text-amber-400" />}
            <span>{formatTimestamp(message.created_at)}</span>

            {isMe && (
              <span>
                {message.status === 'sent' && <Check className="w-3.5 h-3.5 text-[#5e5e5e]" />}
                {message.status === 'delivered' && (
                  <CheckCheck className="w-3.5 h-3.5 text-[#5e5e5e]" />
                )}
                {message.status === 'read' && (
                  <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
                )}
              </span>
            )}
          </div>
        </div>

        {/* Reactions Display */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1 z-10">
            {message.reactions.map((r) => {
              const hasReacted = r.users.some((u) => u.id === currentUserId);
              return (
                <button
                  key={r.emoji}
                  onClick={() => handleToggleReaction(r.emoji)}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-[50px] text-xs border shadow-sm transition-all ${
                    hasReacted
                      ? 'bg-[#ffe6d4] dark:bg-[#7c2d12] border-[#ff6b00] text-[#ff6b00] dark:text-[#ff9500] font-bold'
                      : 'bg-[#ffffff] dark:bg-[#141923] border-[#f0f4f9] dark:border-[#1e2638] text-[#111b21] dark:text-[#f8fafc] hover:border-slate-300'
                  }`}
                  title={r.users.map((u) => u.display_name).join(', ')}
                >
                  <span>{r.emoji}</span>
                  <span className="text-[11px]">{r.count}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Hover Floating Actions Menu */}
      <div
        className={`opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center gap-0.5 p-1 bg-[#ffffff] dark:bg-[#141923] border border-[#f0f4f9] dark:border-[#1e2638] rounded-[50px] shadow-sm self-center z-20 ${
          isMe ? 'mr-1' : 'ml-1'
        }`}
      >
        <button
          onClick={() => setShowReactionsPicker(!showReactionsPicker)}
          className="p-1.5 text-[#5e5e5e] dark:text-[#94a3b8] hover:text-[#111b21] dark:hover:text-[#f8fafc] hover:bg-[#f0f4f9] dark:hover:bg-[#1e2638] rounded-full transition-colors"
          title="React"
        >
          <Smile className="w-4 h-4" />
        </button>
        <button
          onClick={() => onReply(message)}
          className="p-1.5 text-[#5e5e5e] dark:text-[#94a3b8] hover:text-[#111b21] dark:hover:text-[#f8fafc] hover:bg-[#f0f4f9] dark:hover:bg-[#1e2638] rounded-full transition-colors"
          title="Reply"
        >
          <Reply className="w-4 h-4" />
        </button>
        <button
          onClick={() => onForward(message)}
          className="p-1.5 text-[#5e5e5e] dark:text-[#94a3b8] hover:text-[#111b21] dark:hover:text-[#f8fafc] hover:bg-[#f0f4f9] dark:hover:bg-[#1e2638] rounded-full transition-colors"
          title="Forward"
        >
          <Forward className="w-4 h-4" />
        </button>
        <button
          onClick={() => onStar(message.id)}
          className={`p-1.5 rounded-full transition-colors ${
            message.is_starred
              ? 'text-amber-500'
              : 'text-[#5e5e5e] dark:text-[#94a3b8] hover:text-[#111b21] dark:hover:text-[#f8fafc] hover:bg-[#f0f4f9] dark:hover:bg-[#1e2638]'
          }`}
          title={message.is_starred ? 'Unstar' : 'Star'}
        >
          <Star className={`w-4 h-4 ${message.is_starred ? 'fill-current' : ''}`} />
        </button>
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 text-[#5e5e5e] dark:text-[#94a3b8] hover:text-[#111b21] dark:hover:text-[#f8fafc] hover:bg-[#f0f4f9] dark:hover:bg-[#1e2638] rounded-full transition-colors"
            title="More"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {/* Context Dropdown Menu */}
          {showMenu && (
            <div
              className={`absolute top-full mt-1.5 ${
                isMe ? 'right-0' : 'left-0'
              } w-44 bg-[#ffffff] dark:bg-[#141923] border border-[#f0f4f9] dark:border-[#1e2638] rounded-2xl shadow-lg p-1.5 z-30 animate-slide-up text-xs font-medium text-[#111b21] dark:text-[#f8fafc]`}
            >
              <button
                onClick={handleCopy}
                className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-[#fcf5eb] dark:hover:bg-[#1e2638] rounded-xl text-left"
              >
                <Copy className="w-3.5 h-3.5" /> Copy Text
              </button>
              <button
                onClick={() => {
                  onPin(message.id);
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-[#fcf5eb] dark:hover:bg-[#1e2638] rounded-xl text-left"
              >
                <Pin className="w-3.5 h-3.5" /> {message.is_pinned ? 'Unpin' : 'Pin Message'}
              </button>
              {isMe && (
                <button
                  onClick={() => {
                    onEdit(message);
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-[#fcf5eb] dark:hover:bg-[#1e2638] rounded-xl text-left"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Edit Message
                </button>
              )}
              <div className="h-px bg-[#f0f4f9] dark:bg-[#1e2638] my-1" />
              <button
                onClick={() => {
                  onDelete(message.id);
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl text-left"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Quick Reaction Popup */}
      {showReactionsPicker && (
        <div
          className={`absolute -top-10 ${
            isMe ? 'right-12' : 'left-12'
          } flex items-center gap-1 px-2.5 py-1 bg-[#ffffff] dark:bg-[#141923] border border-[#f0f4f9] dark:border-[#1e2638] rounded-[50px] shadow-lg z-30 animate-slide-up`}
        >
          {COMMON_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleToggleReaction(emoji)}
              className="text-base hover:scale-125 transition-transform p-1"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
