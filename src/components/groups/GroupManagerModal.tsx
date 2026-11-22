import React, { useState } from 'react';
import { Conversation, UserProfile } from '../../types';
import { Avatar } from '../common/Avatar';
import { Modal } from '../common/Modal';
import { storage } from '../../services/storage';
import { useToast } from '../common/Toast';

interface GroupManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupCreated: (newConv: Conversation) => void;
}

export const GroupManagerModal: React.FC<GroupManagerModalProps> = ({
  isOpen,
  onClose,
  onGroupCreated,
}) => {
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const contacts = storage.getContacts();
  const current = storage.getCurrentUser();
  const toast = useToast();

  const toggleUser = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) {
      toast.error('Please enter a group name');
      return;
    }

    const participants: UserProfile[] = [current];
    selectedUserIds.forEach((id) => {
      const c = contacts.find((item) => item.contact_id === id);
      if (c) participants.push(c.contact);
    });

    const newGroup = storage.createConversation({
      type: 'group',
      name: groupName.trim(),
      description: description.trim(),
      avatar_url: `https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=200&auto=format&fit=crop&q=80`,
      participants,
      admins: [current.id],
    });

    toast.success(`Group "${newGroup.name}" created!`);
    onGroupCreated(newGroup);
    onClose();
    setGroupName('');
    setDescription('');
    setSelectedUserIds([]);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Group">
      <form onSubmit={handleCreate} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-[#111b21] dark:text-[#f8fafc] mb-1">
            Group Subject *
          </label>
          <input
            type="text"
            placeholder="Type group subject here..."
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            className="w-full px-4 py-2.5 bg-[#f0f4f9] dark:bg-[#1e2638] text-sm text-[#111b21] dark:text-[#f8fafc] rounded-[50px] border border-transparent focus:outline-none focus:border-[#ff6b00]"
            required
            autoFocus
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[#111b21] dark:text-[#f8fafc] mb-1">
            Description
          </label>
          <textarea
            rows={2}
            placeholder="Group description..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2 bg-[#f0f4f9] dark:bg-[#1e2638] text-xs text-[#111b21] dark:text-[#f8fafc] rounded-2xl border border-transparent focus:outline-none focus:border-[#ff6b00] resize-none"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-[#111b21] dark:text-[#f8fafc]">
              Add Participants ({selectedUserIds.length})
            </label>
            <span className="text-[11px] text-[#5e5e5e] dark:text-[#94a3b8]">
              {contacts.length} contacts
            </span>
          </div>

          <div className="max-h-48 overflow-y-auto space-y-1.5 p-2 bg-[#fcf5eb] dark:bg-[#0c0f14] rounded-2xl border border-[#f0f4f9] dark:border-[#1e2638]">
            {contacts.map((c) => {
              const isSelected = selectedUserIds.includes(c.contact_id);
              return (
                <div
                  key={c.id}
                  onClick={() => toggleUser(c.contact_id)}
                  className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-[#ffe6d4] dark:bg-[#7c2d12] text-[#ff6b00] dark:text-[#ffedd5] font-bold'
                      : 'hover:bg-[#ffffff] dark:hover:bg-[#141923] text-[#111b21] dark:text-[#f8fafc]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Avatar
                      src={c.contact.avatar_url}
                      name={c.contact.display_name}
                      size="sm"
                    />
                    <div>
                      <div className="text-xs font-semibold">{c.contact.display_name}</div>
                      <div className="text-[10px] text-[#5e5e5e] dark:text-[#94a3b8]">@{c.contact.username}</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}}
                    className="rounded accent-[#ff6b00]"
                  />
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-[#f0f4f9] dark:border-[#1e2638]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-[#5e5e5e] dark:text-[#94a3b8] hover:text-[#111b21] dark:hover:text-[#f8fafc]"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 bg-[#ff6b00] hover:bg-[#e65c00] text-white rounded-[50px] text-xs font-bold shadow-sm shadow-orange-500/25"
          >
            Create Group
          </button>
        </div>
      </form>
    </Modal>
  );
};
