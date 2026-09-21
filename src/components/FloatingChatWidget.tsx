import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { MessageSquare, Headphones, Sparkles } from 'lucide-react';
import { UserProfile } from '../types';
import { chatService } from '../services/chatService';

interface FloatingChatWidgetProps {
  onOpen: () => void;
  user: UserProfile;
}

export const FloatingChatWidget: React.FC<FloatingChatWidgetProps> = ({
  onOpen,
  user,
}) => {
  const [unreadCount, setUnreadCount] = useState<number>(1);

  useEffect(() => {
    let isMounted = true;

    const checkUnread = async () => {
      try {
        const thread = await chatService.getUserThread(user.id);
        if (isMounted) {
          setUnreadCount(thread.unreadCountUser || 0);
        }
      } catch (err) {
        // ignore
      }
    };

    checkUnread();
    const interval = setInterval(checkUnread, 3000);

    const unsubscribe = chatService.subscribe((e) => {
      if (e.detail?.userId === user.id) {
        checkUnread();
      }
    });

    return () => {
      isMounted = false;
      clearInterval(interval);
      unsubscribe();
    };
  }, [user.id]);

  return (
    <div className="fixed bottom-5 right-5 z-40">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onOpen}
        id="btn-floating-chat-concierge"
        aria-label="Open Royal Service Communication Center"
        className="group relative flex items-center gap-2.5 px-3.5 py-2.5 bg-gradient-to-r from-[#121929] to-[#182338] hover:from-[#162137] hover:to-[#1e2e4b] border border-emerald-500/40 hover:border-emerald-400 text-white rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.5)] transition cursor-pointer backdrop-blur-md"
      >
        {/* Glowing aura */}
        <span className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-amber-500 rounded-full blur-xs opacity-40 group-hover:opacity-75 transition duration-300 -z-10" />

        {/* Icon with status dot */}
        <div className="relative">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
            <Headphones className="w-4 h-4" />
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#121929]" />
        </div>

        {/* Label text */}
        <div className="text-left pr-1 hidden sm:block">
          <div className="flex items-center gap-1.5 leading-none">
            <span className="text-xs font-bold text-white tracking-tight">VIP Support</span>
            <Sparkles className="w-3 h-3 text-amber-400" />
          </div>
          <span className="text-[10px] text-emerald-400 font-medium leading-tight">Chat & Voice Notes</span>
        </div>

        {/* Unread badge */}
        {unreadCount > 0 && (
          <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-emerald-500 text-slate-950 font-mono text-[11px] font-black rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse">
            {unreadCount}
          </span>
        )}
      </motion.button>
    </div>
  );
};
