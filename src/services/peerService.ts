import { Peer, DataConnection, MediaConnection } from 'peerjs';
import { storage } from './storage';
import { webrtc } from './webrtc';
import { Message, UserProfile } from '../types';
import { sounds } from '../utils/sound';

class PeerService {
  private peer: Peer | null = null;
  private connections: Map<string, DataConnection> = new Map();
  private isConnected = false;
  private currentUsername: string = '';

  public init() {
    if (typeof window === 'undefined') return;

    const current = storage.getCurrentUser();
    if (!current || !current.username) return;

    if (this.peer && this.currentUsername === current.username) {
      return;
    }

    if (this.peer) {
      try {
        this.peer.destroy();
      } catch (e) {}
    }

    this.currentUsername = current.username;
    // Format a clean, unique peer ID prefixed with chattr_
    const cleanUser = current.username.toLowerCase().replace(/[^a-z0-9_-]/g, '');
    const peerId = `chattr_${cleanUser}`;

    try {
      this.peer = new Peer(peerId, {
        debug: 1,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478' },
          ],
        },
      });

      this.peer.on('open', (id) => {
        this.isConnected = true;
      });

      this.peer.on('connection', (conn) => {
        this.setupDataConnection(conn);
      });

      this.peer.on('call', (mediaCall) => {
        this.handleIncomingCall(mediaCall);
      });

      this.peer.on('error', (err) => {
        console.warn('PeerJS status/fallback:', err.type);
      });
    } catch (e) {
      console.warn('Peer initialization error:', e);
    }
  }

  private setupDataConnection(conn: DataConnection) {
    conn.on('open', () => {
      this.connections.set(conn.peer, conn);
      // Announce profile to remote peer
      const current = storage.getCurrentUser();
      conn.send({
        type: 'PROFILE_EXCHANGE',
        user: current,
      });
    });

    conn.on('data', (data: any) => {
      this.handleIncomingData(data, conn);
    });

    conn.on('close', () => {
      this.connections.delete(conn.peer);
    });
  }

  private handleIncomingData(data: any, conn: DataConnection) {
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

      case 'CALL_SIGNAL':
        if (data.payload) {
          storage.broadcast(data.payload);
        }
        break;
    }
  }

  private handleIncomingCall(mediaCall: MediaConnection) {
    // MediaCall metadata carries caller user info
    const caller: UserProfile = mediaCall.metadata?.caller || {
      id: 'peer_' + mediaCall.peer,
      username: mediaCall.peer.replace('chattr_', ''),
      display_name: mediaCall.metadata?.callerName || mediaCall.peer.replace('chattr_', ''),
      email: '',
      avatar_url: mediaCall.metadata?.callerAvatar || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200`,
      bio: 'Chattr User',
      status_text: 'Online',
      status: 'online',
      is_online: true,
      last_seen: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    const callType = mediaCall.metadata?.callType || 'voice';

    webrtc.handleIncomingPeerCall(mediaCall, caller, callType);
  }

  public sendMessageToUser(targetUsername: string, message: Message): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this.peer) {
        resolve(false);
        return;
      }

      const cleanTarget = targetUsername.toLowerCase().replace(/[^a-z0-9_-]/g, '');
      const targetPeerId = `chattr_${cleanTarget}`;

      const sendPayload = (conn: DataConnection) => {
        try {
          conn.send({
            type: 'CHAT_MESSAGE',
            message,
            sender: storage.getCurrentUser(),
          });
          resolve(true);
        } catch (e) {
          resolve(false);
        }
      };

      const existing = this.connections.get(targetPeerId);
      if (existing && existing.open) {
        sendPayload(existing);
      } else {
        const conn = this.peer.connect(targetPeerId, { reliable: true });
        this.setupDataConnection(conn);
        conn.on('open', () => {
          sendPayload(conn);
        });
        conn.on('error', () => {
          resolve(false);
        });
        setTimeout(() => resolve(false), 3000);
      }
    });
  }

  public sendTypingToUser(targetUsername: string, isTyping: boolean, conversationId: string) {
    if (!this.peer) return;
    const cleanTarget = targetUsername.toLowerCase().replace(/[^a-z0-9_-]/g, '');
    const targetPeerId = `chattr_${cleanTarget}`;
    const conn = this.connections.get(targetPeerId);
    if (conn && conn.open) {
      conn.send({
        type: isTyping ? 'TYPING_START' : 'TYPING_STOP',
        conversation_id: conversationId,
        sender: storage.getCurrentUser(),
      });
    }
  }

  public startPeerCall(
    targetUsername: string,
    localStream: MediaStream,
    callType: 'voice' | 'video'
  ): MediaConnection | null {
    if (!this.peer) return null;
    const cleanTarget = targetUsername.toLowerCase().replace(/[^a-z0-9_-]/g, '');
    const targetPeerId = `chattr_${cleanTarget}`;
    const current = storage.getCurrentUser();

    try {
      const call = this.peer.call(targetPeerId, localStream, {
        metadata: {
          caller: current,
          callerName: current.display_name,
          callerAvatar: current.avatar_url,
          callType,
        },
      });
      return call;
    } catch (e) {
      console.warn('Call setup error:', e);
      return null;
    }
  }
}

export const peerService = new PeerService();
