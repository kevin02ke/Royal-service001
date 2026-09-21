import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Wallet, 
  TrendingUp, 
  Layers, 
  Users, 
  Clock, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  Coins, 
  Calculator, 
  ShieldCheck, 
  Share2, 
  Copy, 
  Check, 
  ExternalLink, 
  Sparkles, 
  Headphones, 
  Award, 
  ChevronRight,
  Zap,
  ArrowRight,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { 
  UserProfile, 
  ActiveInvestment, 
  InvestmentPackage, 
  Transaction, 
  ReferralMember, 
  PlatformSettings 
} from '../types';
import { WEEKLY_SALARY_TIERS } from '../data/defaultData';

interface DashboardViewProps {
  user: UserProfile;
  activeInvestments: ActiveInvestment[];
  packages: InvestmentPackage[];
  transactions: Transaction[];
  referrals: ReferralMember[];
  settings: PlatformSettings;
  onOpenDeposit: () => void;
  onOpenWithdraw: () => void;
  onOpenChat: () => void;
  onNavigate: (tab: string) => void;
  onClaimYield?: (investmentId: string) => void;
  onClaimAll?: () => void;
  onSwitchToAdmin?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  activeInvestments,
  packages,
  transactions,
  referrals,
  settings,
  onOpenDeposit,
  onOpenWithdraw,
  onOpenChat,
  onNavigate,
  onClaimYield,
  onClaimAll,
  onSwitchToAdmin,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Dynamic Invitation URL dynamically bound to current host
  const dynamicOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://royalservices.ke';
  const dynamicInviteUrl = `${dynamicOrigin}?ref=${user.referralCode}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(user.referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(dynamicInviteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Time-aware greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  // Aggregated calculations
  const totalUnclaimedYieldKES = useMemo(() => {
    return activeInvestments.reduce((sum, inv) => sum + (inv.unclaimedYieldKES || 0), 0);
  }, [activeInvestments]);

  const dailyPassiveReturnKES = useMemo(() => {
    return activeInvestments
      .filter(inv => inv.status === 'active')
      .reduce((sum, inv) => sum + (inv.dailyReturnKES || 0), 0);
  }, [activeInvestments]);

  const qualifyingReferralsCount = useMemo(() => {
    return referrals.filter(r => 
      r.status === 'active' && (r.totalDepositedKES > 0 || (r.packageActive && r.packageActive !== 'None'))
    ).length;
  }, [referrals]);

  // Sunday Salary tier detection
  const currentSalaryTier = useMemo(() => {
    let matched = null;
    for (const t of WEEKLY_SALARY_TIERS) {
      if (qualifyingReferralsCount >= t.minReferrals) {
        matched = t;
      }
    }
    return matched;
  }, [qualifyingReferralsCount]);

  const nextSalaryTier = useMemo(() => {
    for (const t of WEEKLY_SALARY_TIERS) {
      if (qualifyingReferralsCount < t.minReferrals) {
        return t;
      }
    }
    return null;
  }, [qualifyingReferralsCount]);

  // Recent 4 transactions
  const recentTransactions = useMemo(() => {
    return transactions.slice(0, 5);
  }, [transactions]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* 1. ADMIN QUICK ACCESS ALERT (Visible if user has admin role) */}
      {user.role === 'admin' && onSwitchToAdmin && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-purple-950/70 via-indigo-950/70 to-[#0d1322] border border-purple-500/40 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm">Royal Administrator Console</span>
                <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-mono font-bold uppercase border border-purple-500/30">
                  Master Access
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Manage user withdrawals, system yield rates, live support desk, and anti-fraud monitoring.
              </p>
            </div>
          </div>
          <button
            type="button"
            id="btn-switch-to-admin-banner"
            onClick={onSwitchToAdmin}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-2 shadow-lg shadow-purple-600/20 shrink-0"
          >
            <span>Open Admin Panel</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      )}

      {/* 2. WELCOME & USER IDENTITY HEADER */}
      <div className="bg-gradient-to-r from-[#0b101c] via-[#0f1729] to-[#080d16] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Active Account</span>
              </span>
              {user.role === 'admin' ? (
                <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs font-mono font-semibold">
                  Administrator
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 text-xs font-medium">
                  VIP Investor
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {greeting}, {user.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
              Welcome to your Royal Services dashboard. Monitor your 20-day yield portfolios, claim daily returns, track affiliate Sunday salaries, and manage instant deposits & withdrawals.
            </p>
          </div>

          {/* Partner Referral Code Box */}
          <div className="bg-[#070b13]/90 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
            <div>
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                Your Partner Code (10% Bonus)
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-mono text-sm font-black text-emerald-400 bg-[#0e1626] px-3 py-1 rounded-lg border border-slate-700">
                  {user.referralCode}
                </span>
                <button
                  type="button"
                  id="dashboard-copy-code-btn"
                  onClick={handleCopyCode}
                  className="p-1.5 rounded-lg bg-[#0e1626] hover:bg-[#16233d] border border-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                  title="Copy Partner Code"
                >
                  {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  id="dashboard-copy-link-btn"
                  onClick={handleCopyLink}
                  className="p-1.5 rounded-lg bg-[#0e1626] hover:bg-[#16233d] border border-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                  title="Copy Invite Link"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1 sm:pt-0 lg:pt-1 border-t sm:border-t-0 lg:border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => onNavigate('referrals')}
                className="text-[11px] text-purple-300 hover:text-purple-200 font-semibold flex items-center gap-1 transition cursor-pointer"
              >
                <span>View Sunday Salary Campaign</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. PRIMARY FINANCIAL KPIS BENTO GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Available Wallet Balance */}
        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-[#0b101b] border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg flex flex-col justify-between space-y-4"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Available Balance
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl sm:text-3xl font-black font-mono text-white">
                KES {user.walletBalanceKES.toLocaleString()}
              </div>
              <span className="text-xs text-slate-400 font-mono mt-0.5 block">
                ≈ ${(user.walletBalanceKES / settings.usdtToKesExchangeRate).toFixed(2)} USDT
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
            <button
              type="button"
              id="kpi-deposit-btn"
              onClick={onOpenDeposit}
              className="py-2 px-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm"
            >
              <ArrowDownCircle className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Deposit</span>
            </button>
            <button
              type="button"
              id="kpi-withdraw-btn"
              onClick={onOpenWithdraw}
              className="py-2 px-3 bg-[#111726] hover:bg-[#162138] text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <ArrowUpCircle className="w-3.5 h-3.5 text-amber-400 stroke-[2.5]" />
              <span>Withdraw</span>
            </button>
          </div>
        </motion.div>

        {/* KPI 2: Active Capital Invested */}
        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-[#0b101b] border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg flex flex-col justify-between space-y-4"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Invested Capital
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl sm:text-3xl font-black font-mono text-white">
                KES {user.investedCapitalKES.toLocaleString()}
              </div>
              <span className="text-xs text-blue-400 font-mono mt-0.5 block font-semibold">
                {activeInvestments.length} Active Portfolio{activeInvestments.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/80">
            <button
              type="button"
              onClick={() => onNavigate('investments')}
              className="w-full py-2 px-3 bg-[#111726] hover:bg-[#162138] text-slate-200 border border-slate-700/80 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <span>View Portfolios</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>

        {/* KPI 3: Daily Return Rate & Accrued Yield */}
        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-[#0b101b] border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg flex flex-col justify-between space-y-4"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Daily Yield Stream
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Coins className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl sm:text-3xl font-black font-mono text-amber-400">
                +KES {dailyPassiveReturnKES.toLocaleString()}
                <span className="text-xs font-sans text-slate-400 font-normal"> /day</span>
              </div>
              <span className="text-xs text-slate-400 font-mono mt-0.5 block">
                Accrued: KES {user.totalEarningsAccruedKES.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/80">
            {totalUnclaimedYieldKES > 0 && onClaimAll ? (
              <button
                type="button"
                onClick={onClaimAll}
                className="w-full py-2 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm"
              >
                <Coins className="w-3.5 h-3.5" />
                <span>Claim All (KES {totalUnclaimedYieldKES.toLocaleString()})</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onNavigate('packages')}
                className="w-full py-2 px-3 bg-[#111726] hover:bg-[#162138] text-slate-300 border border-slate-700/80 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <span>Add More Contracts</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </motion.div>

        {/* KPI 4: Affiliate & Weekly Salary */}
        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-[#0b101b] border border-purple-500/30 hover:border-purple-500/50 rounded-2xl p-5 shadow-lg flex flex-col justify-between space-y-4"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-purple-300 uppercase tracking-wider">
                Sunday Weekly Salary
              </span>
              <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-300">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl sm:text-3xl font-black font-mono text-purple-300">
                KES {(currentSalaryTier ? currentSalaryTier.weeklySalaryKES : 0).toLocaleString()}
                <span className="text-xs font-sans text-slate-400 font-normal"> /wk</span>
              </div>
              <span className="text-xs text-slate-400 font-mono mt-0.5 block">
                {qualifyingReferralsCount} Active Partners ({currentSalaryTier ? currentSalaryTier.tierName : 'Tier 0'})
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/80">
            <button
              type="button"
              onClick={() => onNavigate('referrals')}
              className="w-full py-2 px-3 bg-purple-900/40 hover:bg-purple-900/60 text-purple-200 border border-purple-500/40 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <span>Affiliate Hub</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>

      </div>

      {/* 4. QUICK NAVIGATION & ACTION SHORTCUTS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <button
          type="button"
          onClick={() => onNavigate('packages')}
          className="p-4 bg-[#0b101b] hover:bg-[#101726] border border-slate-800 hover:border-slate-700 rounded-2xl transition cursor-pointer flex flex-col items-center text-center space-y-2 group shadow-md"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 group-hover:bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 transition">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-white group-hover:text-emerald-400 transition">Yield Plans</div>
            <div className="text-[10px] text-slate-400">20-Day Contracts</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('calculator')}
          className="p-4 bg-[#0b101b] hover:bg-[#101726] border border-slate-800 hover:border-slate-700 rounded-2xl transition cursor-pointer flex flex-col items-center text-center space-y-2 group shadow-md"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 group-hover:bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 transition">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-white group-hover:text-blue-400 transition">ROI Calculator</div>
            <div className="text-[10px] text-slate-400">Forecast Profits</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('investments')}
          className="p-4 bg-[#0b101b] hover:bg-[#101726] border border-slate-800 hover:border-slate-700 rounded-2xl transition cursor-pointer flex flex-col items-center text-center space-y-2 group shadow-md"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 group-hover:bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 transition">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-white group-hover:text-amber-400 transition">My Portfolios</div>
            <div className="text-[10px] text-slate-400">{activeInvestments.length} Running</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('referrals')}
          className="p-4 bg-[#0b101b] hover:bg-[#101726] border border-slate-800 hover:border-slate-700 rounded-2xl transition cursor-pointer flex flex-col items-center text-center space-y-2 group shadow-md"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 group-hover:bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 transition">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-white group-hover:text-purple-400 transition">10% Referrals</div>
            <div className="text-[10px] text-slate-400">Sunday Salary</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('history')}
          className="p-4 bg-[#0b101b] hover:bg-[#101726] border border-slate-800 hover:border-slate-700 rounded-2xl transition cursor-pointer flex flex-col items-center text-center space-y-2 group shadow-md"
        >
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 group-hover:bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 transition">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-white group-hover:text-cyan-400 transition">Audit Ledger</div>
            <div className="text-[10px] text-slate-400">Receipts & Logs</div>
          </div>
        </button>

        <button
          type="button"
          onClick={onOpenChat}
          className="p-4 bg-[#0b101b] hover:bg-[#101726] border border-slate-800 hover:border-slate-700 rounded-2xl transition cursor-pointer flex flex-col items-center text-center space-y-2 group shadow-md"
        >
          <div className="w-10 h-10 rounded-xl bg-pink-500/10 group-hover:bg-pink-500/20 border border-pink-500/30 flex items-center justify-center text-pink-400 transition">
            <Headphones className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-white group-hover:text-pink-400 transition">Support Desk</div>
            <div className="text-[10px] text-slate-400">Live VIP Chat</div>
          </div>
        </button>
      </div>

      {/* 5. ACTIVE CONTRACTS SNAPSHOT & FEATURED PLANS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Active Portfolios Overview */}
        <div className="lg:col-span-2 bg-[#0b101b] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-400" />
                Active Yield Portfolios ({activeInvestments.length})
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Daily earnings credited continuously over strictly 20-day contract lifespans
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('investments')}
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition cursor-pointer"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {activeInvestments.length === 0 ? (
            <div className="p-6 bg-[#080d16] rounded-2xl border border-slate-800 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-800/80 flex items-center justify-center text-slate-400 mx-auto">
                <TrendingUp className="w-6 h-6 text-emerald-400" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">No Active Investments Yet</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Start your first 20-day contract to start accumulating automated daily returns in KES or USDT.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('packages')}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition cursor-pointer shadow-md inline-flex items-center gap-1.5"
              >
                <span>Browse Investment Plans</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {activeInvestments.slice(0, 3).map((inv) => {
                const progress = Math.min(100, Math.round((inv.daysElapsed / inv.durationDays) * 100));
                return (
                  <div 
                    key={inv.id}
                    className="p-4 bg-[#080d16] border border-slate-800/90 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">{inv.packageName}</span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-mono font-semibold border border-emerald-500/30">
                          {inv.dailyRoiPercent}% Daily
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                        <span>Invested: KES {inv.amountKES.toLocaleString()}</span>
                        <span>•</span>
                        <span>Daily: +KES {inv.dailyReturnKES.toLocaleString()}</span>
                      </div>
                      
                      {/* Progress bar */}
                      <div className="space-y-1 pt-1 max-w-sm">
                        <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                          <span>Day {inv.daysElapsed} of {inv.durationDays}</span>
                          <span>{progress}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full" 
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 border-t sm:border-t-0 border-slate-800/80 pt-2 sm:pt-0">
                      <div className="text-left sm:text-right">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Harvestable</span>
                        <span className="text-sm font-black font-mono text-emerald-400">
                          KES {(inv.unclaimedYieldKES || 0).toLocaleString()}
                        </span>
                      </div>
                      {onClaimYield && inv.unclaimedYieldKES > 0 && (
                        <button
                          type="button"
                          onClick={() => onClaimYield(inv.id)}
                          className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition cursor-pointer shadow-sm"
                        >
                          Claim
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Col: Sunday Salary Campaign Teaser */}
        <div className="bg-[#0b101b] border border-purple-500/30 rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30">
                <Award className="w-4 h-4" />
              </span>
              <h3 className="font-bold text-white text-base">Royal Weekly Salary</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Maintain active partners and receive structured salary disbursements every Sunday directly to your set M-Pesa or Polygon USDT address.
            </p>

            {/* Current status box */}
            <div className="bg-[#080d16] p-4 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Active Qualifying Partners:</span>
                <span className="font-mono font-bold text-white">{qualifyingReferralsCount}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Current Salary Tier:</span>
                <span className="font-mono font-bold text-purple-300">
                  {currentSalaryTier ? currentSalaryTier.tierName : 'Standard (0/10)'}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Pending Sunday Payout:</span>
                <span className="font-mono font-bold text-emerald-400">
                  KES {(currentSalaryTier ? currentSalaryTier.weeklySalaryKES : 0).toLocaleString()}
                </span>
              </div>

              {nextSalaryTier && (
                <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>
                    Need {nextSalaryTier.minReferrals - qualifyingReferralsCount} more to reach {nextSalaryTier.tierName} (KES {nextSalaryTier.weeklySalaryKES.toLocaleString()}/wk).
                  </span>
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('referrals')}
            className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2"
          >
            <span>Open Salary & 10% Affiliate Hub</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

      {/* 6. RECENT AUDIT LEDGER SNIPPET */}
      <div className="bg-[#0b101b] border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              Recent Transactions & Ledger
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live records of deposits, automated yield distributions, and withdrawals
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('history')}
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition cursor-pointer"
          >
            <span>Full Ledger</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#080d16] text-slate-400 border-b border-slate-800">
                <th className="py-3 px-5 font-semibold">Type</th>
                <th className="py-3 px-5 font-semibold">Reference</th>
                <th className="py-3 px-5 font-semibold">Date & Time</th>
                <th className="py-3 px-5 font-semibold">Channel</th>
                <th className="py-3 px-5 font-semibold">Status</th>
                <th className="py-3 px-5 font-semibold text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {recentTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No transactions recorded yet. Make a deposit or activate a package to get started.
                  </td>
                </tr>
              ) : (
                recentTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-[#111726]/40 transition-colors">
                    <td className="py-3.5 px-5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                        tx.type === 'deposit' 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : tx.type === 'withdrawal' 
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                          : tx.type === 'daily_yield' 
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                          : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                      }`}>
                        {tx.type === 'deposit' ? 'Deposit' : tx.type === 'withdrawal' ? 'Withdrawal' : tx.type === 'daily_yield' ? 'Daily Yield' : tx.type === 'investment' ? 'Investment' : 'Commission'}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 font-mono text-slate-300 font-medium">
                      {tx.reference || tx.id}
                    </td>
                    <td className="py-3.5 px-5 text-slate-400 font-mono text-[11px]">
                      {tx.date}
                    </td>
                    <td className="py-3.5 px-5 uppercase font-medium text-slate-300">
                      {tx.destination || 'M-Pesa / Rail'}
                    </td>
                    <td className="py-3.5 px-5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        tx.status === 'completed' 
                          ? 'bg-emerald-500/10 text-emerald-400' 
                          : tx.status === 'pending' 
                          ? 'bg-amber-500/10 text-amber-400' 
                          : 'bg-rose-500/10 text-rose-400'
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className={`py-3.5 px-5 text-right font-mono font-bold ${
                      tx.type === 'withdrawal' ? 'text-rose-400' : 'text-emerald-400'
                    }`}>
                      {tx.type === 'withdrawal' ? '-' : '+'}KES {tx.amountKES.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
