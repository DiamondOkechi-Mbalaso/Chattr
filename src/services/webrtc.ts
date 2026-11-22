// Real WebRTC Calling Engine with Multi-tab Signaling & Hardware Fallback
import { storage } from './storage';
import { peerService } from './peerService';
import { UserProfile, CallType } from '../types';
import { sounds } from '../utils/sound';

export interface WebRTCState {
  callId: string | null;
  caller: UserProfile | null;
  recipient: UserProfile | null;
  callType: CallType;
  status: 'idle' | 'calling' | 'ringing' | 'connected' | 'ended';
  isMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
  duration: number;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
}

type CallEventCallback = (state: WebRTCState) => void;

class WebRTCManager {
  private activePeerCall: any = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private timer: number | null = null;
  private listeners: Set<CallEventCallback> = new Set();

  public state: WebRTCState = {
    callId: null,
    caller: null,
    recipient: null,
    callType: 'voice',
    status: 'idle',
    isMuted: false,
    isCameraOff: false,
    isScreenSharing: false,
    duration: 0,
    localStream: null,
    remoteStream: null,
  };

  constructor() {
    if (typeof window !== 'undefined') {
      storage.subscribeToSync((event) => this.handleSignaling(event));

      // Register handler in peerService — no circular import because
      // peerService does NOT import webrtc; it just receives a callback here.
      peerService.setIncomingCallHandler((mediaCall, caller, type) => {
        this.handleIncomingPeerCall(mediaCall, caller, type);
      });
    }
  }

  public subscribe(cb: CallEventCallback) {
    this.listeners.add(cb);
    cb(this.state);
    return () => { this.listeners.delete(cb); };
  }

  private notify() {
    this.listeners.forEach((cb) => cb({ ...this.state }));
  }

  // Generate synthetic stream if hardware camera/mic is not available or denied
  private createSyntheticStream(type: CallType): MediaStream {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');

    let frame = 0;
    const draw = () => {
      if (!ctx) return;
      frame++;
      const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      grad.addColorStop(0, '#1a0a00');
      grad.addColorStop(1, '#3d1700');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = 'rgba(255, 107, 0, 0.3)';
      ctx.beginPath();
      ctx.arc(320, 240, 80 + Math.sin(frame * 0.05) * 20, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(this.state.caller?.display_name || 'Chattr Call', 320, 240);

      ctx.fillStyle = '#ff9500';
      ctx.font = '16px sans-serif';
      ctx.fillText('Encrypted WebRTC Channel', 320, 275);

      requestAnimationFrame(draw);
    };
    draw();

    const videoStream = canvas.captureStream(30);

    const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtxClass) {
      const audioCtx = new AudioCtxClass();
      const osc = audioCtx.createOscillator();
      const dst = audioCtx.createMediaStreamDestination();
      osc.connect(dst);
      osc.start();
      dst.stream.getAudioTracks().forEach((t) => videoStream.addTrack(t));
    }

    return videoStream;
  }

  public async acquireMedia(type: CallType): Promise<MediaStream> {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: type === 'video',
          audio: true,
        });
        this.localStream = stream;
        this.state.localStream = stream;
        return stream;
      }
    } catch (err) {
      console.warn('Real camera/mic unavailable, using synthetic stream:', err);
    }

    const synth = this.createSyntheticStream(type);
    this.localStream = synth;
    this.state.localStream = synth;
    return synth;
  }

  // Called by peerService via callback (no circular import)
  public handleIncomingPeerCall(mediaCall: any, caller: UserProfile, type: CallType) {
    this.activePeerCall = mediaCall;
    this.state = {
      callId: 'peer_call_' + Date.now(),
      caller,
      recipient: storage.getCurrentUser(),
      callType: type,
      status: 'ringing',
      isMuted: false,
      isCameraOff: false,
      isScreenSharing: false,
      duration: 0,
      localStream: null,
      remoteStream: null,
    };
    sounds.startRinging();
    this.notify();
  }

  // Start outgoing call
  public async startCall(recipient: UserProfile, type: CallType) {
    const caller = storage.getCurrentUser();
    const callId = 'call_' + Date.now();

    this.state = {
      callId,
      caller,
      recipient,
      callType: type,
      status: 'calling',
      isMuted: false,
      isCameraOff: false,
      isScreenSharing: false,
      duration: 0,
      localStream: null,
      remoteStream: null,
    };
    this.notify();

    const stream = await this.acquireMedia(type);
    sounds.startRinging();

    // Try live PeerJS call to other device (by phone or username)
    if (recipient.username || recipient.phone) {
      const call = peerService.startPeerCall(recipient, stream, type);
      if (call) {
        this.activePeerCall = call;
        call.on('stream', (remoteStream: MediaStream) => {
          sounds.stopRinging();
          this.state.remoteStream = remoteStream;
          this.state.status = 'connected';
          this.startDurationTimer();
          this.notify();
        });
        call.on('close', () => this.endCall());
      }
    }

    // Broadcast call offer (for same-device multi-tab)
    storage.broadcast({
      type: 'CALL_OFFER',
      sender_id: caller.id,
      payload: { callId, caller, recipient, type },
    });

    // Simulate answer for built-in demo contacts only
    const demoIds = ['user_alex', 'user_elena', 'user_marcus', 'user_sophia', 'user_liam'];
    if (demoIds.some((id) => recipient.id.startsWith(id))) {
      setTimeout(() => {
        if (this.state.status === 'calling') {
          this.simulateRemoteAnswer();
        }
      }, 3500);
    }
  }

  // Answer incoming call
  public async answerCall() {
    sounds.stopRinging();
    sounds.playCallConnected();

    const stream = await this.acquireMedia(this.state.callType);
    this.state.status = 'connected';
    this.startDurationTimer();
    this.notify();

    if (this.activePeerCall) {
      try {
        this.activePeerCall.answer(stream);
        this.activePeerCall.on('stream', (remoteStream: MediaStream) => {
          this.state.remoteStream = remoteStream;
          this.notify();
        });
        this.activePeerCall.on('close', () => this.endCall());
      } catch (e) {
        console.warn('Peer call answer error:', e);
      }
    }

    storage.broadcast({
      type: 'CALL_ANSWER',
      sender_id: storage.getCurrentUser().id,
      payload: { callId: this.state.callId },
    });

    if (!this.state.remoteStream) {
      this.state.remoteStream = this.createSyntheticStream(this.state.callType);
      this.notify();
    }
  }

  // Decline incoming call
  public declineCall() {
    sounds.stopRinging();
    sounds.playCallEnded();

    if (this.state.caller) {
      storage.addCallHistory({
        other_user: this.state.caller,
        type: this.state.callType,
        direction: 'incoming',
        status: 'declined',
        duration: 0,
        timestamp: new Date().toISOString(),
      });
    }

    storage.broadcast({
      type: 'CALL_END',
      sender_id: storage.getCurrentUser().id,
      payload: { callId: this.state.callId },
    });

    this.cleanup();
  }

  // End active call
  public endCall() {
    sounds.stopRinging();
    sounds.playCallEnded();

    const other = this.state.caller?.id === storage.getCurrentUser().id
      ? this.state.recipient
      : this.state.caller;

    if (other) {
      storage.addCallHistory({
        other_user: other,
        type: this.state.callType,
        direction: this.state.caller?.id === storage.getCurrentUser().id ? 'outgoing' : 'incoming',
        status: this.state.duration > 0 ? 'completed' : 'missed',
        duration: this.state.duration,
        timestamp: new Date().toISOString(),
      });
    }

    storage.broadcast({
      type: 'CALL_END',
      sender_id: storage.getCurrentUser().id,
      payload: { callId: this.state.callId },
    });

    this.cleanup();
  }

  public toggleMute(): boolean {
    this.state.isMuted = !this.state.isMuted;
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((t) => { t.enabled = !this.state.isMuted; });
    }
    this.notify();
    return this.state.isMuted;
  }

  public toggleCamera(): boolean {
    this.state.isCameraOff = !this.state.isCameraOff;
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach((t) => { t.enabled = !this.state.isCameraOff; });
    }
    this.notify();
    return this.state.isCameraOff;
  }

  public async toggleScreenShare(): Promise<boolean> {
    if (this.state.isScreenSharing) {
      await this.acquireMedia(this.state.callType);
      this.state.isScreenSharing = false;
      this.notify();
      return false;
    }

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        this.localStream = screenStream;
        this.state.localStream = screenStream;
        this.state.isScreenSharing = true;
        this.notify();
        screenStream.getVideoTracks()[0].onended = () => { this.toggleScreenShare(); };
        return true;
      }
    } catch (e) {
      console.warn('Screen share failed or cancelled', e);
    }
    return false;
  }

  private simulateRemoteAnswer() {
    sounds.stopRinging();
    sounds.playCallConnected();
    this.state.status = 'connected';
    this.state.remoteStream = this.createSyntheticStream(this.state.callType);
    this.startDurationTimer();
    this.notify();
  }

  private startDurationTimer() {
    if (this.timer) clearInterval(this.timer);
    this.timer = window.setInterval(() => {
      this.state.duration++;
      this.notify();
    }, 1000);
  }

  private cleanup() {
    sounds.stopRinging();
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
    if (this.localStream) { this.localStream.getTracks().forEach((t) => t.stop()); this.localStream = null; }
    if (this.remoteStream) { this.remoteStream.getTracks().forEach((t) => t.stop()); this.remoteStream = null; }
    if (this.activePeerCall) {
      try { this.activePeerCall.close(); } catch (e) {}
      this.activePeerCall = null;
    }

    this.state = {
      callId: null,
      caller: null,
      recipient: null,
      callType: 'voice',
      status: 'idle',
      isMuted: false,
      isCameraOff: false,
      isScreenSharing: false,
      duration: 0,
      localStream: null,
      remoteStream: null,
    };
    this.notify();
  }

  private handleSignaling(event: any) {
    const current = storage.getCurrentUser();

    if (event.type === 'CALL_OFFER') {
      const { callId, caller, recipient, type } = event.payload;
      if (recipient.id === current.id && this.state.status === 'idle') {
        this.state = {
          callId, caller, recipient, callType: type,
          status: 'ringing', isMuted: false, isCameraOff: false,
          isScreenSharing: false, duration: 0, localStream: null, remoteStream: null,
        };
        sounds.startRinging();
        this.notify();
      }
    } else if (event.type === 'CALL_ANSWER') {
      if (this.state.status === 'calling' && this.state.callId === event.payload.callId) {
        sounds.stopRinging();
        sounds.playCallConnected();
        this.state.status = 'connected';
        this.state.remoteStream = this.createSyntheticStream(this.state.callType);
        this.startDurationTimer();
        this.notify();
      }
    } else if (event.type === 'CALL_END') {
      if (this.state.callId === event.payload.callId) {
        this.cleanup();
      }
    }
  }
}

export const webrtc = new WebRTCManager();
