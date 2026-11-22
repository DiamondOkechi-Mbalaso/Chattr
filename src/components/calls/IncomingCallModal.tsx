import React, { useEffect, useState } from 'react';
import { Phone, PhoneOff, Video } from 'lucide-react';
import { webrtc, WebRTCState } from '../../services/webrtc';
import { Avatar } from '../common/Avatar';

export const IncomingCallModal: React.FC = () => {
  const [callState, setCallState] = useState<WebRTCState>(webrtc.state);

  useEffect(() => {
    const unsub = webrtc.subscribe((st) => setCallState(st));
    return () => unsub();
  }, []);

  if (callState.status !== 'ringing') return null;

  const caller = callState.caller;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in select-none">
      <div className="relative w-full max-w-sm bg-[#ffffff] dark:bg-[#141923] border border-[#f0f4f9] dark:border-[#1e2638] rounded-[25px] p-6 shadow-2xl flex flex-col items-center text-center animate-slide-up transition-colors">
        {/* Pulsing Avatar with Chattr Orange Wave */}
        <div className="relative mb-5 mt-2">
          <span className="animate-ripple absolute inset-0 rounded-full bg-[#ff6b00]/30" />
          <Avatar
            src={caller?.avatar_url}
            name={caller?.display_name || 'Caller'}
            size="2xl"
            className="relative z-10 ring-4 ring-[#ff6b00]/40 shadow-lg"
          />
        </div>

        <h3 className="text-xl font-bold text-[#111b21] dark:text-[#f8fafc] mb-1">
          {caller?.display_name}
        </h3>
        <p className="text-xs text-[#5e5e5e] dark:text-[#94a3b8] mb-6 flex items-center gap-1.5">
          {callState.callType === 'video' ? (
            <>
              <Video className="w-4 h-4 text-[#ff6b00]" /> Incoming Chattr Video...
            </>
          ) : (
            <>
              <Phone className="w-4 h-4 text-[#ff6b00]" /> Incoming Chattr Voice...
            </>
          )}
        </p>

        {/* Decline & Accept Buttons */}
        <div className="flex items-center justify-center gap-8 w-full mt-2">
          <div className="flex flex-col items-center gap-1.5">
            <button
              onClick={() => webrtc.declineCall()}
              className="p-4 bg-rose-500 hover:bg-rose-600 text-white rounded-full shadow-lg transition-transform transform hover:scale-110 active:scale-95"
              title="Decline"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
            <span className="text-xs text-[#5e5e5e] dark:text-[#94a3b8] font-semibold">Decline</span>
          </div>

          <div className="flex flex-col items-center gap-1.5">
            <button
              onClick={() => webrtc.answerCall()}
              className="p-4 bg-[#ff6b00] hover:bg-[#e65c00] text-white rounded-full shadow-lg shadow-orange-500/30 transition-transform transform hover:scale-110 active:scale-95 animate-bounce"
              title="Accept"
            >
              <Phone className="w-6 h-6" />
            </button>
            <span className="text-xs text-[#ff6b00] font-bold">Accept</span>
          </div>
        </div>
      </div>
    </div>
  );
};
