import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Search, 
  Send, 
  Mic, 
  Paperclip, 
  CheckCheck, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  RefreshCw, 
  Phone, 
  Mail, 
  Award, 
  Sparkles,
  User,
  Filter
} from 'lucide-react';
import { ChatThread, ChatMessage } from '../types';
import { chatService } from '../services/chatService';
import { VoiceNotePlayer } from './VoiceNotePlayer';
import { VoiceNoteRecorder } from './VoiceNoteRecorder';
import { ImageLightboxModal } from './ImageLightboxModal';

export const AdminCommunicationCenter: React.FC = () => {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'resolved'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [replyText, setReplyText] = useState('');
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; name: string } | null>(null);
  const [adminName, setAdminName] = useState('VIP Support Manager (Assigned #VIP-402)');

  const genericAdminProfiles = [
    'VIP Support Manager (Assigned #VIP-402)',
    'Senior Desk Officer (Assigned #Desk-119)',
    'VIP Concierge Desk (Assigned #VIP-804)',
    'Finance Support Lead (Assigned #Fin-302)'
  ];

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Fetch threads
  const loadThreads = async () => {
    try {
      const data = await chatService.getAllThreads(statusFilter, searchQuery);
      setThreads(data);
      if (!selectedThreadId && data.length > 0) {
        setSelectedThreadId(data[0].id);
      }
    } catch (err) {
      console.warn('Error loading admin threads:', err);
    }
  };

  useEffect(() => {
    loadThreads();
    const interval = setInterval(loadThreads, 3000);
    const unsubscribe = chatService.subscribe(() => {
      loadThreads();
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [statusFilter, searchQuery]);

  // Selected thread
  const currentThread = threads.find(t => t.id === selectedThreadId) || threads[0];

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentThread?.messages]);

  // Mark as read when admin views thread
  useEffect(() => {
    if (currentThread && currentThread.unreadCountAdmin > 0) {
      chatService.markAsRead(currentThread.userId, 'admin');
    }
  }, [selectedThreadId, currentThread?.unreadCountAdmin]);

  // Handle Send Text
  const handleSendAdminReply = async (customText?: string) => {
    const text = customText || replyText.trim();
    if (!text || !currentThread || isSending) return;

    try {
      setIsSending(true);
      setReplyText('');
      await chatService.sendMessage(currentThread.userId, {
        sender: 'admin',
        senderName: adminName,
        text,
      });
      await loadThreads();
    } catch (err) {
      console.error('Failed to send admin message:', err);
    } finally {
      setIsSending(false);
    }
  };

  // Handle Send Voice Note
  const handleSendAdminVoice = async (audioData: string, durationSec: number) => {
    if (!currentThread) return;
    try {
      setIsSending(true);
      setIsRecordingVoice(false);
      await chatService.sendMessage(currentThread.userId, {
        sender: 'admin',
        senderName: adminName,
        voiceNote: { audioData, durationSec },
      });
      await loadThreads();
    } catch (err) {
      console.error('Failed to send admin voice note:', err);
    } finally {
      setIsSending(false);
    }
  };

  // Handle Send Attachment
  const handleFileUpload = async (file: File) => {
    if (!file || !currentThread) return;
    try {
      setIsSending(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const dataUrl = reader.result as string;
        await chatService.sendMessage(currentThread.userId, {
          sender: 'admin',
          senderName: adminName,
          attachment: {
            name: file.name,
            sizeBytes: file.size,
            type: file.type || 'application/octet-stream',
            dataUrl,
          },
        });
        await loadThreads();
        setIsSending(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Failed to upload attachment:', err);
      setIsSending(false);
    }
  };

  const handleStatusChange = async (newStatus: 'active' | 'resolved' | 'escalated') => {
    if (!currentThread) return;
    await chatService.updateStatus(currentThread.userId, newStatus);
    await loadThreads();
  };

  const handleClearChat = async () => {
    if (!currentThread) return;
    if (window.confirm(`Are you sure you want to clear conversation history with ${currentThread.userName}?`)) {
      await chatService.clearThread(currentThread.userId);
      await loadThreads();
    }
  };

  const cannedResponses = [
    'Deposit confirmed! Your account ledger has been credited.',
    'Please provide the 10-character M-Pesa transaction code or screenshot.',
    'Your daily return contract yields accrue every 24 hours for 20 days.',
    'Your withdrawal has been approved and processed via Polygon USDT.',
    'Thank you for reaching out. A senior manager is reviewing your inquiry.',
  ];

  return (
    <div className="bg-[#0d1320] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row h-[750px]">
      {/* LEFT SIDEBAR: THREADS LIST */}
      <div className="w-full md:w-80 lg:w-96 border-r border-slate-800 flex flex-col bg-[#0b0f19] shrink-0">
        {/* Top Header & Search */}
        <div className="p-4 border-b border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-bold text-white tracking-tight">Support Inbox</h3>
            </div>
            <button
              onClick={loadThreads}
              title="Refresh messages"
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search member, phone, text..."
              className="w-full pl-8 pr-3 py-1.5 bg-[#070a12] border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
            />
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1 bg-[#121929] p-1 rounded-xl text-[11px] font-semibold">
            {(['all', 'active', 'resolved'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`flex-1 py-1 rounded-lg capitalize transition cursor-pointer text-center ${
                  statusFilter === tab
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Threads List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-850">
          {threads.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No conversations found.
            </div>
          ) : (
            threads.map((t) => {
              const isSelected = t.id === currentThread?.id;
              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedThreadId(t.id)}
                  className={`p-3.5 transition cursor-pointer flex items-start gap-3 relative ${
                    isSelected
                      ? 'bg-purple-950/20 border-l-4 border-purple-500'
                      : 'hover:bg-slate-900/60'
                  }`}
                >
                  {/* User Avatar */}
                  <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-bold text-xs shrink-0 relative">
                    {t.userName.charAt(0)}
                    {t.unreadCountAdmin > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-mono font-bold flex items-center justify-center">
                        {t.unreadCountAdmin}
                      </span>
                    )}
                  </div>

                  {/* Thread Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <h4 className="text-xs font-bold text-white truncate">{t.userName}</h4>
                      <span className="text-[10px] text-slate-500 font-mono shrink-0">{t.lastMessageTime}</span>
                    </div>

                    <p className="text-[11px] text-slate-400 truncate leading-snug">
                      {t.lastMessageSnippet || 'No messages yet'}
                    </p>

                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] text-slate-500 font-mono">{t.userPhone}</span>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-medium ${
                        t.status === 'resolved'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      }`}>
                        {t.status}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT PANEL: CHAT TRANSCRIPT & ADMIN ACTIONS */}
      {currentThread ? (
        <div className="flex-1 flex flex-col bg-[#0e1424] min-w-0">
          {/* Top Bar with Member Metadata */}
          <div className="p-3.5 bg-[#121929] border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-600/20 text-purple-300 border border-purple-500/30 flex items-center justify-center font-bold text-sm">
                {currentThread.userName.charAt(0)}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">{currentThread.userName}</h3>
                  <span className="text-[10px] bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded-full border border-slate-700">
                    ID: {currentThread.userReferralCode}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-500" />
                    {currentThread.userPhone}
                  </span>
                  <span className="flex items-center gap-1 hidden sm:inline-flex">
                    <Mail className="w-3 h-3 text-slate-500" />
                    {currentThread.userEmail}
                  </span>
                </div>
              </div>
            </div>

            {/* Status changer & Actions */}
            <div className="flex items-center gap-2">
              <select
                value={currentThread.status}
                onChange={(e) => handleStatusChange(e.target.value as any)}
                className="bg-[#0a0e17] border border-slate-700 rounded-xl px-2.5 py-1 text-xs text-slate-200 font-semibold focus:outline-none focus:border-purple-500"
              >
                <option value="active">Status: Active</option>
                <option value="resolved">Status: Resolved</option>
                <option value="escalated">Status: Escalated</option>
              </select>

              <button
                type="button"
                onClick={handleClearChat}
                title="Archive and clear chat history"
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Transcript Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#0a0e17]/50">
            {currentThread.messages.map((msg) => {
              const isAdmin = msg.sender === 'admin';
              const isSystem = msg.sender === 'system';

              if (isSystem) {
                return (
                  <div key={msg.id} className="flex justify-center my-2">
                    <span className="text-[10px] text-slate-400 bg-slate-900 border border-slate-800 rounded-full px-3 py-1">
                      {msg.text}
                    </span>
                  </div>
                );
              }

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}
                >
                  <span className="text-[10px] font-medium text-slate-400 mb-1 px-1">
                    {msg.senderName} • {msg.timestamp}
                  </span>

                  <div className="max-w-[80%] space-y-1.5">
                    {msg.text && (
                      <div
                        className={`p-3 rounded-2xl text-xs leading-relaxed break-words shadow-sm ${
                          isAdmin
                            ? 'bg-gradient-to-r from-purple-700 to-indigo-700 text-white rounded-tr-none'
                            : 'bg-[#151c2e] border border-slate-700/80 text-slate-200 rounded-tl-none'
                        }`}
                      >
                        {msg.text}
                      </div>
                    )}

                    {msg.voiceNote && (
                      <VoiceNotePlayer
                        audioData={msg.voiceNote.audioData}
                        durationSec={msg.voiceNote.durationSec}
                        isUserMessage={!isAdmin}
                      />
                    )}

                    {msg.attachment && (
                      <div
                        className={`p-2.5 rounded-xl border text-xs flex flex-col gap-2 ${
                          isAdmin
                            ? 'bg-purple-950/50 border-purple-500/40 text-purple-100'
                            : 'bg-[#111726] border-slate-700/80 text-slate-200'
                        }`}
                      >
                        {msg.attachment.type.startsWith('image/') && (
                          <div 
                            onClick={() => setLightboxImage({ url: msg.attachment!.dataUrl, name: msg.attachment!.name })}
                            className="relative cursor-pointer rounded-lg overflow-hidden border border-slate-700 max-h-48 group bg-black/40"
                          >
                            <img
                              src={msg.attachment.dataUrl}
                              alt={msg.attachment.name}
                              className="w-full object-cover group-hover:scale-105 transition duration-200"
                            />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[11px] font-semibold">
                              Click to view proof
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between gap-2 pt-0.5">
                          <span className="font-semibold truncate text-[11px] text-white">
                            📎 {msg.attachment.name}
                          </span>
                          <a
                            href={msg.attachment.dataUrl}
                            download={msg.attachment.name}
                            className="text-purple-400 hover:text-purple-300 transition text-[11px] font-semibold"
                          >
                            Download
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            <div ref={messagesEndRef} />
          </div>

          {/* Canned Responses dropdown */}
          <div className="px-3 py-1.5 bg-[#0b0f19] border-t border-slate-800 flex items-center gap-2 overflow-x-auto no-scrollbar">
            <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider shrink-0">
              Quick Reply:
            </span>
            {cannedResponses.map((canned, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendAdminReply(canned)}
                className="text-[11px] text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 px-2.5 py-0.5 rounded-lg border border-slate-700/60 whitespace-nowrap transition cursor-pointer"
              >
                {canned.slice(0, 35)}...
              </button>
            ))}
          </div>

          {/* Admin Reply Console */}
          <div className="p-3 bg-[#111728] border-t border-slate-800 space-y-2">
            {/* Identity Role Bar */}
            <div className="flex items-center justify-between gap-2 text-[11px]">
              <div className="flex items-center gap-1.5 text-slate-400">
                <span className="text-purple-400 font-bold uppercase tracking-wider text-[10px]">Staff Identity:</span>
                <select
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className="bg-[#0b0f19] border border-slate-700/80 rounded-lg px-2 py-1 text-slate-200 text-xs font-semibold focus:outline-none focus:border-purple-500 cursor-pointer"
                >
                  {genericAdminProfiles.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <span className="text-[10px] text-slate-500 hidden sm:inline">
                Anonymized generic desk assigned to member
              </span>
            </div>

            {isRecordingVoice ? (
              <VoiceNoteRecorder
                onSendVoiceNote={handleSendAdminVoice}
                onCancel={() => setIsRecordingVoice(false)}
              />
            ) : (
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf,.doc,.docx,.txt"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSending}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer shrink-0 disabled:opacity-50"
                  title="Upload receipt or document to member"
                >
                  <Paperclip className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setIsRecordingVoice(true)}
                  disabled={isSending}
                  className="p-2 text-slate-400 hover:text-purple-400 hover:bg-purple-950/40 rounded-xl transition cursor-pointer shrink-0 disabled:opacity-50"
                  title="Record Admin Voice Note to member"
                >
                  <Mic className="w-4 h-4" />
                </button>

                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendAdminReply();
                    }
                  }}
                  placeholder={`Reply as ${adminName}...`}
                  disabled={isSending}
                  className="flex-1 px-3.5 py-2 bg-[#0a0e17] border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
                />

                <button
                  type="button"
                  onClick={() => handleSendAdminReply()}
                  disabled={!replyText.trim() || isSending}
                  className="p-2 bg-purple-600 hover:bg-purple-500 text-white disabled:bg-slate-800 disabled:text-slate-600 rounded-xl transition cursor-pointer shrink-0 shadow-sm"
                  title="Send reply"
                >
                  <Send className="w-4 h-4 fill-current" />
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center p-8 text-slate-500 text-xs">
          Select a member conversation from the list to start messaging.
        </div>
      )}

      {/* Lightbox */}
      <ImageLightboxModal
        imageUrl={lightboxImage?.url || null}
        imageName={lightboxImage?.name}
        onClose={() => setLightboxImage(null)}
      />
    </div>
  );
};
