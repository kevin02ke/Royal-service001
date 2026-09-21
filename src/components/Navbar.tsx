import React from 'react';
import { motion } from 'motion/react';
import { Crown, Menu, Calculator, Headphones, ArrowDownCircle, ArrowUpCircle, Wallet } from 'lucide-react';
import { UserProfile } from '../types';

interface NavbarProps {
  onOpenMenu: () => void;
  onBrandClick?: () => void;
  onOpenChat?: () => void;
  onOpenCalculator?: () => void;
  onOpenDeposit?: () => void;
  onOpenWithdraw?: () => void;
  user?: UserProfile;
  activeTab?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenMenu,
  onBrandClick,
  onOpenChat,
  onOpenCalculator,
  onOpenDeposit,
  onOpenWithdraw,
  user,
  activeTab,
}) => {
  return (
    <header className="bg-[#090D16]/95 backdrop-blur-xl text-white sticky top-0 z-40 border-b border-slate-800/80 shadow-md">
      <div className="w-full px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 w-full">
          
          {/* Left: Hamburger button with 3 horizontal lines & Royal Services Brand */}
          <div className="flex items-center gap-3.5">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              id="btn-hamburger-menu"
              onClick={onOpenMenu}
              aria-label="Open Navigation Menu"
              className="w-10 h-10 rounded-xl bg-[#0f1523] hover:bg-[#151e32] border border-slate-800 hover:border-slate-700 text-slate-200 hover:text-white flex items-center justify-center transition cursor-pointer shadow-sm shrink-0"
            >
              <Menu className="w-5 h-5 stroke-[2.2]" />
            </motion.button>

            {/* Brand: Royal Services */}
            <motion.div 
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={onBrandClick}
              className="flex items-center gap-2.5 cursor-pointer select-none"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-emerald-600 flex items-center justify-center text-slate-950 font-black shadow-sm">
                <Crown className="w-5 h-5 text-slate-950 stroke-[2.5]" />
              </div>
              <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white">
                Royal Services
              </span>
            </motion.div>
          </div>

          {/* Right: Quick Action Buttons (Deposit, Withdraw, Calculator & VIP Support) */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Quick Deposit Button */}
            {onOpenDeposit && (
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                type="button"
                id="btn-navbar-deposit"
                onClick={onOpenDeposit}
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.25)]"
                title="Deposit Funds Instantly via M-Pesa or Crypto"
              >
                <ArrowDownCircle className="w-4 h-4 stroke-[2.5]" />
                <span className="font-extrabold">Deposit</span>
              </motion.button>
            )}

            {/* Quick Withdraw Button */}
            {onOpenWithdraw && (
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                type="button"
                id="btn-navbar-withdraw"
                onClick={onOpenWithdraw}
                className="flex items-center gap-1.5 px-3 py-2 bg-[#121929] hover:bg-[#182238] text-amber-300 hover:text-amber-200 border border-amber-500/40 hover:border-amber-400/60 rounded-xl text-xs font-bold transition cursor-pointer"
                title="Withdraw Yields to M-Pesa"
              >
                <ArrowUpCircle className="w-4 h-4 text-amber-400 stroke-[2.5]" />
                <span className="font-bold hidden xs:inline">Withdraw</span>
              </motion.button>
            )}

            {onOpenCalculator && (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                type="button"
                id="btn-nav-calculator"
                onClick={onOpenCalculator}
                className={`hidden md:flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                  activeTab === 'calculator'
                    ? 'bg-blue-500/20 text-blue-300 border-blue-500/40 shadow-sm'
                    : 'bg-[#0f1523] hover:bg-[#151f33] text-slate-300 hover:text-white border-slate-800'
                }`}
              >
                <Calculator className="w-4 h-4 text-blue-400" />
                <span>Calculator</span>
              </motion.button>
            )}

            {onOpenChat && (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                type="button"
                id="btn-nav-vip-support"
                onClick={onOpenChat}
                className="flex items-center gap-2 px-2.5 sm:px-3 py-2 bg-gradient-to-r from-emerald-500/15 to-emerald-500/10 hover:from-emerald-500/25 hover:to-emerald-500/20 text-emerald-300 hover:text-emerald-200 border border-emerald-500/40 hover:border-emerald-400/70 rounded-xl text-xs font-bold transition cursor-pointer shadow-sm"
              >
                <div className="relative">
                  <Headphones className="w-4 h-4 text-emerald-400" />
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400" />
                </div>
                <div className="text-left hidden lg:block leading-none">
                  <span>VIP Support</span>
                  <span className="block text-[9px] text-emerald-400/80 font-mono mt-0.5">Live Desk</span>
                </div>
              </motion.button>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
