import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Share2, 
  Copy, 
  Check, 
  Network, 
  Award, 
  ArrowUpRight, 
  Layers,
  MessageCircle,
  CheckCircle2, 
  Sparkles,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Wallet,
  Calendar,
  Zap,
  ChevronRight,
  RefreshCw,
  TrendingUp,
  CreditCard,
  Phone,
  Mail,
  PhoneCall,
  Smartphone,
  Send,
  Search,
  Filter,
  X,
  ExternalLink,
  AlertCircle,
  UserCheck,
  BellRing
} from 'lucide-react';
import { ReferralMember, PlatformSettings, UserProfile, CampaignOverview, PendingCommission, WeeklySalaryPayout } from '../types';
import { WEEKLY_SALARY_TIERS } from '../data/defaultData';
import { referralsApi } from '../services/api';

interface ReferralsViewProps {
  user: UserProfile;
  referrals: ReferralMember[];
  settings: PlatformSettings;
  onRefreshUser?: () => void;
}

export const ReferralsView: React.FC<ReferralsViewProps> = ({
  user,
  referrals,
  settings,
  onRefreshUser,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedPitch, setCopiedPitch] = useState(false);
  const [selectedTierFilter, setSelectedTierFilter] = useState<number | 'all'>('all');

  // Local referrals state to allow instant optimistic UI updates on follow-up
  const [localReferrals, setLocalReferrals] = useState<ReferralMember[]>(referrals);
  useEffect(() => {
    setLocalReferrals(referrals);
  }, [referrals]);

  // Contact / Remind to Recharge Console State
  const [contactModalMember, setContactModalMember] = useState<ReferralMember | null>(null);
  const [selectedTemplateIdx, setSelectedTemplateIdx] = useState<number>(0);
  const [customMessage, setCustomMessage] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'active'>('all');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Campaign State
  const [campaignData, setCampaignData] = useState<CampaignOverview | null>(null);
  const [pendingCommissions, setPendingCommissions] = useState<PendingCommission[]>([]);
  const [salaryPayouts, setSalaryPayouts] = useState<WeeklySalaryPayout[]>([]);
  const [isLoadingCampaign, setIsLoadingCampaign] = useState(false);
  const [isProcessingMatured, setIsProcessingMatured] = useState(false);

  // Salary Config Form State
  const [salaryMethod, setSalaryMethod] = useState<'mpesa' | 'crypto'>(
    user.salaryConfig?.method || 'mpesa'
  );
  const [salaryDestination, setSalaryDestination] = useState<string>(
    user.salaryConfig?.destination || user.phone || ''
  );
  const [salaryAccountName, setSalaryAccountName] = useState<string>(
    user.salaryConfig?.accountName || user.name || ''
  );
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [configSuccessMsg, setConfigSuccessMsg] = useState<string | null>(null);
  const [configErrorMsg, setConfigErrorMsg] = useState<string | null>(null);

  // Dynamic Invitation URL: dynamically bound to the current window location host (never hardcoded)
  const dynamicOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://royalservice.ke';
  const dynamicInviteUrl = `${dynamicOrigin}?ref=${user.referralCode}`;
  const invitePitch = `👑 Join my Royal Service investment team! Earn daily returns in KES or USDT with instant automated payouts. Use my referral code: ${user.referralCode} or sign up directly here: ${dynamicInviteUrl}`;

  // Load live campaign overview from server
  const fetchCampaignData = async () => {
    setIsLoadingCampaign(true);
    try {
      const data = await referralsApi.getCampaignOverview(user.id);
      if (data) {
        setCampaignData(data);
        if (data.pendingCommissionsList) {
          setPendingCommissions(data.pendingCommissionsList);
        }
        if (data.pastSalaryPayouts) {
          setSalaryPayouts(data.pastSalaryPayouts);
        }
        if (data.salaryConfig) {
          setSalaryMethod(data.salaryConfig.method);
          setSalaryDestination(data.salaryConfig.destination || user.phone || '');
          if (data.salaryConfig.accountName) {
            setSalaryAccountName(data.salaryConfig.accountName);
          }
        }
      }
    } catch (err) {
      console.warn('Could not fetch server campaign overview:', err);
    } finally {
      setIsLoadingCampaign(false);
    }
  };

  useEffect(() => {
    fetchCampaignData();
  }, [user.id]);

  // Copy handlers
  const handleCopyLink = () => {
    navigator.clipboard.writeText(dynamicInviteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(user.referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyPitch = () => {
    navigator.clipboard.writeText(invitePitch);
    setCopiedPitch(true);
    setTimeout(() => setCopiedPitch(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(invitePitch)}`;
    window.open(url, '_blank');
  };

  // Save Salary Payout Destination
  const handleSaveSalaryConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfigSuccessMsg(null);
    setConfigErrorMsg(null);

    if (!salaryDestination.trim()) {
      setConfigErrorMsg('Please provide a valid M-Pesa phone or Polygon USDT address.');
      return;
    }

    if (salaryMethod === 'mpesa') {
      const digits = salaryDestination.replace(/[^0-9]/g, '');
      if (digits.length < 9 || digits.length > 13) {
        setConfigErrorMsg('Invalid Safaricom M-Pesa phone number format.');
        return;
      }
    } else if (salaryMethod === 'crypto') {
      if (!salaryDestination.trim().startsWith('0x') || salaryDestination.trim().length !== 42) {
        setConfigErrorMsg('Invalid Polygon USDT address. Must be a valid 42-character EVM hex address (0x...).');
        return;
      }
    }

    setIsSavingConfig(true);
    try {
      const res = await referralsApi.saveSalaryConfig({
        userId: user.id,
        method: salaryMethod,
        destination: salaryDestination.trim(),
        accountName: salaryAccountName.trim() || undefined,
      });

      setConfigSuccessMsg(res.message || 'Automated Sunday salary destination updated successfully.');
      if (onRefreshUser) onRefreshUser();
      fetchCampaignData();
    } catch (err: any) {
      setConfigErrorMsg(err.message || 'Failed to save salary destination.');
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Release matured 72h commissions
  const handleReleaseMatured = async () => {
    setIsProcessingMatured(true);
    try {
      const res = await referralsApi.processMaturedCommissions();
      if (res.releasedCount > 0) {
        setConfigSuccessMsg(`Successfully credited KES ${res.releasedAmountKES.toLocaleString()} from ${res.releasedCount} matured referral rewards to your normal balance.`);
        if (onRefreshUser) onRefreshUser();
        fetchCampaignData();
      } else {
        setConfigSuccessMsg('All active 10% commissions are currently within their 72-hour fraud protection period.');
      }
    } catch (err: any) {
      console.warn('Error releasing matured commissions:', err);
    } finally {
      setIsProcessingMatured(false);
    }
  };

  // Calculations for Downline & Tiers
  const tier1Members = localReferrals.filter(r => r.tier === 1);
  const tier2Members = localReferrals.filter(r => r.tier === 2);
  const tier3Members = localReferrals.filter(r => r.tier === 3);

  const tier1Commission = tier1Members.reduce((sum, r) => sum + r.commissionEarnedKES, 0);
  const tier2Commission = tier2Members.reduce((sum, r) => sum + r.commissionEarnedKES, 0);
  const tier3Commission = tier3Members.reduce((sum, r) => sum + r.commissionEarnedKES, 0);

  // Recharge status counts for follow-ups
  const pendingRechargeCount = useMemo(() => {
    return localReferrals.filter(r => r.totalDepositedKES === 0).length;
  }, [localReferrals]);

  const activeRechargeCount = useMemo(() => {
    return localReferrals.filter(r => r.totalDepositedKES > 0).length;
  }, [localReferrals]);

  // Kenyan Phone cleaning & formatting utilities
  const cleanKenyanPhone = (phone?: string): string => {
    if (!phone) return '';
    const digits = phone.replace(/[^0-9]/g, '');
    if (digits.startsWith('254') && digits.length === 12) {
      return digits;
    }
    if ((digits.startsWith('07') || digits.startsWith('01')) && digits.length === 10) {
      return '254' + digits.substring(1);
    }
    if ((digits.startsWith('7') || digits.startsWith('1')) && digits.length === 9) {
      return '254' + digits;
    }
    return digits;
  };

  const formatKenyanPhone = (phone?: string): string => {
    if (!phone) return 'Not Provided';
    const cleaned = cleanKenyanPhone(phone);
    if (cleaned.startsWith('254') && cleaned.length === 12) {
      return `+254 ${cleaned.substring(3, 6)} ${cleaned.substring(6, 9)} ${cleaned.substring(9)}`;
    }
    if (phone.startsWith('07') || phone.startsWith('01')) {
      return `${phone.substring(0, 4)} ${phone.substring(4, 7)} ${phone.substring(7)}`;
    }
    return phone;
  };

  const getWhatsAppUrl = (phone?: string, text?: string): string => {
    const clean = cleanKenyanPhone(phone);
    return `https://wa.me/${clean}?text=${encodeURIComponent(text || '')}`;
  };

  const getSmsUrl = (phone?: string, text?: string): string => {
    const clean = cleanKenyanPhone(phone);
    return `sms:+${clean}?body=${encodeURIComponent(text || '')}`;
  };

  const getTelUrl = (phone?: string): string => {
    const clean = cleanKenyanPhone(phone);
    return `tel:+${clean}`;
  };

  const getEmailUrl = (email?: string, name?: string, text?: string): string => {
    if (!email) return '#';
    const subject = `Royal Services: Complete Your Account Recharge, ${name || 'Partner'}`;
    return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text || '')}`;
  };

  // 3 Smart Kenyan Recharge Follow-up Templates
  const getReminderTemplates = (member: ReferralMember) => [
    {
      id: 'activate_roi',
      title: '⚡ Activate First Deposit & Daily ROI',
      tag: 'Recommended',
      text: `Hi ${member.name}! 👋 I noticed you registered on Royal Services using my invite link, but your contract is still pending.\n\nRecharge your account today from just KES 1,000 to start receiving guaranteed daily payouts straight to your M-Pesa or USDT balance every 24 hours!\n\nNeed help with making the deposit? Let me know and I will guide you through it! 🚀`
    },
    {
      id: 'mpesa_guide',
      title: '📱 Easy M-Pesa STK Push Instructions',
      tag: 'Step-by-Step',
      text: `Hi ${member.name}! Here is how quick it is to recharge your Royal Services account:\n\n1️⃣ Sign in to your Royal Services dashboard\n2️⃣ Click "Deposit Funds"\n3️⃣ Enter your Safaricom M-Pesa number & amount\n4️⃣ Enter your M-Pesa PIN on the prompt on your phone!\n\nYour capital activates immediately and starts earning daily yields. Let's make profits together!`
    },
    {
      id: 'sunday_salary',
      title: '👑 Weekly Team Bonus & Sunday Salary',
      tag: 'Sunday Salary',
      text: `Hi ${member.name}! Did you know that active partners on Royal Services qualify for weekly Sunday salaries in addition to daily investment returns?\n\nActivate your investment package today so our team reaches the next weekly salary milestone! Feel free to call or reply here if you have any questions.`
    }
  ];

  const handleOpenContactModal = (member: ReferralMember) => {
    setContactModalMember(member);
    setSelectedTemplateIdx(0);
    const templates = getReminderTemplates(member);
    setCustomMessage(templates[0].text);
  };

  const handleRecordReminder = async (memberId: string, actionDesc: string) => {
    try {
      await referralsApi.recordReminder(memberId);
      const now = new Date().toISOString();
      setLocalReferrals(prev => prev.map(m => m.id === memberId ? {
        ...m,
        lastContactedDate: now,
        reminderCount: (m.reminderCount || 0) + 1
      } : m));
      setActionFeedback(`✓ ${actionDesc}! Recorded in follow-up history.`);
      setTimeout(() => setActionFeedback(null), 3500);
    } catch {
      setActionFeedback(`✓ ${actionDesc}!`);
      setTimeout(() => setActionFeedback(null), 3000);
    }
  };

  const handleCopyText = (text: string, fieldKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Qualifying active partners (Strict Anti-Fraud: Must have funded or have active package)
  const qualifyingReferrals = localReferrals.filter(r => 
    r.status === 'active' && (r.totalDepositedKES > 0 || (r.packageActive && r.packageActive !== 'None' && r.packageActive !== 'Pending Deposit'))
  );
  const qualifyingCount = campaignData?.qualifyingReferralsCount ?? qualifyingReferrals.length;

  // Resolve current & next salary tier
  const currentTier = useMemo(() => {
    let matched = null;
    for (const t of WEEKLY_SALARY_TIERS) {
      if (qualifyingCount >= t.minReferrals) {
        matched = t;
      }
    }
    return matched;
  }, [qualifyingCount]);

  const nextTier = useMemo(() => {
    for (const t of WEEKLY_SALARY_TIERS) {
      if (qualifyingCount < t.minReferrals) {
        return t;
      }
    }
    return null;
  }, [qualifyingCount]);

  const pendingSalaryKES = currentTier ? currentTier.weeklySalaryKES : 0;
  const progressToNext = nextTier 
    ? Math.min(100, Math.round((qualifyingCount / nextTier.minReferrals) * 100))
    : 100;

  // Format countdown
  const countdownFormatted = useMemo(() => {
    const totalSeconds = campaignData?.nextSundayCountdownSeconds || 0;
    if (totalSeconds <= 0) return 'Disbursing Today';
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  }, [campaignData?.nextSundayCountdownSeconds]);

  // Filtered members by Tier, Recharge Status, and Search Query
  const filteredReferrals = useMemo(() => {
    return localReferrals.filter(r => {
      // Tier filter
      if (selectedTierFilter !== 'all' && r.tier !== selectedTierFilter) {
        return false;
      }
      // Status filter
      if (statusFilter === 'pending' && r.totalDepositedKES > 0) {
        return false;
      }
      if (statusFilter === 'active' && r.totalDepositedKES === 0) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = r.name?.toLowerCase().includes(q);
        const matchPhone = (r.phone || r.phoneOrEmail || '').toLowerCase().includes(q);
        const matchEmail = (r.email || r.phoneOrEmail || '').toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchEmail) {
          return false;
        }
      }
      return true;
    });
  }, [localReferrals, selectedTierFilter, statusFilter, searchQuery]);

  // Total pending 10% commission
  const totalPendingCommissionsKES = pendingCommissions
    .filter(c => c.status === 'pending' && !c.isUnlocked)
    .reduce((sum, c) => sum + c.commissionAmountKES, 0);

  return (
    <div className="space-y-6">
      {/* 1. DYNAMIC INVITATION BANNER */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-[#120f26] via-[#0e1322] to-[#080d16] text-white rounded-2xl p-6 sm:p-8 border border-purple-500/20 relative overflow-hidden shadow-2xl space-y-5"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="max-w-3xl relative z-10 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-purple-300" />
              <span>Royal VIP Affiliate & Weekly Salary Campaign</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-mono">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>Anti-Sybil Protected</span>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Invite Partners, Earn 10% Deposits & Sunday Salaries
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
            Whenever a friend deposits via your invite link, you automatically earn <strong className="text-emerald-300 font-semibold">10% of their deposit</strong>. Plus, maintain 10 or more active partners to qualify for the <strong className="text-purple-300 font-semibold">Royal Weekly Salary</strong>, paid automatically every Sunday to your set M-Pesa or Polygon USDT address!
          </p>

          {/* Dynamic Referral Link & Partner Code Box */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="bg-[#0a0e17]/80 p-3 rounded-xl border border-slate-800">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[11px] text-slate-400 font-semibold">Your Partner Code</span>
                <span className="text-[10px] text-emerald-400 font-medium">10% Direct Bonus</span>
              </div>
              <div className="flex items-center justify-between bg-[#111726] px-3 py-2 rounded-lg border border-slate-700/60">
                <span className="font-mono font-bold text-sm text-emerald-400">{user.referralCode}</span>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  id="btn-copy-ref-code"
                  onClick={handleCopyCode}
                  className="p-1 text-slate-400 hover:text-white transition cursor-pointer"
                  title="Copy code"
                >
                  {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </motion.button>
              </div>
            </div>

            <div className="bg-[#0a0e17]/80 p-3 rounded-xl border border-slate-800">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[11px] text-slate-400 font-semibold">Dynamic Invitation Link</span>
                <span className="text-[10px] text-purple-300 font-mono">Auto-detects host</span>
              </div>
              <div className="flex items-center justify-between bg-[#111726] px-3 py-2 rounded-lg border border-slate-700/60">
                <span className="font-mono text-xs text-slate-300 truncate max-w-[220px]" title={dynamicInviteUrl}>
                  {dynamicInviteUrl}
                </span>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  id="btn-copy-ref-link"
                  onClick={handleCopyLink}
                  className="p-1 text-slate-400 hover:text-white transition cursor-pointer"
                  title="Copy link"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                </motion.button>
              </div>
            </div>
          </div>

          {/* Quick Share Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              onClick={handleCopyPitch}
              className="px-3 py-1.5 bg-[#121929] hover:bg-[#182238] border border-slate-700 text-xs font-semibold rounded-lg text-slate-200 flex items-center gap-1.5 transition cursor-pointer"
            >
              {copiedPitch ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copiedPitch ? 'Pitch Copied!' : 'Copy Invite Pitch'}</span>
            </button>
            <button
              onClick={handleShareWhatsApp}
              className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-lg flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-emerald-500/20"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Share to WhatsApp</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* 2. ROYAL WEEKLY SALARY HERO CARD & PENDING BALANCE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Weekly Salary Status Card */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 bg-[#0d1320] rounded-2xl border border-purple-500/30 p-6 shadow-xl relative overflow-hidden space-y-5"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-300">
                  <Award className="w-4 h-4" />
                </span>
                <h3 className="font-bold text-white text-base">Royal Weekly Salary (Automated Sunday Payouts)</h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Paid automatically every Sunday to your set payout destination. Distinct from your trading wallet.
              </p>
            </div>

            <div className="bg-[#0a0e17] px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Sunday Payout Timer</div>
                <div className="text-xs font-mono font-bold text-white">{countdownFormatted}</div>
              </div>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Metric 1: Qualifying Partners */}
            <div className="bg-[#090d15] p-4 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 font-semibold block">Qualifying Active Partners</span>
              <div className="text-2xl font-black font-mono text-white mt-1 flex items-baseline gap-1.5">
                <span>{qualifyingCount}</span>
                <span className="text-xs font-sans text-slate-400 font-normal">/ {nextTier ? nextTier.minReferrals : '250+'}</span>
              </div>
              <span className="text-[10px] text-emerald-400 block mt-1">Active deposited investors</span>
            </div>

            {/* Metric 2: Current Salary Tier */}
            <div className="bg-[#090d15] p-4 rounded-xl border border-purple-500/20">
              <span className="text-[11px] text-purple-300 font-semibold block">Current Salary Tier</span>
              <div className="text-lg font-black font-mono text-purple-300 mt-1">
                {currentTier ? currentTier.tierName : 'Standard (0/10)'}
              </div>
              <span className="text-[10px] text-slate-400 block mt-1">
                {currentTier ? `${currentTier.minReferrals}+ Partners Required` : 'Reach 10 partners for Tier 1'}
              </span>
            </div>

            {/* Metric 3: Pending Sunday Salary */}
            <div className="bg-[#090d15] p-4 rounded-xl border border-emerald-500/30">
              <span className="text-[11px] text-emerald-400 font-semibold block">Pending Sunday Salary</span>
              <div className="text-2xl font-black font-mono text-emerald-400 mt-1">
                KES {pendingSalaryKES.toLocaleString()}
              </div>
              <span className="text-[10px] text-slate-300 block mt-1">
                Auto-sends: {campaignData?.nextSundayDate || 'This Sunday'}
              </span>
            </div>
          </div>

          {/* Milestone Progress Bar */}
          <div className="bg-[#090d15] p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">
                {nextTier 
                  ? `Next Tier Milestone: ${nextTier.tierName} (${nextTier.minReferrals} partners for KES ${nextTier.weeklySalaryKES.toLocaleString()}/wk)`
                  : 'Maximum Royal Crown Tier Achieved!'}
              </span>
              <span className="font-mono font-bold text-purple-300">{progressToNext}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progressToNext}%` }}
                className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-emerald-400 rounded-full"
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-500">
              <span>{qualifyingCount} active</span>
              <span>{nextTier ? `${nextTier.minReferrals - qualifyingCount} more needed` : 'Crown Tier'}</span>
            </div>
          </div>
        </motion.div>

        {/* Automated Salary Destination Config Card */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-[#0d1320] rounded-2xl border border-slate-800 p-6 shadow-xl flex flex-col justify-between space-y-4"
        >
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                <Wallet className="w-4 h-4" />
              </span>
              <h3 className="font-bold text-white text-base">Salary Payout Destination</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Set where your Sunday salary is automatically disbursed. You can use Safaricom M-Pesa or a Polygon USDT address.
            </p>
          </div>

          <form onSubmit={handleSaveSalaryConfig} className="space-y-3">
            {/* Method selector */}
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">Disbursement Channel</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSalaryMethod('mpesa');
                    if (!salaryDestination || salaryDestination.startsWith('0x')) {
                      setSalaryDestination(user.phone || '');
                    }
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    salaryMethod === 'mpesa' 
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm' 
                      : 'bg-[#0a0e17] text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>M-Pesa (KES)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSalaryMethod('crypto');
                    if (salaryDestination === user.phone) {
                      setSalaryDestination('');
                    }
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    salaryMethod === 'crypto' 
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/50 shadow-sm' 
                      : 'bg-[#0a0e17] text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Polygon USDT</span>
                </button>
              </div>
            </div>

            {/* Destination input */}
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                {salaryMethod === 'mpesa' ? 'Safaricom Phone Number' : 'Polygon USDT EVM Address'}
              </label>
              <input
                type="text"
                value={salaryDestination}
                onChange={(e) => setSalaryDestination(e.target.value)}
                placeholder={salaryMethod === 'mpesa' ? '0712345678 or 254712345678' : '0x... (42-character hex)'}
                className="w-full bg-[#0a0e17] text-white text-xs font-mono px-3 py-2.5 rounded-xl border border-slate-700/80 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            {/* Status notice */}
            <div className="p-2.5 bg-[#0a0e17] rounded-xl border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
              <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <span>
                Automated payout initiates every Sunday at 00:00 UTC without requiring manual withdrawal.
              </span>
            </div>

            {configErrorMsg && (
              <div className="p-2 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400">
                {configErrorMsg}
              </div>
            )}
            {configSuccessMsg && (
              <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-400">
                {configSuccessMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={isSavingConfig}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20"
            >
              {isSavingConfig ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              <span>Save Automated Destination</span>
            </button>
          </form>
        </motion.div>
      </div>

      {/* 3. 10% DEPOSIT COMMISSION & 72-HOUR FRAUD VESTING SHIELD */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#0d1320] rounded-2xl border border-emerald-500/30 p-6 shadow-xl space-y-5"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
              </span>
              <h3 className="font-bold text-white text-base">
                10% Direct Deposit Reward (72-Hour Anti-Fraud Vesting Shield)
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Every time a referred partner deposits, you receive 10% of their deposit amount. Monitored for 72 hours against chargebacks & fraud before automated release to your normal account.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[11px] text-slate-400 font-semibold block">Pending 72h Balance</span>
              <span className="text-lg font-black font-mono text-emerald-400">
                KES {totalPendingCommissionsKES.toLocaleString()}
              </span>
            </div>

            <button
              onClick={handleReleaseMatured}
              disabled={isProcessingMatured}
              className="px-3 py-2 bg-[#121929] hover:bg-[#182238] border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isProcessingMatured ? 'animate-spin' : ''}`} />
              <span>Check Matured</span>
            </button>
          </div>
        </div>

        {/* Pending Commissions Breakdown */}
        {pendingCommissions.length === 0 ? (
          <div className="p-6 bg-[#0a0e17] rounded-xl border border-slate-800 text-center space-y-2">
            <Users className="w-8 h-8 text-slate-600 mx-auto" />
            <div className="text-xs font-semibold text-slate-300">No Pending 72h Commissions</div>
            <p className="text-[11px] text-slate-400 max-w-md mx-auto">
              When your invited friends make their first or subsequent deposit, your 10% cash commission will immediately appear here under the 72-hour protection shield.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {pendingCommissions.map((comm) => {
              const unlockDate = new Date(comm.unlockAt);
              const msLeft = Math.max(0, unlockDate.getTime() - Date.now());
              const hrsLeft = Math.floor(msLeft / (1000 * 60 * 60));
              const minsLeft = Math.floor((msLeft % (1000 * 60 * 60)) / (1000 * 60));
              const isMatured = msLeft <= 0 || comm.status === 'matured' || comm.isUnlocked;

              return (
                <div 
                  key={comm.id} 
                  className={`p-4 rounded-xl border transition ${
                    isMatured 
                      ? 'bg-emerald-950/20 border-emerald-500/40' 
                      : 'bg-[#0a0e17] border-slate-800'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-xs font-bold text-white block">{comm.fromUserName}</span>
                      <span className="text-[10px] text-slate-400">
                        Deposited: KES {comm.depositAmountKES.toLocaleString()}
                      </span>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold border ${
                      isMatured 
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    }`}>
                      {isMatured ? 'Matured' : '72h Vesting'}
                    </span>
                  </div>

                  <div className="flex justify-between items-baseline pt-2 border-t border-slate-800/60 text-xs">
                    <span className="text-slate-400">10% Reward:</span>
                    <span className="font-mono font-bold text-emerald-400 text-sm">
                      +KES {comm.commissionAmountKES.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 mt-2 text-[10px] text-slate-400 font-mono">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>
                      {isMatured ? 'Ready to release' : `Unlocks in: ${hrsLeft}h ${minsLeft}m`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* 4. WEEKLY SALARY TIERS LADDER MATRIX */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#0d1320] rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-400" />
              Royal Weekly Salary Tier Matrix
            </h3>
            <p className="text-xs text-slate-400">
              Structured Sunday disbursements based on your active team count. Payouts trigger automatically.
            </p>
          </div>
          <span className="text-[11px] font-mono text-slate-400 bg-[#0a0e17] px-2.5 py-1 rounded-lg border border-slate-800">
            Current: <strong className="text-emerald-400">{qualifyingCount} Active Partners</strong>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {WEEKLY_SALARY_TIERS.map((tier) => {
            const isCurrent = currentTier?.minReferrals === tier.minReferrals;
            const isQualified = qualifyingCount >= tier.minReferrals;

            return (
              <div 
                key={tier.minReferrals}
                className={`p-3.5 rounded-xl border text-center transition relative overflow-hidden flex flex-col justify-between space-y-2 ${
                  isCurrent 
                    ? 'bg-purple-950/30 border-purple-500 ring-2 ring-purple-500/20 shadow-lg' 
                    : isQualified 
                    ? 'bg-[#090e18] border-emerald-500/40' 
                    : 'bg-[#0a0e17] border-slate-800/80 opacity-75'
                }`}
              >
                {isCurrent && (
                  <span className="absolute top-0 right-0 bg-purple-500 text-slate-950 font-black text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded-bl">
                    Active
                  </span>
                )}

                <div>
                  <div className="text-xs font-bold text-slate-300">{tier.tierName}</div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">{tier.minReferrals}+ Partners</div>
                </div>

                <div className="py-1">
                  <div className="text-base font-black font-mono text-emerald-400">
                    KES {tier.weeklySalaryKES.toLocaleString()}
                  </div>
                  <div className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">Every Sunday</div>
                </div>

                <div className="pt-1 border-t border-slate-800 text-[10px]">
                  {isQualified ? (
                    <span className="text-emerald-400 font-semibold flex items-center justify-center gap-1">
                      <Check className="w-3 h-3" /> Qualified
                    </span>
                  ) : (
                    <span className="text-slate-500 font-mono">
                      {tier.minReferrals - qualifyingCount} needed
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* 5. MULTI-TIER COMMISSION STRUCTURE CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Tier 1 */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0d1320] rounded-2xl border border-slate-800 p-5 shadow-lg relative overflow-hidden flex flex-col justify-between space-y-4"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-3 py-0.5 rounded-full">
                Tier 1 (Direct)
              </span>
              <span className="text-2xl font-black text-emerald-400 font-mono">
                {settings.tier1CommissionPercent || 10}%
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Direct invitations by your link. When a partner starts Silver (KES 1,300), you earn <strong className="text-emerald-300 font-mono">KES {(1300 * ((settings.tier1CommissionPercent || 10)/100)).toFixed(0)}</strong> automatically with 72h anti-fraud protection.
            </p>
          </div>
          <div className="p-3 bg-[#0a0e17] rounded-xl border border-slate-800 flex justify-between items-center text-xs">
            <span className="text-slate-400 font-medium">{tier1Members.length} Partners</span>
            <span className="font-bold text-white font-mono">KES {tier1Commission.toLocaleString()}</span>
          </div>
        </motion.div>

        {/* Tier 2 */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0d1320] rounded-2xl border border-slate-800 p-5 shadow-lg relative overflow-hidden flex flex-col justify-between space-y-4"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-300 bg-blue-500/15 border border-blue-500/30 px-3 py-0.5 rounded-full">
                Tier 2 (Secondary)
              </span>
              <span className="text-2xl font-black text-blue-400 font-mono">
                {settings.tier2CommissionPercent || 3}%
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Invited by your Tier 1 teammates. On an activation of KES 1,300, you automatically earn <strong className="text-blue-300 font-mono">KES {(1300 * ((settings.tier2CommissionPercent || 3)/100)).toFixed(0)}</strong>.
            </p>
          </div>
          <div className="p-3 bg-[#0a0e17] rounded-xl border border-slate-800 flex justify-between items-center text-xs">
            <span className="text-slate-400 font-medium">{tier2Members.length} Partners</span>
            <span className="font-bold text-white font-mono">KES {tier2Commission.toLocaleString()}</span>
          </div>
        </motion.div>

        {/* Tier 3 */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0d1320] rounded-2xl border border-slate-800 p-5 shadow-lg relative overflow-hidden flex flex-col justify-between space-y-4"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-300 bg-purple-500/15 border border-purple-500/30 px-3 py-0.5 rounded-full">
                Tier 3 (Network)
              </span>
              <span className="text-2xl font-black text-purple-400 font-mono">
                {settings.tier3CommissionPercent || 1}%
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Invited by Tier 2 members. Automatically provides passive depth rewards across your expanding community.
            </p>
          </div>
          <div className="p-3 bg-[#0a0e17] rounded-xl border border-slate-800 flex justify-between items-center text-xs">
            <span className="text-slate-400 font-medium">{tier3Members.length} Partners</span>
            <span className="font-bold text-white font-mono">KES {tier3Commission.toLocaleString()}</span>
          </div>
        </motion.div>
      </div>

      {/* 6. PAST SUNDAY SALARY DISBURSEMENTS HISTORY */}
      {salaryPayouts.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0d1320] rounded-2xl border border-slate-800 overflow-hidden shadow-xl"
        >
          <div className="p-5 border-b border-slate-800">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Award className="w-4 h-4 text-purple-400" />
              Automated Sunday Salary Receipts ({salaryPayouts.length} Disbursements)
            </h3>
            <p className="text-xs text-slate-400">Direct disbursements sent to your registered M-Pesa / Polygon USDT address</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#0a0e17] text-slate-400 border-b border-slate-800">
                  <th className="py-3 px-5 font-semibold">Week Ending Date</th>
                  <th className="py-3 px-5 font-semibold">Active Partners</th>
                  <th className="py-3 px-5 font-semibold">Channel</th>
                  <th className="py-3 px-5 font-semibold">Destination</th>
                  <th className="py-3 px-5 font-semibold text-right">Amount Disbursed</th>
                  <th className="py-3 px-5 font-semibold text-right">Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {salaryPayouts.map((p) => (
                  <tr key={p.id} className="hover:bg-[#111726]/40 transition-colors">
                    <td className="py-3.5 px-5 font-medium text-white">{p.weekEndingDate}</td>
                    <td className="py-3.5 px-5 font-mono text-purple-300">{p.qualifyingReferrals} Partners</td>
                    <td className="py-3.5 px-5 uppercase font-semibold text-slate-300">{p.method}</td>
                    <td className="py-3.5 px-5 font-mono text-slate-400 truncate max-w-[160px]">{p.destination}</td>
                    <td className="py-3.5 px-5 text-right font-mono font-bold text-emerald-400">
                      KES {p.amountKES.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-5 text-right font-mono text-slate-400">{p.txHashOrRef || 'COMPLETED'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* ACTION TOAST FEEDBACK */}
      <AnimatePresence>
        {actionFeedback && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-2xl border border-emerald-400/40 flex items-center gap-3 text-xs font-bold"
          >
            <CheckCircle2 className="w-5 h-5 text-white shrink-0" />
            <span>{actionFeedback}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 7. DOWNLINE MEMBERS & CONTACT DIRECTORY */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#0d1320] rounded-2xl border border-slate-800 overflow-hidden shadow-xl"
      >
        {/* Header & High-Level Metrics */}
        <div className="p-5 border-b border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-400" />
                Invited Friends Directory ({localReferrals.length} Registered)
              </h3>
              <p className="text-xs text-slate-400">
                View registered contact details (phone & email) to follow up and encourage friends to recharge their accounts
              </p>
            </div>

            {/* Quick Follow-Up Summary Pills */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                {pendingRechargeCount} Need Recharge
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                {activeRechargeCount} Active Funded
              </span>
            </div>
          </div>

          {/* Search Bar & Filters Bar */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 pt-2">
            {/* Search Input */}
            <div className="lg:col-span-5 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search friend by name, phone, or email..."
                className="w-full pl-10 pr-8 py-2 bg-[#080d17] border border-slate-800 focus:border-purple-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Status Filter Tabs */}
            <div className="lg:col-span-4 flex items-center gap-1 bg-[#080d17] p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`flex-1 py-1.5 px-2 text-[11px] font-semibold rounded-lg transition cursor-pointer text-center ${
                  statusFilter === 'all' 
                    ? 'bg-slate-800 text-white shadow-sm' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All ({localReferrals.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('pending')}
                className={`flex-1 py-1.5 px-2 text-[11px] font-semibold rounded-lg transition cursor-pointer text-center ${
                  statusFilter === 'pending' 
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                    : 'text-slate-400 hover:text-amber-300'
                }`}
              >
                Needs Recharge ({pendingRechargeCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('active')}
                className={`flex-1 py-1.5 px-2 text-[11px] font-semibold rounded-lg transition cursor-pointer text-center ${
                  statusFilter === 'active' 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                    : 'text-slate-400 hover:text-emerald-300'
                }`}
              >
                Funded ({activeRechargeCount})
              </button>
            </div>

            {/* Tier Filter Tabs */}
            <div className="lg:col-span-3 flex items-center gap-1 bg-[#080d17] p-1 rounded-xl border border-slate-800 justify-end">
              <button
                type="button"
                onClick={() => setSelectedTierFilter('all')}
                className={`px-2.5 py-1.5 text-[11px] font-semibold rounded-lg transition cursor-pointer ${
                  selectedTierFilter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All Tiers
              </button>
              <button
                type="button"
                onClick={() => setSelectedTierFilter(1)}
                className={`px-2.5 py-1.5 text-[11px] font-semibold rounded-lg transition cursor-pointer ${
                  selectedTierFilter === 1 ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'text-slate-400 hover:text-purple-300'
                }`}
              >
                T1 ({tier1Members.length})
              </button>
              <button
                type="button"
                onClick={() => setSelectedTierFilter(2)}
                className={`px-2.5 py-1.5 text-[11px] font-semibold rounded-lg transition cursor-pointer ${
                  selectedTierFilter === 2 ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'text-slate-400 hover:text-blue-300'
                }`}
              >
                T2 ({tier2Members.length})
              </button>
              <button
                type="button"
                onClick={() => setSelectedTierFilter(3)}
                className={`px-2.5 py-1.5 text-[11px] font-semibold rounded-lg transition cursor-pointer ${
                  selectedTierFilter === 3 ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'text-slate-400 hover:text-indigo-300'
                }`}
              >
                T3 ({tier3Members.length})
              </button>
            </div>
          </div>
        </div>

        {/* DESKTOP TABLE VIEW */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#0a0e17] text-slate-400 border-b border-slate-800">
                <th className="py-3 px-5 font-semibold">Friend Details</th>
                <th className="py-3 px-5 font-semibold">Registered Contact</th>
                <th className="py-3 px-5 font-semibold">Tier</th>
                <th className="py-3 px-5 font-semibold">Recharge Status</th>
                <th className="py-3 px-5 font-semibold text-right">Deposited</th>
                <th className="py-3 px-5 font-semibold text-right">Your Commission</th>
                <th className="py-3 px-5 font-semibold text-center">Contact / Remind</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredReferrals.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-500">
                    <Users className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                    No invited friends match your search or filter criteria. Share your referral link above to grow your network!
                  </td>
                </tr>
              ) : (
                filteredReferrals.map((member) => {
                  const isFunded = member.totalDepositedKES > 0;
                  const phoneFormatted = formatKenyanPhone(member.phone || member.phoneOrEmail);
                  const displayEmail = member.email || (member.phoneOrEmail && member.phoneOrEmail.includes('@') ? member.phoneOrEmail : null);
                  const displayPhone = member.phone || (!member.phoneOrEmail?.includes('@') ? member.phoneOrEmail : null);

                  return (
                    <tr key={member.id} className="hover:bg-[#111726]/40 transition-colors">
                      {/* Friend Identity & Registration Time */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-600 to-indigo-700 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-md">
                            {member.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-white text-sm">{member.name}</div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <Calendar className="w-3 h-3 text-slate-500" />
                              <span>Registered: {member.registeredAt || member.joinedDate}</span>
                            </div>
                            {member.lastContactedDate && (
                              <div className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
                                <CheckCircle2 className="w-2.5 h-2.5" />
                                <span>Reminded ({member.reminderCount || 1}x)</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Registered Contact Info */}
                      <td className="py-3.5 px-5">
                        <div className="space-y-1">
                          {displayPhone && (
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-slate-200 font-semibold">{phoneFormatted}</span>
                              <button
                                type="button"
                                onClick={() => handleCopyText(displayPhone, `phone-${member.id}`)}
                                title="Copy Phone"
                                className="p-1 text-slate-400 hover:text-slate-200 transition cursor-pointer"
                              >
                                {copiedField === `phone-${member.id}` ? (
                                  <Check className="w-3 h-3 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          )}
                          {displayEmail ? (
                            <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                              <span className="truncate max-w-[150px]">{displayEmail}</span>
                              <button
                                type="button"
                                onClick={() => handleCopyText(displayEmail, `email-${member.id}`)}
                                title="Copy Email"
                                className="p-1 text-slate-400 hover:text-slate-200 transition cursor-pointer"
                              >
                                {copiedField === `email-${member.id}` ? (
                                  <Check className="w-3 h-3 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-500 italic">No email provided</span>
                          )}
                        </div>
                      </td>

                      {/* Tier */}
                      <td className="py-3.5 px-5">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                          member.tier === 1 
                            ? 'bg-purple-500/10 text-purple-300 border-purple-500/30' 
                            : member.tier === 2 
                            ? 'bg-blue-500/10 text-blue-300 border-blue-500/30' 
                            : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
                        }`}>
                          Tier {member.tier} ({member.tier === 1 ? (settings.tier1CommissionPercent || 10) : member.tier === 2 ? (settings.tier2CommissionPercent || 3) : (settings.tier3CommissionPercent || 1)}%)
                        </span>
                      </td>

                      {/* Recharge Status */}
                      <td className="py-3.5 px-5">
                        {isFunded ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                              <CheckCircle2 className="w-3 h-3" /> Active Investor
                            </span>
                            <div className="text-[10px] text-slate-400">{member.packageActive || 'Funded Plan'}</div>
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                              <AlertTriangle className="w-3 h-3" /> Pending Recharge
                            </span>
                            <div className="text-[10px] text-amber-300/80 font-medium">Unfunded - Remind Friend!</div>
                          </div>
                        )}
                      </td>

                      {/* Volume Deposited */}
                      <td className="py-3.5 px-5 text-right font-mono font-medium text-slate-200">
                        KES {member.totalDepositedKES.toLocaleString()}
                      </td>

                      {/* Commission Earned */}
                      <td className="py-3.5 px-5 text-right font-mono font-bold text-emerald-400">
                        +KES {member.commissionEarnedKES.toLocaleString()}
                      </td>

                      {/* Contact & Remind CTAs */}
                      <td className="py-3.5 px-5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* 1-Click WhatsApp */}
                          {displayPhone && (
                            <a
                              href={getWhatsAppUrl(
                                displayPhone,
                                `Hi ${member.name}! 👋 Make sure to recharge your Royal Services account to start receiving daily returns straight to your M-Pesa or USDT!`
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => handleRecordReminder(member.id, 'WhatsApp opened')}
                              title="Open WhatsApp chat with friend"
                              className="p-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 transition cursor-pointer"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>
                          )}

                          {/* 1-Click Phone Call */}
                          {displayPhone && (
                            <a
                              href={getTelUrl(displayPhone)}
                              onClick={() => handleRecordReminder(member.id, 'Phone call initiated')}
                              title="Call friend directly"
                              className="p-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 transition cursor-pointer"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>
                          )}

                          {/* Full Contact Console Modal Trigger */}
                          <button
                            type="button"
                            onClick={() => handleOpenContactModal(member)}
                            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-sm transition cursor-pointer flex items-center gap-1"
                          >
                            <Send className="w-3 h-3" />
                            <span>Remind to Recharge</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* MOBILE CARD VIEW */}
        <div className="lg:hidden divide-y divide-slate-800/80 p-4 space-y-4">
          {filteredReferrals.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              No invited friends match your filter.
            </div>
          ) : (
            filteredReferrals.map((member) => {
              const isFunded = member.totalDepositedKES > 0;
              const displayPhone = member.phone || (!member.phoneOrEmail?.includes('@') ? member.phoneOrEmail : null);
              const displayEmail = member.email || (member.phoneOrEmail && member.phoneOrEmail.includes('@') ? member.phoneOrEmail : null);
              const phoneFormatted = formatKenyanPhone(displayPhone || undefined);

              return (
                <div key={member.id} className="pt-4 first:pt-0 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-indigo-700 text-white font-bold text-sm flex items-center justify-center shrink-0">
                        {member.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-white text-sm">{member.name}</div>
                        <div className="text-[11px] text-slate-400">
                          Joined: {member.registeredAt || member.joinedDate}
                        </div>
                      </div>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      member.tier === 1 
                        ? 'bg-purple-500/10 text-purple-300 border-purple-500/30' 
                        : 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                    }`}>
                      Tier {member.tier}
                    </span>
                  </div>

                  {/* Registered Details Box */}
                  <div className="bg-[#080d17] p-3 rounded-xl border border-slate-800 space-y-1.5 text-xs">
                    {displayPhone && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-slate-500" /> Phone:
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-white font-semibold">{phoneFormatted}</span>
                          <button
                            type="button"
                            onClick={() => handleCopyText(displayPhone, `m-phone-${member.id}`)}
                            className="text-slate-400 hover:text-white"
                          >
                            {copiedField === `m-phone-${member.id}` ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                    {displayEmail && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <Mail className="w-3 h-3 text-slate-500" /> Email:
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-300 truncate max-w-[170px]">{displayEmail}</span>
                          <button
                            type="button"
                            onClick={() => handleCopyText(displayEmail, `m-email-${member.id}`)}
                            className="text-slate-400 hover:text-white"
                          >
                            {copiedField === `m-email-${member.id}` ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                      <span className="text-slate-400">Recharge Status:</span>
                      {isFunded ? (
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Active (KES {member.totalDepositedKES.toLocaleString()})
                        </span>
                      ) : (
                        <span className="text-amber-400 font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Pending First Deposit
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Touch-Friendly Action Buttons (>=44px touch targets) */}
                  <div className="grid grid-cols-3 gap-2">
                    {displayPhone ? (
                      <a
                        href={getWhatsAppUrl(
                          displayPhone,
                          `Hi ${member.name}! 👋 Recharge your Royal Services account today to activate your daily returns straight to your M-Pesa or USDT balance!`
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => handleRecordReminder(member.id, 'WhatsApp opened')}
                        className="min-h-[44px] bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
                      >
                        <MessageCircle className="w-4 h-4 text-emerald-400" />
                        <span>WhatsApp</span>
                      </a>
                    ) : (
                      <div className="min-h-[44px] bg-slate-800/20 rounded-xl flex items-center justify-center text-slate-500 text-xs">
                        No Phone
                      </div>
                    )}

                    {displayPhone ? (
                      <a
                        href={getTelUrl(displayPhone)}
                        onClick={() => handleRecordReminder(member.id, 'Call dialed')}
                        className="min-h-[44px] bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
                      >
                        <Phone className="w-4 h-4 text-blue-400" />
                        <span>Call</span>
                      </a>
                    ) : (
                      <div className="min-h-[44px] bg-slate-800/20 rounded-xl flex items-center justify-center text-slate-500 text-xs">
                        No Call
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => handleOpenContactModal(member)}
                      className="min-h-[44px] bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Remind</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </motion.div>

      {/* CONTACT & RECHARGE REMINDER MODAL */}
      <AnimatePresence>
        {contactModalMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0e1424] border border-purple-500/30 rounded-2xl p-6 w-full max-w-xl shadow-2xl text-white space-y-5 max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="flex justify-between items-start border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-indigo-700 text-white font-black text-sm flex items-center justify-center shadow-lg">
                    {contactModalMember.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">Contact & Remind to Recharge</h3>
                    <p className="text-xs text-slate-400">Send personalized follow-up instructions to {contactModalMember.name}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setContactModalMember(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Full Registered Details Profile Card */}
              <div className="bg-[#080d17] border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-purple-400" />
                  Full Registered Account Details
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Full Name:</span>
                    <span className="font-bold text-white">{contactModalMember.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Registered Phone:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-emerald-400">
                        {formatKenyanPhone(contactModalMember.phone || contactModalMember.phoneOrEmail)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyText(contactModalMember.phone || contactModalMember.phoneOrEmail, 'modal-phone')}
                        className="text-slate-400 hover:text-white transition"
                        title="Copy Phone"
                      >
                        {copiedField === 'modal-phone' ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Registered Email:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-300 truncate max-w-[180px]">
                        {contactModalMember.email || (contactModalMember.phoneOrEmail?.includes('@') ? contactModalMember.phoneOrEmail : 'Not Provided')}
                      </span>
                      {contactModalMember.email && (
                        <button
                          type="button"
                          onClick={() => handleCopyText(contactModalMember.email!, 'modal-email')}
                          className="text-slate-400 hover:text-white transition"
                          title="Copy Email"
                        >
                          {copiedField === 'modal-email' ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Registration Date & Time:</span>
                    <span className="text-slate-300 font-mono">
                      {contactModalMember.registeredAt || contactModalMember.joinedDate}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Referral Tier Level:</span>
                    <span className="text-purple-300 font-bold">
                      Tier {contactModalMember.tier} ({contactModalMember.tier === 1 ? '10% Direct Commission' : contactModalMember.tier === 2 ? '3% Second Line' : '1% Network'})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Deposit & Contract Status:</span>
                    {contactModalMember.totalDepositedKES > 0 ? (
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Recharged KES {contactModalMember.totalDepositedKES.toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-amber-400 font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Unfunded (KES 0 Deposited)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Template Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300">
                  Select Quick Recharge Message Template:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {getReminderTemplates(contactModalMember).map((tmpl, idx) => (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() => {
                        setSelectedTemplateIdx(idx);
                        setCustomMessage(tmpl.text);
                      }}
                      className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                        selectedTemplateIdx === idx
                          ? 'bg-purple-900/30 border-purple-500 text-white'
                          : 'bg-[#080d17] border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-[11px] font-bold line-clamp-2">{tmpl.title}</div>
                      <span className="mt-2 text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 w-fit">
                        {tmpl.tag}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Editable Message Box */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-semibold text-slate-300">Message Preview & Customizer:</label>
                  <button
                    type="button"
                    onClick={() => {
                      const tmpls = getReminderTemplates(contactModalMember);
                      setCustomMessage(tmpls[selectedTemplateIdx].text);
                    }}
                    className="text-purple-400 hover:text-purple-300 text-[11px] cursor-pointer"
                  >
                    Reset Template
                  </button>
                </div>
                <textarea
                  rows={5}
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  className="w-full p-3 bg-[#080d17] border border-slate-800 focus:border-purple-500 rounded-xl text-xs text-white leading-relaxed focus:outline-none transition resize-none font-sans"
                />
              </div>

              {/* Instant Multi-Channel Actions */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* WhatsApp Primary Dispatch */}
                  <a
                    href={getWhatsAppUrl(
                      contactModalMember.phone || contactModalMember.phoneOrEmail,
                      customMessage
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      handleRecordReminder(contactModalMember.id, `WhatsApp reminder sent to ${contactModalMember.name}`);
                      setContactModalMember(null);
                    }}
                    className="py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Send via WhatsApp</span>
                  </a>

                  {/* Direct Phone Call */}
                  <a
                    href={getTelUrl(contactModalMember.phone || contactModalMember.phoneOrEmail)}
                    onClick={() => {
                      handleRecordReminder(contactModalMember.id, `Phone call placed to ${contactModalMember.name}`);
                    }}
                    className="py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <PhoneCall className="w-4 h-4" />
                    <span>Call Friend Directly</span>
                  </a>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {/* Send SMS */}
                  <a
                    href={getSmsUrl(contactModalMember.phone || contactModalMember.phoneOrEmail, customMessage)}
                    onClick={() => {
                      handleRecordReminder(contactModalMember.id, `SMS reminder sent to ${contactModalMember.name}`);
                      setContactModalMember(null);
                    }}
                    className="py-2.5 px-3 bg-[#131b2e] hover:bg-[#1c2742] text-slate-200 border border-slate-700 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Smartphone className="w-3.5 h-3.5 text-blue-400" />
                    <span>Send SMS</span>
                  </a>

                  {/* Send Email */}
                  <a
                    href={getEmailUrl(contactModalMember.email, contactModalMember.name, customMessage)}
                    onClick={() => {
                      handleRecordReminder(contactModalMember.id, `Email reminder sent to ${contactModalMember.name}`);
                      setContactModalMember(null);
                    }}
                    className={`py-2.5 px-3 bg-[#131b2e] hover:bg-[#1c2742] text-slate-200 border border-slate-700 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      !contactModalMember.email ? 'opacity-50 pointer-events-none' : ''
                    }`}
                  >
                    <Mail className="w-3.5 h-3.5 text-purple-400" />
                    <span>Send Email</span>
                  </a>

                  {/* Copy Message */}
                  <button
                    type="button"
                    onClick={() => handleCopyText(customMessage, 'modal-message')}
                    className="py-2.5 px-3 bg-[#131b2e] hover:bg-[#1c2742] text-slate-200 border border-slate-700 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    {copiedField === 'modal-message' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-bold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Message</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
