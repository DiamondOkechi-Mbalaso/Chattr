import React, { useState, useEffect } from 'react';
import {
  Plus,
  Eye,
  Trash2,
  X,
  Send,
  Sparkles,
  Camera,
  Type,
} from 'lucide-react';
import { StatusUpdate } from '../../types';
import { Avatar } from '../common/Avatar';
import { Modal } from '../common/Modal';
import { storage } from '../../services/storage';
import { useToast } from '../common/Toast';

const BACKGROUND_GRADIENTS = [
  '#ff6b00',
  '#e65c00',
  'linear-gradient(135deg, #ff6b00, #ff9500)',
  'linear-gradient(135deg, #ff512f, #dd2476)',
  'linear-gradient(135deg, #f59e0b, #d97706)',
  'linear-gradient(135deg, #3b82f6, #06b6d4)',
  '#111b21',
];

export const StatusView: React.FC = () => {
  const [statuses, setStatuses] = useState<StatusUpdate[]>(storage.getStatuses());
  const [activeStatus, setActiveStatus] = useState<StatusUpdate | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [statusMode, setStatusMode] = useState<'text' | 'image'>('text');
  const [textContent, setTextContent] = useState('');
  const [imageContent, setImageContent] = useState('');
  const [caption, setCaption] = useState('');
  const [selectedBg, setSelectedBg] = useState(BACKGROUND_GRADIENTS[0]);
  const [replyText, setReplyText] = useState('');
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const current = storage.getCurrentUser();
  const toast = useToast();

  const myStatuses = statuses.filter((s) => s.user_id === current.id);
  const otherStatuses = statuses.filter((s) => s.user_id !== current.id);

  const groupedOtherStatuses = otherStatuses.reduce<Record<string, StatusUpdate[]>>(
    (acc, s) => {
      acc[s.user_id] = acc[s.user_id] || [];
      acc[s.user_id].push(s);
      return acc;
    },
    {}
  );

  useEffect(() => {
    if (!activeStatus || isPaused) return;

    storage.recordStatusView(activeStatus.id);

    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          handleNextStatus();
          return 0;
        }
        return p + 2;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [activeStatus, isPaused]);

  const handleNextStatus = () => {
    if (!activeStatus) return;
    const currentIdx = statuses.findIndex((s) => s.id === activeStatus.id);
    if (currentIdx < statuses.length - 1) {
      setActiveStatus(statuses[currentIdx + 1]);
      setProgress(0);
    } else {
      setActiveStatus(null);
      setProgress(0);
    }
  };

  const handlePrevStatus = () => {
    if (!activeStatus) return;
    const currentIdx = statuses.findIndex((s) => s.id === activeStatus.id);
    if (currentIdx > 0) {
      setActiveStatus(statuses[currentIdx - 1]);
      setProgress(0);
    }
  };

  const handleCreateStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (statusMode === 'text' && !textContent.trim()) {
      toast.error('Please enter text for your status');
      return;
    }
    if (statusMode === 'image' && !imageContent) {
      toast.error('Please provide an image URL');
      return;
    }

    storage.addStatus({
      user_id: current.id,
      user: current,
      type: statusMode,
      content: statusMode === 'text' ? textContent.trim() : imageContent,
      caption: caption.trim() || undefined,
      background_color: selectedBg,
    });

    setStatuses(storage.getStatuses());
    setIsAddModalOpen(false);
    setTextContent('');
    setImageContent('');
    setCaption('');
    toast.success('Status published for 24 hours!');
  };

  const handleSendReply = () => {
    if (!replyText.trim() || !activeStatus) return;
    const convs = storage.getConversations();
    const existing = convs.find(
      (c) =>
        c.type === 'direct' &&
        c.participants.some((p) => p.id === activeStatus.user_id)
    );

    const targetConvId = existing
      ? existing.id
      : storage.createConversation({
          type: 'direct',
          name: activeStatus.user.display_name,
          avatar_url: activeStatus.user.avatar_url,
          participants: [current, activeStatus.user],
        }).id;

    storage.sendMessage(
      targetConvId,
      `Replying to your status: "${replyText.trim()}"`
    );

    toast.success('Reply sent!');
    setReplyText('');
    setActiveStatus(null);
  };

  const handleDeleteStatus = (id: string) => {
    const updated = statuses.filter((s) => s.id !== id);
    localStorage.setItem('nexus_statuses', JSON.stringify(updated));
    setStatuses(updated);
    toast.success('Status deleted');
    if (activeStatus?.id === id) setActiveStatus(null);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#fcf5eb] dark:bg-[#0c0f14] overflow-hidden select-none transition-colors">
      {/* Header */}
      <div className="h-16 px-6 flex items-center justify-between border-b border-[#f0f4f9] dark:border-[#1e2638] bg-[#ffffff] dark:bg-[#141923] transition-colors">
        <div>
          <h2 className="text-xl font-bold text-[#111b21] dark:text-[#f8fafc]">Status</h2>
          <p className="text-xs text-[#5e5e5e] dark:text-[#94a3b8]">24-hour stories from your contacts</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#ff6b00] hover:bg-[#e65c00] text-white rounded-[50px] text-xs font-bold shadow-sm shadow-orange-500/25 transition-all transform hover:scale-105 active:scale-95"
        >
          <Plus className="w-4 h-4" /> Add Status
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {/* My Status */}
        <div>
          <h3 className="text-xs font-bold text-[#5e5e5e] dark:text-[#94a3b8] uppercase tracking-wider mb-3">
            My Status
          </h3>
          <div className="flex items-center gap-4 p-4 bg-[#ffffff] dark:bg-[#141923] border border-[#f0f4f9] dark:border-[#1e2638] rounded-[25px] shadow-sm transition-colors">
            <div className="relative cursor-pointer" onClick={() => setIsAddModalOpen(true)}>
              <Avatar src={current.avatar_url} name={current.display_name} size="lg" />
              <div className="absolute -bottom-1 -right-1 p-1 bg-[#ff6b00] text-white rounded-full ring-2 ring-[#ffffff] dark:ring-[#141923]">
                <Plus className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="flex-1">
              <div className="font-bold text-sm text-[#111b21] dark:text-[#f8fafc]">{current.display_name}</div>
              <div className="text-xs text-[#5e5e5e] dark:text-[#94a3b8]">
                {myStatuses.length > 0
                  ? `${myStatuses.length} updates published`
                  : 'Tap to add status update'}
              </div>
            </div>
            {myStatuses.length > 0 && (
              <button
                onClick={() => {
                  setActiveStatus(myStatuses[0]);
                  setProgress(0);
                }}
                className="px-4 py-1.5 bg-[#ffe6d4] dark:bg-[#7c2d12] text-[#ff6b00] dark:text-[#ffedd5] text-xs font-bold rounded-[50px] hover:bg-[#ff6b00] hover:text-white transition-colors"
              >
                View ({myStatuses.length})
              </button>
            )}
          </div>
        </div>

        {/* Contacts' Status */}
        <div>
          <h3 className="text-xs font-bold text-[#5e5e5e] dark:text-[#94a3b8] uppercase tracking-wider mb-3">
            Recent Updates
          </h3>

          {Object.keys(groupedOtherStatuses).length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center text-[#5e5e5e] dark:text-[#94a3b8] bg-[#ffffff] dark:bg-[#141923] rounded-[25px] border border-[#f0f4f9] dark:border-[#1e2638] transition-colors">
              <Sparkles className="w-8 h-8 text-[#5e5e5e] dark:text-[#94a3b8] mb-2" />
              <p className="text-sm font-bold text-[#111b21] dark:text-[#f8fafc]">No updates yet</p>
              <p className="text-xs text-[#5e5e5e] dark:text-[#94a3b8] mt-0.5">
                Status updates from your contacts will appear here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {Object.entries(groupedOtherStatuses).map(([userId, userStatuses]) => {
                const firstStatus = userStatuses[0];
                return (
                  <div
                    key={userId}
                    onClick={() => {
                      setActiveStatus(firstStatus);
                      setProgress(0);
                    }}
                    className="p-4 bg-[#ffffff] dark:bg-[#141923] border border-[#f0f4f9] dark:border-[#1e2638] rounded-[25px] shadow-sm hover:shadow-md cursor-pointer transition-all flex items-center gap-3.5"
                  >
                    <div className="p-0.5 rounded-full ring-2 ring-[#ff6b00] ring-offset-2 ring-offset-[#ffffff] dark:ring-offset-[#141923]">
                      <Avatar
                        src={firstStatus.user.avatar_url}
                        name={firstStatus.user.display_name}
                        size="md"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm text-[#111b21] dark:text-[#f8fafc] truncate">
                        {firstStatus.user.display_name}
                      </div>
                      <div className="text-xs text-[#5e5e5e] dark:text-[#94a3b8]">
                        {new Date(firstStatus.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* FULL-SCREEN STORY VIEWER */}
      {activeStatus && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl animate-fade-in"
          onMouseDown={() => setIsPaused(true)}
          onMouseUp={() => setIsPaused(false)}
        >
          <div
            className="relative w-full max-w-md h-full md:h-[90vh] md:rounded-[25px] shadow-2xl flex flex-col overflow-hidden border border-white/10"
            style={{
              background: activeStatus.type === 'text' ? activeStatus.background_color : '#000',
            }}
          >
            {/* Segmented Progress Bar */}
            <div className="absolute top-3 left-4 right-4 z-20 flex gap-1.5">
              <div className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white transition-all duration-100 ease-linear rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Top Bar with User Info & Close */}
            <div className="relative z-20 pt-6 px-4 pb-3 flex items-center justify-between bg-gradient-to-b from-black/70 to-transparent">
              <div className="flex items-center gap-2.5">
                <Avatar
                  src={activeStatus.user.avatar_url}
                  name={activeStatus.user.display_name}
                  size="sm"
                />
                <div>
                  <div className="text-xs font-bold text-white">
                    {activeStatus.user.display_name}
                  </div>
                  <div className="text-[10px] text-slate-300">
                    {new Date(activeStatus.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {activeStatus.user_id === current.id && (
                  <button
                    onClick={() => handleDeleteStatus(activeStatus.id)}
                    className="p-1.5 text-slate-300 hover:text-rose-400 rounded-full hover:bg-white/10 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setActiveStatus(null)}
                  className="p-1.5 text-slate-300 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Tap Zones */}
            <div
              className="absolute inset-y-16 left-0 w-1/3 z-10 cursor-pointer"
              onClick={handlePrevStatus}
            />
            <div
              className="absolute inset-y-16 right-0 w-1/3 z-10 cursor-pointer"
              onClick={handleNextStatus}
            />

            {/* Content */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-text relative">
              {activeStatus.type === 'text' ? (
                <p className="text-xl md:text-2xl font-bold text-white leading-relaxed max-w-sm drop-shadow-md">
                  {activeStatus.content}
                </p>
              ) : (
                <div className="relative w-full h-full flex flex-col items-center justify-center">
                  <img
                    src={activeStatus.content}
                    alt=""
                    className="max-h-full max-w-full object-contain rounded-2xl shadow-xl"
                  />
                  {activeStatus.caption && (
                    <div className="absolute bottom-4 inset-x-4 p-3 bg-black/60 backdrop-blur-md rounded-[50px] text-sm font-medium text-white text-center">
                      {activeStatus.caption}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Bar: Reply or Viewers */}
            <div className="relative z-20 p-4 bg-gradient-to-t from-black/80 to-transparent">
              {activeStatus.user_id === current.id ? (
                <div className="flex items-center justify-between px-2 py-1 text-xs text-slate-200">
                  <span className="flex items-center gap-1.5 font-bold">
                    <Eye className="w-4 h-4 text-[#ff6b00]" />
                    {activeStatus.viewers.length} views
                  </span>
                  <span className="text-[11px] text-slate-300">
                    {activeStatus.viewers.map((v) => v.user.display_name).join(', ') || 'No views yet'}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder={`Reply to ${activeStatus.user.display_name}...`}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
                    className="flex-1 px-4 py-2.5 bg-white/10 text-xs text-white rounded-[50px] border border-white/20 focus:outline-none focus:border-[#ff6b00] placeholder-slate-300"
                  />
                  <button
                    onClick={handleSendReply}
                    className="p-2.5 bg-[#ff6b00] hover:bg-[#e65c00] text-white rounded-full shadow-lg shadow-orange-500/30"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CREATE STATUS MODAL */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Status"
      >
        <form onSubmit={handleCreateStatus} className="space-y-4">
          <div className="flex rounded-[50px] bg-[#f0f4f9] dark:bg-[#1e2638] p-1">
            <button
              type="button"
              onClick={() => setStatusMode('text')}
              className={`flex-1 py-1.5 rounded-[50px] text-xs font-bold flex items-center justify-center gap-2 transition-colors ${
                statusMode === 'text' ? 'bg-[#ff6b00] text-white shadow-sm' : 'text-[#5e5e5e] dark:text-[#94a3b8]'
              }`}
            >
              <Type className="w-4 h-4" /> Text Status
            </button>
            <button
              type="button"
              onClick={() => setStatusMode('image')}
              className={`flex-1 py-1.5 rounded-[50px] text-xs font-bold flex items-center justify-center gap-2 transition-colors ${
                statusMode === 'image' ? 'bg-[#ff6b00] text-white shadow-sm' : 'text-[#5e5e5e] dark:text-[#94a3b8]'
              }`}
            >
              <Camera className="w-4 h-4" /> Photo Status
            </button>
          </div>

          {statusMode === 'text' ? (
            <>
              <div>
                <label className="block text-xs font-bold text-[#111b21] dark:text-[#f8fafc] mb-1">
                  Status Text
                </label>
                <textarea
                  rows={4}
                  placeholder="What's happening? Type a status update..."
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  className="w-full p-4 bg-[#f0f4f9] dark:bg-[#1e2638] text-sm text-[#111b21] dark:text-[#f8fafc] rounded-[25px] border border-transparent focus:outline-none focus:border-[#ff6b00] resize-none font-medium leading-relaxed"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111b21] dark:text-[#f8fafc] mb-2">
                  Background Color
                </label>
                <div className="flex gap-2.5">
                  {BACKGROUND_GRADIENTS.map((bg, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedBg(bg)}
                      style={{ background: bg }}
                      className={`w-7 h-7 rounded-full border-2 transition-transform ${
                        selectedBg === bg ? 'border-[#ff6b00] scale-110 shadow-md ring-2 ring-[#ff6b00]/30' : 'border-transparent'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-xs font-bold text-[#111b21] dark:text-[#f8fafc] mb-1">
                  Photo URL
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={imageContent}
                  onChange={(e) => setImageContent(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#f0f4f9] dark:bg-[#1e2638] text-xs text-[#111b21] dark:text-[#f8fafc] rounded-[50px] border border-transparent focus:outline-none focus:border-[#ff6b00]"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#111b21] dark:text-[#f8fafc] mb-1">
                  Caption (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Add a caption..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#f0f4f9] dark:bg-[#1e2638] text-xs text-[#111b21] dark:text-[#f8fafc] rounded-[50px] border border-transparent focus:outline-none focus:border-[#ff6b00]"
                />
              </div>
            </>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-[#f0f4f9] dark:border-[#1e2638]">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-[#5e5e5e] dark:text-[#94a3b8] hover:text-[#111b21] dark:hover:text-[#f8fafc]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#ff6b00] hover:bg-[#e65c00] text-white rounded-[50px] text-xs font-bold shadow-sm shadow-orange-500/25"
            >
              Post Status
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
