# Chattr 🪐

> A modern, fully functional social messaging platform combining instant communication, crisp voice & video calls, media sharing, and customizable communities.

![Chattr Logo](public/logo.png)

---

## 🌟 Key Features

### 1. 💬 Modern Real-Time Messaging System
- **1-on-1 & Group Chats**: Seamless real-time messaging with instant cross-tab synchronization.
- **Rich Message Types**: Text, Images, Videos, Audio, Documents, System notices, and Voice Notes.
- **Voice Notes**: Browser `MediaRecorder` audio recording with live waveform visualizer, playback preview, and duration timer.
- **Message Interactions**:
  - Emoji reactions with live counts and participant list.
  - Context menu: Reply, Forward, Pin, Star, Copy text, Edit own message, and Delete.
  - Delivery indicators: Sent (✓), Delivered (✓✓), and Read (blue ✓✓).
  - Search within conversation with highlighted results.
  - Pinned messages bar at the top of active chats.
  - Typing indicator animation (*"Elena Vance is typing..."*).

### 2. 📹 WebRTC Voice & Video Calling
- **Native WebRTC Calling**: Encrypted peer-to-peer audio and video communication.
- **Hardware & Synthetic Stream Fallbacks**: High-fidelity animated canvas & audio synthesizers for testing when hardware cameras or microphones are restricted.
- **Call Controls**: Mute/unmute microphone, toggle camera on/off, share screen, switch camera, and minimize to Picture-in-Picture floating tile.
- **Call Ringing & Chimes**: Built-in Web Audio API tone synthesizer (no external audio files required!).
- **Call History**: Complete log of incoming, outgoing, and missed calls with one-click callback.

### 3. 👥 Contacts & Community Management
- **Contact Directory**: Categorize contacts into *Favorites*, *Work*, *Friends*, and *General*.
- **Add Contact by Username**: Search and add registered users without revealing private phone numbers or emails.
- **Profile Cards**: User avatar, custom bio, online status dot, join date, and direct action shortcuts.
- **Group Communities**: Create groups with custom names, avatars, descriptions, member selection, and admin role assignments.

### 4. ✨ Status & Stories (24-Hour Ephemeral Updates)
- **Text & Image Stories**: Share text statuses with customizable vibrant background gradients, or photo statuses with captions.
- **Story Viewer**: Full-screen story viewer with segmented auto-advancing progress bars, tap to skip/rewind, pause on hold, private reply, and view count.

### 5. 🎨 Deep Customisation & Design System
- **Default System Theme**: Automatically adapts in real-time to the operating system's light or dark mode.
- **Theme Modes**: System Theme (Default), Sunlit Light Canvas, and Chattr Dark Slate.
- **Chattr Orange Accent**: Signature vibrant orange (`#ff6b00`) tailored to the glowing planet brand identity.
- **Adjustable Font Scaling**: Small, Medium, Large typography.
- **Privacy Controls**: Granular controls for Last Seen, Online Status, Profile Photo, and Blocked Contacts.
- **Account & Data Export**: Edit profile info, export chat history as JSON, or reset state.

### 6. 🔄 Multi-Account Testing & Cross-Tab Sync
- **1-Click Account Switcher**: Switch instantly between *Alex Rivera*, *Elena Vance*, *Marcus Chen*, and *Sophia Patel*.
- **Multi-Tab Live Interaction**: Open two browser tabs or windows with different accounts to test live WebRTC video/voice calls, chat typing indicators, and message delivery in real time!

---

## 🛠️ Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS v4 + Custom Design Tokens
- **Icons**: Lucide React
- **Audio Engine**: Web Audio API Synthesizers
- **Real-Time Communication**: WebRTC (`RTCPeerConnection`), BroadcastChannel API
- **Database & Backend**: LocalStorage / IndexedDB reactive engine + Full PostgreSQL/Supabase schema (`supabase/schema.sql`)

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+

### Installation & Launch
```bash
# Clone or navigate to the directory
cd nexus-chat

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:5173/` in your browser.

### Building for Production
```bash
npm run build
```
The optimized bundle will be created in the `dist/` directory.

---

## 🗄️ Supabase Deployment (Optional)

The application includes a production-grade PostgreSQL database schema with Row Level Security (RLS), triggers, and realtime publications:
- See [`supabase/schema.sql`](supabase/schema.sql)
- Simply run the script in your Supabase SQL Editor.
- Add your Supabase URL and Anon Key to `.env.local`:
  ```env
  VITE_SUPABASE_URL=https://your-project.supabase.co
  VITE_SUPABASE_ANON_KEY=your-anon-key
  ```
