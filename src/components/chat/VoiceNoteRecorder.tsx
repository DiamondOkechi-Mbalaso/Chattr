import React, { useState, useRef, useEffect } from 'react';
import { Mic, Trash2, Send, Play, Pause } from 'lucide-react';
import { useToast } from '../common/Toast';

interface VoiceNoteRecorderProps {
  onSend: (audioBlobUrl: string, durationSeconds: number) => void;
  onCancel: () => void;
}

export const VoiceNoteRecorder: React.FC<VoiceNoteRecorderProps> = ({ onSend, onCancel }) => {
  const [isRecording, setIsRecording] = useState(true);
  const [duration, setDuration] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [audioLevels, setAudioLevels] = useState<number[]>([40, 60, 30, 80, 50, 90, 70, 45, 65, 30]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);
  const toast = useToast();

  useEffect(() => {
    startRecording();
    return () => {
      cleanup();
    };
  }, []);

  const cleanup = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
      } catch (e) {}
    }
  };

  const startRecording = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const url = URL.createObjectURL(audioBlob);
          setPreviewUrl(url);
          setIsRecording(false);
        };

        mediaRecorder.start(200);
      } else {
        simulateRecording();
      }
    } catch (err) {
      simulateRecording();
    }

    timerRef.current = window.setInterval(() => {
      setDuration((prev) => prev + 1);
      setAudioLevels((prev) =>
        prev.map(() => Math.floor(Math.random() * 70) + 20)
      );
    }, 1000);
  };

  const simulateRecording = () => {
    setTimeout(() => {
      const mockBlob = new Blob(['mock audio'], { type: 'audio/webm' });
      setPreviewUrl(URL.createObjectURL(mockBlob));
      setIsRecording(false);
    }, 5000);
  };

  const stopAndPreview = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
    } else {
      setIsRecording(false);
      setPreviewUrl('mock');
    }
  };

  const handleSend = () => {
    cleanup();
    const finalUrl = previewUrl || 'mock_voice_note.webm';
    onSend(finalUrl, Math.max(1, duration));
  };

  const handleCancel = () => {
    cleanup();
    onCancel();
  };

  const togglePlayPreview = () => {
    if (!audioPreviewRef.current && previewUrl) {
      audioPreviewRef.current = new Audio(previewUrl);
      audioPreviewRef.current.onended = () => setIsPlayingPreview(false);
    }
    if (audioPreviewRef.current) {
      if (isPlayingPreview) {
        audioPreviewRef.current.pause();
        setIsPlayingPreview(false);
      } else {
        audioPreviewRef.current.play().catch(() => {});
        setIsPlayingPreview(true);
      }
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="flex items-center gap-3 w-full bg-[#ffffff] dark:bg-[#141923] border border-[#f0f4f9] dark:border-[#1e2638] rounded-[50px] p-2 px-4 shadow-sm animate-slide-up transition-colors">
      <button
        onClick={handleCancel}
        className="p-2 text-[#5e5e5e] dark:text-[#94a3b8] hover:text-rose-600 rounded-[50px] transition-colors"
        title="Discard"
      >
        <Trash2 className="w-5 h-5" />
      </button>

      {/* Recording indicator & timer */}
      <div className="flex items-center gap-2">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
        </span>
        <span className="text-sm font-bold text-[#111b21] dark:text-[#f8fafc]">{formatTime(duration)}</span>
      </div>

      {/* Chattr Orange Waveform Visualization */}
      <div className="flex-1 flex items-center justify-center gap-1.5 h-6 px-2 overflow-hidden">
        {audioLevels.map((lvl, idx) => (
          <div
            key={idx}
            className="w-1 bg-[#ff6b00] rounded-full transition-all duration-150"
            style={{ height: `${lvl}%` }}
          />
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {isRecording ? (
          <button
            onClick={stopAndPreview}
            className="px-3.5 py-1 text-xs font-semibold bg-[#f0f4f9] dark:bg-[#1e2638] hover:bg-[#e2e8f0] dark:hover:bg-[#26334d] text-[#111b21] dark:text-[#f8fafc] rounded-[50px] transition-colors"
          >
            Review
          </button>
        ) : (
          <button
            onClick={togglePlayPreview}
            className="p-2 bg-[#ffe6d4] dark:bg-[#7c2d12] text-[#ff6b00] dark:text-[#ff9500] hover:bg-[#ff6b00] hover:text-white rounded-[50px] transition-colors"
            title={isPlayingPreview ? 'Pause' : 'Play'}
          >
            {isPlayingPreview ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
        )}

        <button
          onClick={handleSend}
          className="p-2.5 bg-[#ff6b00] hover:bg-[#e65c00] text-white rounded-[50px] shadow-sm shadow-orange-500/30 transition-all transform hover:scale-105 active:scale-95"
          title="Send voice note"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
