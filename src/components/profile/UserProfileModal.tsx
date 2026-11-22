import React from 'react';
import {
  MessageSquare,
  Phone,
  Video,
  Mail,
  Smartphone,
  Calendar,
} from 'lucide-react';
import { UserProfile } from '../../types';
import { Avatar } from '../common/Avatar';
import { Modal } from '../common/Modal';
import { webrtc } from '../../services/webrtc';

interface UserProfileModalProps {
  user: UserProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onStartChat: (userId: string) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  user,
  isOpen,
  onClose,
  onStartChat,
}) => {
  if (!user) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="sm">
      <div className="-mt-6 -mx-6 mb-4">
        {/* Banner with Warm Chattr Gradient */}
        <div
          className="h-28 w-full bg-cover bg-center bg-gradient-to-r from-[#ffe6d4] via-[#fcf5eb] to-[#ffe6d4] dark:from-[#7c2d12] dark:via-[#141923] dark:to-[#7c2d12] relative transition-colors"
          style={{
            backgroundImage: user.banner_url ? `url(${user.banner_url})` : undefined,
          }}
        />
        {/* Avatar */}
        <div className="px-6 -mt-10 flex justify-between items-end">
          <Avatar
            src={user.avatar_url}
            name={user.display_name}
            size="2xl"
            status={user.status}
            showStatus
            className="ring-4 ring-[#ffffff] dark:ring-[#141923]"
          />
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-[#111b21] dark:text-[#f8fafc]">
            {user.display_name}
          </h2>
          <p className="text-xs text-[#ff6b00] font-semibold">@{user.username}</p>
          {user.status_text && (
            <p className="text-xs text-[#5e5e5e] dark:text-[#94a3b8] mt-1">{user.status_text}</p>
          )}
        </div>

        {user.bio && (
          <div className="p-3.5 bg-[#f0f4f9] dark:bg-[#1e2638] rounded-2xl text-xs text-[#111b21] dark:text-[#f8fafc] leading-relaxed">
            {user.bio}
          </div>
        )}

        <div className="space-y-2 text-xs text-[#5e5e5e] dark:text-[#94a3b8]">
          <div className="flex items-center gap-2.5">
            <Mail className="w-4 h-4 text-[#5e5e5e] dark:text-[#94a3b8]" />
            <span>{user.email}</span>
          </div>
          {user.phone && (
            <div className="flex items-center gap-2.5">
              <Smartphone className="w-4 h-4 text-[#5e5e5e] dark:text-[#94a3b8]" />
              <span>{user.phone}</span>
            </div>
          )}
          <div className="flex items-center gap-2.5">
            <Calendar className="w-4 h-4 text-[#5e5e5e] dark:text-[#94a3b8]" />
            <span>
              Joined{' '}
              {new Date(user.created_at).toLocaleDateString([], {
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </div>
        </div>

        {/* Action Buttons: Chattr Pill Style */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#f0f4f9] dark:border-[#1e2638]">
          <button
            onClick={() => {
              onStartChat(user.id);
              onClose();
            }}
            className="flex items-center justify-center gap-1.5 py-2.5 bg-[#ff6b00] hover:bg-[#e65c00] text-white rounded-[50px] text-xs font-bold shadow-sm shadow-orange-500/25 transition-colors"
          >
            <MessageSquare className="w-4 h-4" /> Message
          </button>
          <button
            onClick={() => {
              webrtc.startCall(user, 'voice');
              onClose();
            }}
            className="flex items-center justify-center gap-1.5 py-2.5 bg-[#f0f4f9] dark:bg-[#1e2638] hover:bg-[#e2e8f0] dark:hover:bg-[#26334d] text-[#111b21] dark:text-[#f8fafc] rounded-[50px] text-xs font-bold transition-colors"
          >
            <Phone className="w-4 h-4" /> Voice
          </button>
          <button
            onClick={() => {
              webrtc.startCall(user, 'video');
              onClose();
            }}
            className="flex items-center justify-center gap-1.5 py-2.5 bg-[#f0f4f9] dark:bg-[#1e2638] hover:bg-[#e2e8f0] dark:hover:bg-[#26334d] text-[#111b21] dark:text-[#f8fafc] rounded-[50px] text-xs font-bold transition-colors"
          >
            <Video className="w-4 h-4" /> Video
          </button>
        </div>
      </div>
    </Modal>
  );
};
