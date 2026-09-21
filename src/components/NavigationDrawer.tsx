import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard,
  TrendingUp, 
  Layers, 
  Users, 
  Clock, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  Headphones, 
  Sliders, 
  LogOut,
  X,
  Wallet,
  UserCircle,
  CheckCircle2,
  Calculator,
  Terminal
} from 'lucide-react';
import { UserProfile, PlatformSettings } from '../types';

interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isAdminMode: boolean;
  setIsAdminMode: (admin: boolean) => void;
  onOpenDeposit: () => void;
  onOpenWithdraw: () => void;
  onOpenChat?: () => void;
  onLogout: () => void;
  user: UserProfile;
  settings: PlatformSettings;
}

export const NavigationDrawer: React.FC<NavigationDrawerProps> = ({
  isOpen,
  onClose,
  activeTab,
  setActiveTab,
  isAdminMode,
  setIsAdminMode,
  onOpenDeposit,
  onOpenWithdraw,
  onOpenChat,
  onLogout,
  user,
  settings,
}) => {
  if (!isOpen) return null;

  const links = [
    { id: 'dashboard', label: 'User Dashboard', icon: LayoutDashboard },
    { id: 'packages', label: 'Investment Plans', icon: TrendingUp },
    { id: 'calculator', label: 'Profit Calculator', icon: Calculator },
    { id: 'investments', label: 'My Portfolios', icon: Layers },
    { id: 'referrals', label: '3-Tier Network', icon: Users },
    { id: 'history', label: 'Audit Ledger', icon: Clock },
    { id: 'profile', label: 'My Profile', icon: UserCircle },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-start bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <motion.div
        initial={{ x: '-100%' }}
        animate={{ x: 0 }}
        exit={{ x: '-100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 250 }}
        className="w-full max-w-xs bg-[#0b101b] border-r border-slate-800 h-full flex flex-col justify-between shadow-2xl"
      >
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-[#080d17]">
          <div>
            <h3 className="font-extrabold text-sm text-white">Menu & Navigation</h3>
            <p className="text-[11px] text-slate-400">Royal Services Portal</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Investor Profile Summary Box (Clickable to switch directly to Profile) */}
        <div 
          onClick={() => {
            setActiveTab('profile');
            setIsAdminMode(false);
            onClose();
          }}
          className="p-4 bg-[#0e1424] hover:bg-[#131b30] border border-slate-800/80 hover:border-emerald-500/40 mx-4 my-3 rounded-xl space-y-2 cursor-pointer transition"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-400 via-amber-500 to-emerald-600 text-slate-950 font-black flex items-center justify-center text-xs shadow-sm">
              {user.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-bold text-white truncate">{user.name}</div>
              <div className="text-[10px] text-emerald-400 font-mono">{user.referralCode}</div>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400 text-[11px]">Wallet:</span>
            <span className="font-bold text-white">KES {user.walletBalanceKES.toLocaleString()}</span>
          </div>
        </div>

        {/* Links list */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 py-1">
            Investor Views
          </div>
          {links.map((item) => {
            const Icon = item.icon;
            const isSelected = !isAdminMode && activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveTab(item.id);
                  setIsAdminMode(false);
                  onClose();
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition text-left cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${isSelected ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}

          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 pt-4 pb-1">
            Deposit & Withdrawal
          </div>

          <motion.button
            whileHover={{ x: 3 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            id="drawer-deposit-btn"
            onClick={() => {
              onOpenDeposit();
              onClose();
            }}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-200 hover:bg-emerald-500/15 hover:text-emerald-300 border border-transparent hover:border-emerald-500/30 transition text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <ArrowDownCircle className="w-4 h-4 text-emerald-400" />
              <span>Deposit Funds</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
              ⚡ Instant
            </span>
          </motion.button>

          <motion.button
            whileHover={{ x: 3 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            id="drawer-withdraw-btn"
            onClick={() => {
              onOpenWithdraw();
              onClose();
            }}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-200 hover:bg-amber-500/15 hover:text-amber-300 border border-transparent hover:border-amber-500/30 transition text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <ArrowUpCircle className="w-4 h-4 text-amber-400" />
              <span>Withdraw Returns</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30">
              Min KES {settings.minWithdrawalKES ?? 1}
            </span>
          </motion.button>

          {onOpenChat && (
            <motion.button
              whileHover={{ x: 3 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              id="drawer-live-support-btn"
              onClick={() => {
                onOpenChat();
                onClose();
              }}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-200 hover:bg-emerald-500/15 hover:text-emerald-300 border border-transparent hover:border-emerald-500/30 transition text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Headphones className="w-4 h-4 text-emerald-400" />
                <span>Live VIP Support Desk</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Voice & Chat
              </span>
            </motion.button>
          )}

          {/* Administration & Developer - Strictly visible ONLY to admin or support accounts */}
          {(user.role === 'admin' || user.role === 'support') && (
            <>
              <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider px-3 pt-4 pb-1 flex items-center justify-between">
                <span>{user.role === 'admin' ? '👑 Master Administration' : '🎧 Support & Staff Desk'}</span>
                <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 rounded text-[9px] font-mono">
                  {user.role.toUpperCase()}
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('api');
                  setIsAdminMode(false);
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition text-left cursor-pointer ${
                  !isAdminMode && activeTab === 'api'
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span>REST API Console</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                  Live
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsAdminMode(!isAdminMode);
                  onClose();
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition text-left cursor-pointer ${
                  isAdminMode
                    ? 'bg-purple-600/20 text-purple-200 border border-purple-500/40'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <Sliders className="w-4 h-4 text-purple-400" />
                <span>
                  {isAdminMode 
                    ? 'Exit Admin Mode' 
                    : (user.role === 'admin' ? 'Admin Console' : 'Support Desk Panel')}
                </span>
              </button>
            </>
          )}
        </div>

        {/* Drawer Footer / Sign Out */}
        <div className="p-4 border-t border-slate-800 bg-[#080d17]">
          <button
            type="button"
            onClick={() => {
              onLogout();
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-red-950/30 hover:bg-red-900/40 border border-red-500/30 text-red-300 text-xs font-bold transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
