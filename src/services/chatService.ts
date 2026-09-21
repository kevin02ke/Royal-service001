import { ChatThread, ChatMessage } from '../types';

type ChatListener = (event: CustomEvent<{ userId?: string }>) => void;

class ChatServiceClient {
  private listeners: Set<ChatListener> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('chat_update', ((e: CustomEvent) => {
        this.listeners.forEach(fn => fn(e));
      }) as EventListener);
    }
  }

  public subscribe(callback: ChatListener): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notify(userId?: string) {
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('chat_update', { detail: { userId } });
      window.dispatchEvent(event);
    }
  }

  public async getUserThread(
    userId: string, 
    userInfo?: { name?: string; phone?: string; email?: string; ref?: string }
  ): Promise<ChatThread> {
    const params = new URLSearchParams({ userId });
    if (userInfo?.name) params.append('userName', userInfo.name);
    if (userInfo?.email) params.append('userEmail', userInfo.email);

    const res = await fetch(`/api/chat/thread?${params.toString()}`);
    if (!res.ok) {
      throw new Error('Failed to fetch user chat thread');
    }
    return res.json();
  }

  public async getAllThreads(_param1?: any, _param2?: any): Promise<ChatThread[]> {
    const res = await fetch('/api/chat/threads');
    if (!res.ok) {
      throw new Error('Failed to fetch all chat threads');
    }
    return res.json();
  }

  public async sendMessage(
    userId: string, 
    payload: {
      sender: 'user' | 'admin' | 'system';
      senderName: string;
      text?: string;
      voiceNote?: { audioData: string; durationSec: number };
      imageUrl?: string;
      attachment?: { name: string; sizeBytes: number; type: string; dataUrl: string };
    }
  ): Promise<ChatMessage> {
    const res = await fetch('/api/chat/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        sender: payload.sender,
        senderName: payload.senderName,
        text: payload.text,
        audioUrl: payload.voiceNote?.audioData,
        durationSeconds: payload.voiceNote?.durationSec,
        imageUrl: payload.imageUrl || (payload.attachment?.type.startsWith('image/') ? payload.attachment.dataUrl : undefined),
        attachment: payload.attachment,
        isVoiceNote: Boolean(payload.voiceNote),
      }),
    });

    if (!res.ok) {
      throw new Error('Failed to send message');
    }

    const newMsg = await res.json();
    this.notify(userId);
    return newMsg;
  }

  public async markAsRead(userId: string, role: 'user' | 'admin'): Promise<void> {
    try {
      await fetch('/api/chat/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role }),
      });
      this.notify(userId);
    } catch (err) {
      console.warn('Failed to mark chat as read:', err);
    }
  }

  public async updateStatus(userId: string, status: 'active' | 'resolved' | 'escalated'): Promise<void> {
    try {
      await fetch('/api/chat/thread/status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, status }),
      });
      this.notify(userId);
    } catch (err) {
      console.warn('Failed to update thread status:', err);
    }
  }

  public async clearThread(userId: string): Promise<void> {
    try {
      await fetch(`/api/chat/thread/${userId}/clear`, {
        method: 'POST',
      });
      this.notify(userId);
    } catch (err) {
      console.warn('Failed to clear thread:', err);
    }
  }
}

export const chatService = new ChatServiceClient();
