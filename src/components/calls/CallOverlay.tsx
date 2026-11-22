import React, { useEffect, useRef, useState } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  ScreenShare,
  Minimize2,
  Maximize2,
  Lock,
} from 'lucide-react';
import { webrtc, WebRTCState } from '../../services/webrtc';
import { Avatar } from '../common/Avatar';

export const CallOverlay: React.FC = () => {
  const [callState, setCallState] = useState<WebRTCState>(webrtc.state);
  const [isMinimized, setIsMinimized] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const unsub = webrtc.subscribe((st) => {
      setCallState(st);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (localVideoRef.current && callState.localStream) {
      localVideoRef.current.srcObject = callState.localStream;
    }
  }, [callState.localStream, isMinimized, callState.status]);

  useEffect(() => {
    if (remoteVideoRef.current && callState.remoteStream) {
      remoteVideoRef.current.srcObject = callState.remoteStream;
    }
  }, [callState.remoteStream, isMinimized, callState.status]);

  if (callState.status === 'idle' || callState.status === 'ringing') {
    return null;
  }

  const otherUser = callState.recipient || callState.caller;

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50 w-72 bg-[#ffffff] dark:bg-[#141923] border border-[#f0f4f9] dark:border-[#1e2638] rounded-[25px] shadow-xl overflow-hidden animate-slide-up flex flex-col transition-colors">
        <div className="flex items-center justify-between p-3 bg-[#fcf5eb] dark:bg-[#0c0f14] border-b border-[#f0f4f9] dark:border-[#1e2638]">
          <div className="flex items-center gap-2 truncate">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff6b00] animate-pulse" />
            <span className="text-xs font-bold text-[#111b21] dark:text-[#f8fafc] truncate">
              {otherUser?.display_name || 'Call'}
            </span>
            <span className="text-[11px] text-[#5e5e5e] dark:text-[#94a3b8] font-mono">
              {formatDuration(callState.duration)}
            </span>
          </div>
          <button
            onClick={() => setIsMinimized(false)}
            className="p-1 text-[#5e5e5e] dark:text-[#94a3b8] hover:text-[#111b21] dark:hover:text-[#f8fafc] rounded-full"
            title="Maximize"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        {callState.callType === 'video' && (
          <div className="h-36 bg-black relative">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="flex items-center justify-center gap-2 p-2 bg-[#ffffff] dark:bg-[#141923]">
          <button
            onClick={() => webrtc.toggleMute()}
            className={`p-2 rounded-full transition-colors ${
              callState.isMuted ? 'bg-rose-500 text-white' : 'bg-[#f0f4f9] dark:bg-[#1e2638] text-[#111b21] dark:text-[#f8fafc]'
            }`}
          >
            {callState.isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
          <button
            onClick={() => webrtc.endCall()}
            className="p-2 bg-rose-500 hover:bg-rose-600 text-white rounded-full shadow-md"
          >
            <PhoneOff className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#111b21] text-white animate-fade-in select-none">
      {/* Top Header */}
      <div className="h-16 px-6 flex items-center justify-between bg-black/20 border-b border-white/10 backdrop-blur-sm z-20">
        <div className="flex items-center gap-3">
          <Avatar
            src={otherUser?.avatar_url}
            name={otherUser?.display_name || 'User'}
            size="sm"
          />
          <div>
            <div className="text-sm font-bold flex items-center gap-2">
              <span>{otherUser?.display_name}</span>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#ff6b00]">
                <Lock className="w-3 h-3" /> End-to-end encrypted
              </span>
            </div>
            <div className="text-xs text-slate-300 flex items-center gap-2">
              <span className="capitalize">{callState.callType} call</span>
              <span>•</span>
              <span className="font-mono text-[#ff6b00]">
                {callState.status === 'calling'
                  ? 'Calling...'
                  : formatDuration(callState.duration)}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsMinimized(true)}
          className="p-2 text-slate-300 hover:text-white rounded-full hover:bg-white/10 transition-colors"
          title="Minimize"
        >
          <Minimize2 className="w-5 h-5" />
        </button>
      </div>

      {/* Main Stream Area */}
      <div className="flex-1 relative flex items-center justify-center p-4 overflow-hidden bg-gradient-to-b from-[#111b21] via-[#0b141a] to-[#111b21]">
        {callState.callType === 'video' ? (
          <div className="relative w-full h-full max-w-5xl rounded-[25px] overflow-hidden bg-black shadow-xl border border-white/10 flex items-center justify-center">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            {/* Selfie Picture-in-Picture */}
            <div className="absolute bottom-6 right-6 w-48 md:w-60 h-32 md:h-40 rounded-[25px] overflow-hidden shadow-2xl border-2 border-[#ff6b00] bg-slate-900 z-10">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 left-3 px-2 py-0.5 bg-black/60 backdrop-blur-md rounded-full text-[10px] font-semibold text-white">
                You
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center">
            <div className="relative mb-6">
              <span className="animate-ripple absolute inset-0 rounded-full bg-[#ff6b00]/30" />
              <Avatar
                src={otherUser?.avatar_url}
                name={otherUser?.display_name || 'User'}
                size="2xl"
                className="relative z-10 shadow-xl ring-4 ring-[#ff6b00]/40"
              />
            </div>
            <h2 className="text-2xl font-bold text-white mb-1.5">
              {otherUser?.display_name}
            </h2>
            <p className="text-xs text-slate-300 mb-2">
              {callState.status === 'calling' ? 'Calling...' : formatDuration(callState.duration)}
            </p>
          </div>
        )}
      </div>

      {/* Controls Bar */}
      <div className="h-24 px-6 flex items-center justify-center gap-4 bg-black/40 border-t border-white/10 backdrop-blur-md z-20">
        <button
          onClick={() => webrtc.toggleMute()}
          className={`p-4 rounded-full shadow-md transition-all transform hover:scale-105 ${
            callState.isMuted
              ? 'bg-rose-500 text-white'
              : 'bg-white/15 hover:bg-white/25 text-white'
          }`}
          title={callState.isMuted ? 'Unmute' : 'Mute'}
        >
          {callState.isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </button>

        {callState.callType === 'video' && (
          <button
            onClick={() => webrtc.toggleCamera()}
            className={`p-4 rounded-full shadow-md transition-all transform hover:scale-105 ${
              callState.isCameraOff
                ? 'bg-rose-500 text-white'
                : 'bg-white/15 hover:bg-white/25 text-white'
            }`}
            title="Camera"
          >
            {callState.isCameraOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
          </button>
        )}

        {callState.callType === 'video' && (
          <button
            onClick={() => webrtc.toggleScreenShare()}
            className={`p-4 rounded-full shadow-md transition-all transform hover:scale-105 ${
              callState.isScreenSharing
                ? 'bg-[#ff6b00] text-white'
                : 'bg-white/15 hover:bg-white/25 text-white'
            }`}
            title="Screen share"
          >
            <ScreenShare className="w-6 h-6" />
          </button>
        )}

        <button
          onClick={() => webrtc.endCall()}
          className="p-4 bg-rose-500 hover:bg-rose-600 text-white rounded-full shadow-lg transition-all transform hover:scale-105"
          title="End Call"
        >
          <PhoneOff className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};
