import { Peer, DataConnection, MediaConnection } from 'peerjs';
import { storage } from './storage';
import { Message, UserProfile, CallType } from '../types';

// Callback type — set by webrtc.ts at init time to break the circular dependency
type IncomingCallHandler = (mediaCall: MediaConnection, caller: UserProfile, type: CallType) => void;

class PeerService {
  private peer: Peer | null = null;
  private phonePeer: Peer | null = null;
  private connections: Map<string, DataConnection> = new Map();
  private currentUsername: string = '';
  private currentPhone: string = '';
  private incomingCallHandler: IncomingCallHandler | null = null;

  /** Called once by webrtc.ts so it can handle incoming PeerJS calls without a circular import */
  public setIncomingCallHandler(handler: IncomingCallHandler) {
    this.incomingCallHandler = handler;
  }

  public init() {
    if (typeof window === 'undefined') return;

    const current = storage.getCurrentUser();
    if (!current || !current.username) return;

    const cleanUser = current.username.toLowerCase().replace(/[^a-z0-9_-]/g, '');
    const cleanPhone = current.phone ? current.phone.replace(/[^0-9]/g, '') : '';

    if (this.peer && this.currentUsername === cleanUser && this.currentPhone === cleanPhone) {
      return;
    }

    if (this.peer) {
      try { this.peer.destroy(); } catch (e) {}
      this.peer = null;
    }
    if (this.phonePeer) {
      try { this.phonePeer.destroy(); } catch (e) {}
      this.phonePeer = null;
    }

    this.currentUsername = cleanUser;
    this.currentPhone = cleanPhone;

    // Listen on username: chattr_<cleanUser>
    const peerId = `chattr_${cleanUser}`;
    this.peer = this.createPeerInstance(peerId);

    // Listen on phone number if set: chattr_p_<cleanPhone>
    if (cleanPhone) {
      const phonePeerId = `chattr_p_${cleanPhone}`;
      this.phonePeer = this.createPeerInstance(phonePeerId);
    }
  }

  private createPeerInstance(peerId: string): Peer {
    const p = new Peer(peerId, {
      debug: 1,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' },
        ],
      },
    });

    p.on('open', (id) => {
      console.log('PeerJS active on:', id);
    });

    p.on('connection', (conn) => {
      this.setupDataConnection(conn);
    });

    p.on('call', (mediaCall) => {
      this.handleIncomingCall(mediaCall);
    });

    p.on('error', (err) => {
      console.warn(`PeerJS (${peerId}):`, err.type);
    });

    return p;
  }

  private setupDataConnection(conn: DataConnection) {
    conn.on('open', () => {
      this.connections.set(conn.peer, conn);
      const current = storage.getCurrentUser();
      conn.send({ type: 'PROFILE_EXCHANGE', user: current });
    });

    conn.on('data', (data: any) => {
      this.handleIncomingData(data, conn);
    });

    conn.on('close', () => {
      this.connections.delete(conn.peer);
    });
  }

  private handleIncomingData(data: any, _conn: DataConnection) {
    if (!data || !data.type) return;

    switch (data.type) {
      case 'CHAT_MESSAGE':
        if (data.message && data.sender) {
          storage.receiveRemoteMessage(data.message, data.sender);
        }
        break;

      case 'TYPING_START':
        if (data.sender) {
          storage.broadcast({
            type: 'TYPING_START',
            sender_id: data.sender.id,
            payload: { conversation_id: data.conversation_id },
          });
        }
        break;

      case 'TYPING_STOP':
        if (data.sender) {
          storage.broadcast({
            type: 'TYPING_STOP',
            sender_id: data.sender.id,
            payload: { conversation_id: data.conversation_id },
          });
        }
        break;

      case 'PROFILE_EXCHANGE':
        if (data.user) {
          storage.upsertExternalUser(data.user);
        }
        break;
    }
  }

  private handleIncomingCall(mediaCall: MediaConnection) {
    const caller: UserProfile = mediaCall.metadata?.caller || {
      id: 'peer_' + mediaCall.peer,
      username: mediaCall.peer.replace(/^chattr_(p_)?/, ''),
      display_name: mediaCall.metadata?.callerName || mediaCall.peer.replace(/^chattr_(p_)?/, ''),
      email: '',
      avatar_url:
        mediaCall.metadata?.callerAvatar ||
        `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200`,
      bio: 'Chattr User',
      status_text: 'Online',
      status: 'online',
      is_online: true,
      last_seen: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    const callType: CallType = mediaCall.metadata?.callType || 'voice';

    if (this.incomingCallHandler) {
      this.incomingCallHandler(mediaCall, caller, callType);
    }
  }

  /**
   * Helper to derive all valid Peer IDs for a target user (phone number and username)
   */
  public getTargetPeerIds(target: { username?: string; phone?: string } | string): string[] {
    const ids: string[] = [];
    if (typeof target === 'string') {
      const isPhone = target.startsWith('+') || /^\+?\d[\d\s\-()]{4,}$/.test(target);
      if (isPhone) {
        const digits = target.replace(/[^0-9]/g, '');
        if (digits) ids.push(`chattr_p_${digits}`);
      }
      const cleanTarget = target.toLowerCase().replace(/[^a-z0-9_-]/g, '');
      if (cleanTarget) ids.push(`chattr_${cleanTarget}`);
    } else {
      if (target.phone) {
        const digits = target.phone.replace(/[^0-9]/g, '');
        if (digits) ids.push(`chattr_p_${digits}`);
      }
      if (target.username) {
        const cleanTarget = target.username.toLowerCase().replace(/[^a-z0-9_-]/g, '');
        if (cleanTarget) ids.push(`chattr_${cleanTarget}`);
      }
    }
    return Array.from(new Set(ids));
  }

  public sendMessageToUser(
    target: { username?: string; phone?: string } | string,
    message: Message
  ): Promise<boolean> {
    return new Promise((resolve) => {
      const activePeer = this.peer || this.phonePeer;
      if (!activePeer) {
        resolve(false);
        return;
      }

      const peerIds = this.getTargetPeerIds(target);
      if (peerIds.length === 0) {
        resolve(false);
        return;
      }

      const sendPayload = (conn: DataConnection) => {
        try {
          conn.send({ type: 'CHAT_MESSAGE', message, sender: storage.getCurrentUser() });
          resolve(true);
        } catch (e) {
          resolve(false);
        }
      };

      // Check existing connection
      for (const id of peerIds) {
        const existing = this.connections.get(id);
        if (existing && existing.open) {
          sendPayload(existing);
          return;
        }
      }

      // Connect to the primary target peer
      const primaryId = peerIds[0];
      const conn = activePeer.connect(primaryId, { reliable: true });
      this.setupDataConnection(conn);
      conn.on('open', () => sendPayload(conn));
      conn.on('error', () => resolve(false));
      setTimeout(() => resolve(false), 3500);
    });
  }

  public sendTypingToUser(
    target: { username?: string; phone?: string } | string,
    isTyping: boolean,
    conversationId: string
  ) {
    const peerIds = this.getTargetPeerIds(target);
    for (const id of peerIds) {
      const conn = this.connections.get(id);
      if (conn && conn.open) {
        conn.send({
          type: isTyping ? 'TYPING_START' : 'TYPING_STOP',
          conversation_id: conversationId,
          sender: storage.getCurrentUser(),
        });
      }
    }
  }

  public startPeerCall(
    target: { username?: string; phone?: string } | string,
    localStream: MediaStream,
    callType: 'voice' | 'video'
  ): MediaConnection | null {
    const activePeer = this.peer || this.phonePeer;
    if (!activePeer) return null;

    const peerIds = this.getTargetPeerIds(target);
    if (peerIds.length === 0) return null;

    const primaryId = peerIds[0];
    const current = storage.getCurrentUser();

    try {
      return activePeer.call(primaryId, localStream, {
        metadata: {
          caller: current,
          callerName: current.display_name,
          callerAvatar: current.avatar_url,
          callType,
        },
      });
    } catch (e) {
      console.warn('Peer call setup error:', e);
      return null;
    }
  }
}

export const peerService = new PeerService();
