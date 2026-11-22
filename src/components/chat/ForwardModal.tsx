import React, { useState } from 'react';
import { Conversation, Message, Contact } from '../../types';
import { Modal } from '../common/Modal';
import { Avatar } from '../common/Avatar';
import { storage } from '../../services/storage';
import { useToast } from '../common/Toast';
import { Send, Search, Check } from 'lucide-react';

interface ForwardModalProps {
  isOpen: boolean;
  message: Message | null;
  onClose: () => void;
  onForwarded?: (targetConvId: string) => void;
}

export const ForwardModal: React.FC<ForwardModalProps> = ({
  isOpen,
  message,
  onClose,
  onForwarded,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConvIds, setSelectedConvIds] = useState<string[]>([]);
  const conversations = storage.getConversations();
  const contacts = storage.getContacts();
  const current = storage.getCurrentUser();
  const toast = useToast();

  if (!message) return null;

  const filteredConversations = conversations.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleSelect = (id: string) => {
    setSelectedConvIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleForward = () => {
    if (selectedConvIds.length === 0) {
      toast.error('Please select at least one conversation');
      return;
    }

    selectedConvIds.forEach((convId) => {
      storage.sendMessage(
        convId,
        message.content,
        message.type,
        message.attachments
      );
    });

    toast.success(`Message forwarded to ${selectedConvIds.length} chat(s)`);
    if (onForwarded && selectedConvIds.length === 1) {
      onForwarded(selectedConvIds[0]);
    }
    setSelectedConvIds([]);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Forward Message" maxWidth="sm">
      <div className="space-y-4">
        {/* Message preview snippet */}
        <div className="p-3 bg-[#f0f4f9] dark:bg-[#1e2638] rounded-2xl text-xs text-[#5e5e5e] dark:text-[#94a3b8] border-l-4 border-[#ff6b00]">
          <span className="font-bold text-[#111b21] dark:text-[#f8fafc] block mb-0.5">
            {message.sender?.display_name || 'Sender'}
          </span>
          <p className="line-clamp-2 italic">
            {message.content || (message.type === 'voice_note' ? '🎤 Voice note' : '📎 Attachment')}
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5e5e5e] dark:text-[#94a3b8]" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#f0f4f9] dark:bg-[#1e2638] text-xs text-[#111b21] dark:text-[#f8fafc] rounded-[50px] border border-transparent focus:outline-none focus:border-[#ff6b00]"
          />
        </div>

        {/* Conversation checklist */}
        <div className="max-h-60 overflow-y-auto space-y-1 pr-1">
          {filteredConversations.map((conv) => {
            const isSelected = selectedConvIds.includes(conv.id);
            return (
              <div
                key={conv.id}
                onClick={() => toggleSelect(conv.id)}
                className={`flex items-center justify-between p-2.5 rounded-2xl cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-[#ffe6d4] dark:bg-[#ff6b00]/20 text-[#ff6b00]'
                    : 'hover:bg-[#f0f4f9] dark:hover:bg-[#1e2638] text-[#111b21] dark:text-[#f8fafc]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar src={conv.avatar_url} name={conv.name} size="sm" />
                  <span className="text-xs font-semibold truncate">{conv.name}</span>
                </div>
                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-[#ff6b00] border-[#ff6b00] text-white'
                      : 'border-[#5e5e5e]/40 dark:border-[#94a3b8]/40'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-[#f0f4f9] dark:border-[#1e2638]">
          <span className="text-xs text-[#5e5e5e] dark:text-[#94a3b8]">
            {selectedConvIds.length} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#5e5e5e] dark:text-[#94a3b8] hover:text-[#111b21] dark:hover:text-[#f8fafc] rounded-[50px]"
            >
              Cancel
            </button>
            <button
              onClick={handleForward}
              disabled={selectedConvIds.length === 0}
              className="px-5 py-2 bg-[#ff6b00] hover:bg-[#e65c00] disabled:opacity-40 text-white text-xs font-bold rounded-[50px] flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Send className="w-3.5 h-3.5" /> Forward
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
