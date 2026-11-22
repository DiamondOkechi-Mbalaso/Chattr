import React, { useState } from 'react';
import {
  Phone,
  Video,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Trash2,
} from 'lucide-react';
import { CallHistoryRecord } from '../../types';
import { Avatar } from '../common/Avatar';
import { storage } from '../../services/storage';
import { webrtc } from '../../services/webrtc';
import { useToast } from '../common/Toast';

export const CallHistoryView: React.FC = () => {
  const [history, setHistory] = useState<CallHistoryRecord[]>(storage.getCallHistory());
  const [tab, setTab] = useState<'all' | 'missed'>('all');
  const toast = useToast();

  const filtered = history.filter((item) => {
    if (tab === 'missed') return item.status === 'missed';
    return true;
  });

  const handleCallAgain = (item: CallHistoryRecord, type: 'voice' | 'video') => {
    webrtc.startCall(item.other_user, type);
  };

  const handleClear = () => {
    localStorage.removeItem('nexus_call_history');
    setHistory([]);
    toast.success('Call log cleared');
  };

  const formatDuration = (secs: number) => {
    if (secs === 0) return 'Missed';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m > 0 ? `${m}m ` : ''}${s}s`;
  };

  const formatTimestamp = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#fcf5eb] dark:bg-[#0c0f14] overflow-hidden select-none transition-colors">
      {/* Header */}
      <div className="h-16 px-6 flex items-center justify-between border-b border-[#f0f4f9] dark:border-[#1e2638] bg-[#ffffff] dark:bg-[#141923] transition-colors">
        <div>
          <h2 className="text-xl font-bold text-[#111b21] dark:text-[#f8fafc]">Calls</h2>
          <p className="text-xs text-[#5e5e5e] dark:text-[#94a3b8]">Recent call history</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#f0f4f9] dark:bg-[#1e2638] rounded-[50px] p-1">
            <button
              onClick={() => setTab('all')}
              className={`px-4 py-1 rounded-[50px] text-xs font-semibold transition-colors ${
                tab === 'all' ? 'bg-[#ff6b00] text-white shadow-sm' : 'text-[#5e5e5e] dark:text-[#94a3b8] hover:text-[#111b21] dark:hover:text-[#f8fafc]'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setTab('missed')}
              className={`px-4 py-1 rounded-[50px] text-xs font-semibold transition-colors ${
                tab === 'missed' ? 'bg-[#ff6b00] text-white shadow-sm' : 'text-[#5e5e5e] dark:text-[#94a3b8] hover:text-[#111b21] dark:hover:text-[#f8fafc]'
              }`}
            >
              Missed
            </button>
          </div>
          {history.length > 0 && (
            <button
              onClick={handleClear}
              className="p-2 text-[#5e5e5e] dark:text-[#94a3b8] hover:text-rose-600 rounded-[50px] transition-colors"
              title="Clear calls"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-2.5">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center text-[#5e5e5e] dark:text-[#94a3b8]">
            <Phone className="w-10 h-10 text-[#5e5e5e] dark:text-[#94a3b8] mb-3" />
            <p className="text-base font-bold text-[#111b21] dark:text-[#f8fafc]">No call history</p>
            <p className="text-xs text-[#5e5e5e] dark:text-[#94a3b8] mt-1">
              Voice and video calls will appear here.
            </p>
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-4 bg-[#ffffff] dark:bg-[#141923] border border-[#f0f4f9] dark:border-[#1e2638] rounded-[25px] shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3.5">
                <Avatar
                  src={item.other_user.avatar_url}
                  name={item.other_user.display_name}
                  size="md"
                />
                <div>
                  <div className="font-bold text-sm text-[#111b21] dark:text-[#f8fafc] flex items-center gap-2">
                    <span>{item.other_user.display_name}</span>
                    {item.type === 'video' ? (
                      <Video className="w-3.5 h-3.5 text-[#ff6b00]" />
                    ) : (
                      <Phone className="w-3.5 h-3.5 text-[#ff6b00]" />
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-[#5e5e5e] dark:text-[#94a3b8] mt-0.5">
                    {item.status === 'missed' ? (
                      <PhoneMissed className="w-3.5 h-3.5 text-rose-500" />
                    ) : item.direction === 'incoming' ? (
                      <PhoneIncoming className="w-3.5 h-3.5 text-[#ff6b00]" />
                    ) : (
                      <PhoneOutgoing className="w-3.5 h-3.5 text-[#0373e9]" />
                    )}
                    <span className={item.status === 'missed' ? 'text-rose-500 font-bold' : ''}>
                      {formatDuration(item.duration)}
                    </span>
                    <span>•</span>
                    <span>{formatTimestamp(item.timestamp)}</span>
                  </div>
                </div>
              </div>

              {/* Callback Buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleCallAgain(item, 'voice')}
                  className="p-2.5 text-[#1c1e21] hover:bg-[#f0f4f9] rounded-[50px] transition-colors"
                  title="Voice call"
                >
                  <Phone className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleCallAgain(item, 'video')}
                  className="p-2.5 text-[#1c1e21] hover:bg-[#f0f4f9] rounded-[50px] transition-colors"
                  title="Video call"
                >
                  <Video className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
