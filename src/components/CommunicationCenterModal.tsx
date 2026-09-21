import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, 
  Send, 
  Paperclip, 
  Mic, 
  X, 
  Minimize2, 
  Maximize2, 
  Headphones, 
  ShieldCheck, 
  CheckCheck, 
  FileText, 
  Download, 
  AlertCircle,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { UserProfile, ChatMessage, ChatThread } from '../types';
import { chatService } from '../services/chatService';
import { VoiceNotePlayer } from './VoiceNotePlayer';
import { VoiceNoteRecorder } from './VoiceNoteRecorder';
import { ImageLightboxModal } from './ImageLightboxModal';

interface CommunicationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
}

export const CommunicationCenterModal: React.FC<CommunicationCenterModalProps> = ({
  isOpen,
  onClose,
  user,
}) => {
  const [thread, setThread] = useState<ChatThread | null>(null);
  const [inputText, setInputText] = useState('');
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; name: string } | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load and subscribe to chat messages
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    const fetchThread = async () => {
      try {
        const data = await chatService.getUserThread(user.id, {
          name: user.name,
          phone: user.phone,
          email: user.email,
          ref: user.referralCode,
        });
        if (isMounted) {
          setThread(data);
          // Auto mark as read by user
          if (data.unreadCountUser > 0) {
            chatService.markAsRead(user.id, 'user');
          }
        }
      } catch (err) {
        console.warn('Failed to load thread:', err);
      }
    };

    fetchThread();

    // Polling interval (2.5s) for live real-time sync with admin
    const interval = setInterval(fetchThread, 2500);

    // Event subscription for immediate local updates
    const unsubscribe = chatService.subscribe((e) => {
      if (e.detail?.userId === user.id) {
        fetchThread();
      }
    });

    return () => {
      isMounted = false;
      clearInterval(interval);
      unsubscribe();
    };
  }, [isOpen, user]);

  // Scroll to bottom whenever messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread?.messages]);

  // Send Text Message
  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputText.trim();
    if (!textToSend || isSending) return;

    try {
      setIsSending(true);
      setInputText('');
      await chatService.sendMessage(user.id, {
        sender: 'user',
        senderName: user.name,
        text: textToSend,
      });

      // Refresh thread
      const updated = await chatService.getUserThread(user.id);
      setThread(updated);
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setIsSending(false);
    }
  };

  // Send Voice Note
  const handleSendVoiceNote = async (audioData: string, durationSec: number) => {
    try {
      setIsSending(true);
      setIsRecordingVoice(false);
      await chatService.sendMessage(user.id, {
        sender: 'user',
        senderName: user.name,
        voiceNote: { audioData, durationSec },
      });

      const updated = await chatService.getUserThread(user.id);
      setThread(updated);
    } catch (err) {
      console.error('Error sending voice note:', err);
    } finally {
      setIsSending(false);
    }
  };

  // Upload File/Image
  const handleFileUpload = async (file: File) => {
    if (!file) return;

    try {
      setIsSending(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const dataUrl = reader.result as string;
        await chatService.sendMessage(user.id, {
          sender: 'user',
          senderName: user.name,
          attachment: {
            name: file.name,
            sizeBytes: file.size,
            type: file.type || 'application/octet-stream',
            dataUrl,
          },
        });

        const updated = await chatService.getUserThread(user.id);
        setThread(updated);
        setIsSending(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Error uploading file:', err);
      setIsSending(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const quickQuestions = [
    'How do 20-day daily payouts work?',
    'Verify my M-Pesa deposit',
    'Polygon USDT payout status',
    'Referral bonus question',
  ];

  // Format sender name so users never see human employee names
  // Always shows 'You' for user messages and generic assigned desk/manager for support
  const formatSenderDisplayName = (msg: ChatMessage) => {
    if (msg.sender === 'user') {
      return 'You';
    }
    if (msg.sender === 'system') {
      return 'System Notice';
    }
    const raw = (msg.senderName || '').trim();
    // If it already follows the official assigned staff format (e.g., 'VIP Support Manager (Assigned #VIP-402)')
    if (raw && raw.includes('(Assigned #')) {
      return raw;
    }
    // Default strict generic assigned identity
    return 'VIP Support Manager (Assigned #VIP-402)';
  };

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-xs"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.95 }}
          transition={{ type: 'spring', damping: 26, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className={`bg-[#0d1322] border border-slate-700/80 shadow-[0_20px_50px_rgba(0,0,0,0.7)] flex flex-col overflow-hidden w-full transition-all duration-200 ${
            isExpanded 
              ? 'sm:w-[750px] sm:h-[85vh] sm:rounded-3xl h-[100vh] rounded-none' 
              : 'sm:w-[440px] sm:h-[620px] sm:rounded-2xl h-[92vh] rounded-t-3xl'
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          {/* Header */}
          <div className="bg-[#111728] border-b border-slate-800 p-3.5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-emerald-400 p-[1.5px] shadow-md">
                  <div className="w-full h-full rounded-full bg-[#0d1322] flex items-center justify-center text-emerald-400">
                    <Headphones className="w-5 h-5" />
                  </div>
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#0d1322]" />
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold text-white tracking-tight">Royal VIP Concierge</h3>
                  <span className="text-[10px] bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    Verified Desk
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Online • Voice, Chat & Files Supported
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-slate-400">
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="hidden sm:inline-flex p-1.5 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
                title={isExpanded ? 'Collapse view' : 'Expand view'}
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 hover:text-white hover:bg-rose-900/40 rounded-lg transition cursor-pointer"
                title="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Drag and drop overlay hint */}
          {dragOver && (
            <div className="absolute inset-0 z-20 bg-emerald-950/80 backdrop-blur-xs flex flex-col items-center justify-center border-2 border-dashed border-emerald-400 p-6 text-center text-emerald-200 pointer-events-none">
              <Paperclip className="w-10 h-10 mb-2 animate-bounce" />
              <p className="font-bold text-sm">Drop your screenshot or receipt file here to send</p>
            </div>
          )}

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#0a0e18]/50">
            {/* Quick Greeting Notice */}
            <div className="text-center py-2">
              <span className="text-[10px] font-medium text-slate-400 bg-slate-900/80 px-3 py-1 rounded-full border border-slate-800">
                End-to-end encrypted session with Member ID #{user.referralCode}
              </span>
            </div>

            {/* Message Bubbles */}
            {thread?.messages.map((msg) => {
              const isUser = msg.sender === 'user';
              const isSystem = msg.sender === 'system';

              if (isSystem) {
                return (
                  <div key={msg.id} className="flex justify-center my-2">
                    <div className="max-w-[85%] text-center text-[11px] text-slate-400 bg-slate-900/60 border border-slate-800/80 rounded-xl px-3 py-1.5">
                      {msg.text}
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  {/* Sender Name */}
                  <span className="text-[10px] font-medium text-slate-400 mb-1 px-1">
                    {formatSenderDisplayName(msg)} • {msg.timestamp}
                  </span>

                  <div className="max-w-[85%] space-y-1.5">
                    {/* Text content */}
                    {msg.text && (
                      <div
                        className={`p-3 rounded-2xl text-xs leading-relaxed break-words shadow-sm ${
                          isUser
                            ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-tr-none'
                            : 'bg-[#141b2d] border border-slate-700/80 text-slate-200 rounded-tl-none'
                        }`}
                      >
                        {msg.text}
                      </div>
                    )}

                    {/* Voice Note */}
                    {msg.voiceNote && (
                      <VoiceNotePlayer
                        audioData={msg.voiceNote.audioData}
                        durationSec={msg.voiceNote.durationSec}
                        isUserMessage={isUser}
                      />
                    )}

                    {/* File Attachment */}
                    {msg.attachment && (
                      <div
                        className={`p-2.5 rounded-xl border text-xs flex flex-col gap-2 ${
                          isUser
                            ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-100'
                            : 'bg-[#111726] border-slate-700/80 text-slate-200'
                        }`}
                      >
                        {/* Image Preview if it's an image */}
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
                              Click to expand
                            </div>
                          </div>
                        )}

                        {/* File Meta row */}
                        <div className="flex items-center justify-between gap-2 pt-0.5">
                          <div className="flex items-center gap-2 truncate">
                            <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                            <div className="truncate">
                              <p className="font-semibold text-white truncate text-[11px]">{msg.attachment.name}</p>
                              <span className="text-[9px] text-slate-400 font-mono">
                                {(msg.attachment.sizeBytes / 1024).toFixed(1)} KB
                              </span>
                            </div>
                          </div>

                          <a
                            href={msg.attachment.dataUrl}
                            download={msg.attachment.name}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 hover:bg-slate-700/60 rounded text-slate-300 hover:text-white transition"
                            title="Download attachment"
                          >
                            <Download className="w-3.5 h-3.5" />
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

          {/* Quick Questions suggestion row */}
          <div className="px-3 py-2 bg-[#0c1220] border-t border-slate-800/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider shrink-0 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              Quick:
            </span>
            {quickQuestions.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(q)}
                className="text-[11px] text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 px-2.5 py-1 rounded-lg border border-slate-700/60 whitespace-nowrap transition cursor-pointer"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input & Voice Recording Area */}
          <div className="p-3 bg-[#111728] border-t border-slate-800">
            {isRecordingVoice ? (
              <VoiceNoteRecorder
                onSendVoiceNote={handleSendVoiceNote}
                onCancel={() => setIsRecordingVoice(false)}
              />
            ) : (
              <div className="flex items-center gap-2">
                {/* Hidden File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf,.doc,.docx,.txt"
                  className="hidden"
                  onChange={handleFileInputChange}
                />

                {/* Attach File Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSending}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer shrink-0 disabled:opacity-50"
                  title="Upload receipt or screenshot"
                >
                  <Paperclip className="w-4 h-4" />
                </button>

                {/* Record Voice Button */}
                <button
                  type="button"
                  onClick={() => setIsRecordingVoice(true)}
                  disabled={isSending}
                  className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-950/40 rounded-xl transition cursor-pointer shrink-0 disabled:opacity-50"
                  title="Record voice note"
                >
                  <Mic className="w-4 h-4" />
                </button>

                {/* Text Input */}
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Type a message or inquiry..."
                  disabled={isSending}
                  className="flex-1 px-3 py-2 bg-[#0a0e17] border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                />

                {/* Send Button */}
                <button
                  type="button"
                  onClick={() => handleSendMessage()}
                  disabled={!inputText.trim() || isSending}
                  className="p-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 disabled:bg-slate-800 disabled:text-slate-600 rounded-xl transition cursor-pointer shrink-0 shadow-sm"
                  title="Send message"
                >
                  <Send className="w-4 h-4 fill-current" />
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Lightbox for clicked image previews */}
      <ImageLightboxModal
        imageUrl={lightboxImage?.url || null}
        imageName={lightboxImage?.name}
        onClose={() => setLightboxImage(null)}
      />
    </>
  );
};
