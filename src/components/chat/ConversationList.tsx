import React, { useState } from 'react';
import {
  Search,
  Plus,
  Pin,
  VolumeX,
  Users,
  MessageSquare,
  CheckCheck,
} from 'lucide-react';
import { Conversation, UserProfile } from '../../types';
import { Avatar } from '../common/Avatar';
import { Badge } from '../common/Badge';

interface ConversationListProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  currentUserId: string;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onNewGroup: () => void;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  activeConversationId,
  currentUserId,
  onSelectConversation,
  onNewChat,
  onNewGroup,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'unread' | 'groups' | 'direct'>('all');

  const filtered = conversations.filter((conv) => {
    if (searchQuery.trim()) {
      const matchName = conv.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchLast = conv.last_message?.content
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      if (!matchName && !matchLast) return false;
    }

    if (filterTab === 'unread') return conv.unread_count > 0;
    if (filterTab === 'groups') return conv.type === 'group';
    if (filterTab === 'direct') return conv.type === 'direct';
    return !conv.is_archived;
  });

  const pinned = filtered.filter((c) => c.is_pinned);
  const others = filtered.filter((c) => !c.is_pinned);

  const formatTimestamp = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const renderConversationItem = (conv: Conversation) => {
    const isActive = conv.id === activeConversationId;
    const other =
      conv.type === 'direct'
        ? conv.participants.find((p) => p.id !== currentUserId)
        : null;

    return (
      <div
        key={conv.id}
        onClick={() => onSelectConversation(conv.id)}
        className={`group relative flex items-center gap-3.5 px-4 py-3 mx-2 my-1 rounded-2xl cursor-pointer transition-all duration-150 select-none ${
          isActive
            ? 'bg-[#ffe6d4]/40 dark:bg-[#ff6b00]/15 text-[#111b21] dark:text-[#f8fafc] font-semibold border-l-4 border-l-[#ff6b00]'
            : 'hover:bg-[#f0f4f9] dark:hover:bg-[#1e2638] text-[#1c1e21] dark:text-[#e2e8f0]'
        }`}
      >
        <Avatar
          src={conv.avatar_url}
          name={conv.name}
          size="md"
          status={other ? other.status : undefined}
          showStatus={conv.type === 'direct'}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1 mb-0.5">
            <span
              className={`text-sm truncate font-bold text-[#111b21] dark:text-[#f8fafc]`}
            >
              {conv.name}
            </span>
            <span className="text-[11px] text-[#5e5e5e] dark:text-[#94a3b8] flex-shrink-0">
              {formatTimestamp(conv.last_message?.created_at || conv.updated_at)}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="text-xs text-[#5e5e5e] dark:text-[#94a3b8] truncate flex items-center gap-1">
              {conv.last_message?.sender_id === currentUserId && (
                <CheckCheck className="w-3.5 h-3.5 text-[#ff6b00] flex-shrink-0 inline" />
              )}
              <span className="truncate">
                {conv.last_message ? (
                  conv.last_message.type === 'voice_note' ? (
                    '🎤 Voice note'
                  ) : conv.last_message.type === 'image' ? (
                    '📷 Photo'
                  ) : conv.last_message.type === 'file' ? (
                    '📄 Document'
                  ) : (
                    conv.last_message.content
                  )
                ) : (
                  conv.description || 'No messages yet'
                )}
              </span>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              {conv.is_pinned && <Pin className="w-3.5 h-3.5 text-[#5e5e5e] dark:text-[#94a3b8] fill-[#5e5e5e] dark:fill-[#94a3b8]" />}
              {conv.is_muted && <VolumeX className="w-3.5 h-3.5 text-[#5e5e5e] dark:text-[#94a3b8]" />}
              {conv.unread_count > 0 && (
                <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[11px] font-bold rounded-full min-w-[20px] h-5 bg-[#ff6b00] text-white shadow-sm">
                  {conv.unread_count}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full md:w-80 lg:w-96 h-full flex flex-col bg-[#ffffff] dark:bg-[#141923] border-r border-[#f0f4f9] dark:border-[#1e2638] select-none transition-colors">
      {/* Header */}
      <div className="p-4 border-b border-[#f0f4f9] dark:border-[#1e2638]">
        <div className="flex items-center justify-between mb-3.5">
          <h2 className="text-xl font-bold tracking-tight text-[#111b21] dark:text-[#f8fafc] flex items-center gap-2">
            Chats
          </h2>
          <div className="flex items-center gap-1.5">
            <button
              onClick={onNewGroup}
              className="p-2 text-[#1c1e21] dark:text-[#e2e8f0] hover:bg-[#f0f4f9] dark:hover:bg-[#1e2638] rounded-[50px] transition-colors"
              title="New group"
            >
              <Users className="w-4 h-4" />
            </button>
            <button
              onClick={onNewChat}
              className="p-2 bg-[#ff6b00] hover:bg-[#e65c00] text-white rounded-[50px] shadow-sm transition-all transform hover:scale-105 active:scale-95"
              title="New chat"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search input with 50px pill radius */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5e5e5e] dark:text-[#94a3b8]" />
          <input
            type="text"
            placeholder="Search or start new chat"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#f0f4f9] dark:bg-[#1e2638] text-xs text-[#111b21] dark:text-[#f8fafc] rounded-[50px] border border-transparent focus:outline-none focus:border-[#ff6b00] transition-colors placeholder-[#5e5e5e] dark:placeholder-[#94a3b8]"
          />
        </div>

        {/* Filter Pills with 50px radius */}
        <div className="flex items-center gap-1.5 mt-3 overflow-x-auto no-scrollbar">
          {(['all', 'unread', 'direct', 'groups'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterTab(tab)}
              className={`px-3.5 py-1 rounded-[50px] text-xs font-semibold capitalize whitespace-nowrap transition-all ${
                filterTab === tab
                  ? 'bg-[#ffe6d4] dark:bg-[#7c2d12] text-[#ff6b00] dark:text-[#ff9500]'
                  : 'text-[#5e5e5e] dark:text-[#94a3b8] hover:text-[#111b21] dark:hover:text-[#f8fafc] hover:bg-[#f0f4f9] dark:hover:bg-[#1e2638]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Conversations Scrollable List */}
      <div className="flex-1 overflow-y-auto py-2">
        {pinned.length > 0 && (
          <div className="mb-2">
            <div className="px-4 py-1 text-[11px] font-bold text-[#5e5e5e] dark:text-[#94a3b8] uppercase tracking-wider flex items-center gap-1">
              <Pin className="w-3 h-3 fill-current" /> Pinned
            </div>
            {pinned.map(renderConversationItem)}
          </div>
        )}

        <div>
          {pinned.length > 0 && others.length > 0 && (
            <div className="px-4 py-1 text-[11px] font-bold text-[#5e5e5e] dark:text-[#94a3b8] uppercase tracking-wider">
              All Conversations
            </div>
          )}
          {others.map(renderConversationItem)}
        </div>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center h-48 text-center p-6 text-[#5e5e5e] dark:text-[#94a3b8]">
            <MessageSquare className="w-8 h-8 text-[#5e5e5e] dark:text-[#94a3b8] mb-2" />
            <p className="text-xs font-semibold text-[#1c1e21] dark:text-[#f8fafc]">No chats found</p>
            <p className="text-[11px] text-[#5e5e5e] dark:text-[#94a3b8] mt-0.5">
              Start a new conversation with your contacts.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
