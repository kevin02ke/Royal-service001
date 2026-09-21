import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  User, 
  Mail, 
  Phone, 
  Share2, 
  ShieldCheck, 
  Copy, 
  Check, 
  Wallet, 
  TrendingUp, 
  ArrowDownCircle, 
  ArrowUpCircle,
  Database,
  Calendar
} from 'lucide-react';
import { UserProfile } from '../types';

interface ProfileViewProps {
  user: UserProfile;
  onOpenDeposit: () => void;
  onOpenWithdraw: () => void;
  onNavigateToPortfolios: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  onOpenDeposit,
  onOpenWithdraw,
  onNavigateToPortfolios,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(user.referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const usdtEquivalent = (user.walletBalanceKES / 130).toFixed(2);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      {/* Profile Card Header */}
      <div className="bg-[#0d1320] border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-emerald-600 flex items-center justify-center text-slate-950 font-black text-2xl shadow-lg">
              {user.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white">{user.name}</h1>
                <span className="text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider">
                  Verified Investor
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{user.email}</p>
              <p className="text-xs text-slate-400 font-mono">{user.phone}</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onOpenDeposit}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition cursor-pointer shadow-sm"
            >
              <ArrowDownCircle className="w-4 h-4" />
              <span>Deposit</span>
            </button>
            <button
              type="button"
              onClick={onOpenWithdraw}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              <ArrowUpCircle className="w-4 h-4" />
              <span>Withdraw</span>
            </button>
          </div>
        </div>
      </div>

      {/* Financial Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#0e1424] border border-slate-800 rounded-2xl p-5">
          <span className="text-xs text-slate-400 font-medium block mb-1">Available Wallet Balance</span>
          <div className="text-2xl font-black text-white font-mono">
            KES {user.walletBalanceKES.toLocaleString()}
          </div>
          <div className="text-xs text-slate-400 font-mono mt-0.5">
            ≈ ${usdtEquivalent} USDT
          </div>
        </div>

        <div className="bg-[#0e1424] border border-slate-800 rounded-2xl p-5">
          <span className="text-xs text-slate-400 font-medium block mb-1">Active Capital Invested</span>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            KES {user.investedCapitalKES.toLocaleString()}
          </div>
          <button
            type="button"
            onClick={onNavigateToPortfolios}
            className="text-xs text-emerald-400 hover:underline mt-1 font-medium inline-block cursor-pointer"
          >
            View Active Portfolios &rarr;
          </button>
        </div>

        <div className="bg-[#0e1424] border border-slate-800 rounded-2xl p-5">
          <span className="text-xs text-slate-400 font-medium block mb-1">Total Lifetime Accruals</span>
          <div className="text-2xl font-black text-amber-400 font-mono">
            KES {user.totalEarningsAccruedKES.toLocaleString()}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            Affiliate: KES {user.totalReferralBonusKES.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Account Details & Security Box */}
      <div className="bg-[#0d1320] border border-slate-800 rounded-2xl p-6 space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Account Credentials & Sponsor Rail</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="bg-[#090d16] p-3.5 rounded-xl border border-slate-800/80 space-y-1">
            <span className="text-slate-400 font-medium block">Unique Referral Code</span>
            <div className="flex items-center justify-between pt-1">
              <span className="font-mono text-sm font-bold text-emerald-400">{user.referralCode}</span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="flex items-center gap-1 text-[11px] px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition cursor-pointer"
              >
                {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedCode ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div className="bg-[#090d16] p-3.5 rounded-xl border border-slate-800/80 space-y-1">
            <span className="text-slate-400 font-medium block">Sponsor / Direct Referrer</span>
            <div className="font-mono text-sm font-bold text-white pt-1">
              {user.referredByCode || 'None (Direct Registration)'}
            </div>
          </div>

          <div className="bg-[#090d16] p-3.5 rounded-xl border border-slate-800/80 space-y-1">
            <span className="text-slate-400 font-medium block">Primary Payout Phone (M-Pesa)</span>
            <div className="font-mono text-sm font-bold text-white pt-1">
              {user.phone}
            </div>
          </div>

          <div className="bg-[#090d16] p-3.5 rounded-xl border border-slate-800/80 space-y-1">
            <span className="text-slate-400 font-medium block">Database Persistence Engine</span>
            <div className="font-mono text-xs font-semibold text-emerald-400 pt-1 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-teal-400" />
              <span>Neon PostgreSQL Serverless</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
