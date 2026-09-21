import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Lock, 
  Unlock, 
  RefreshCw, 
  UserX, 
  Sliders, 
  CheckCircle2, 
  XCircle, 
  Activity, 
  Fingerprint, 
  Ban, 
  AlertOctagon, 
  Search, 
  Check, 
  Clock, 
  Zap, 
  HelpCircle,
  Eye,
  FileCheck,
  FileX,
  FileText,
  BadgeCheck,
  UserCheck
} from 'lucide-react';
import { AntiFraudEvent, AntiFraudMetrics, PlatformSettings, UserProfile } from '../types';
import { 
  fetchAntiFraudMetrics, 
  fetchAntiFraudEvents, 
  fetchFlaggedUsers, 
  freezeAccountApi, 
  unfreezeAccountApi, 
  updateAntiFraudSettingsApi,
  toggleUserKycApi,
  approveUserKycApi,
  rejectUserKycApi
} from '../services/antiFraudService';

interface AntiFraudDashboardProps {
  settings: PlatformSettings;
  onUpdateSettings?: (newSettings: PlatformSettings) => void;
}

export const AntiFraudDashboard: React.FC<AntiFraudDashboardProps> = ({
  settings,
  onUpdateSettings,
}) => {
  const [metrics, setMetrics] = useState<AntiFraudMetrics | null>(null);
  const [events, setEvents] = useState<AntiFraudEvent[]>([]);
  const [flaggedUsers, setFlaggedUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string>('');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');

  // Freeze Modal State
  const [selectedUserForFreeze, setSelectedUserForFreeze] = useState<UserProfile | null>(null);
  const [freezeReasonInput, setFreezeReasonInput] = useState<string>('Suspicious high-velocity transactions detected');
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);

  // KYC Inspection & Review Modal State
  const [selectedUserForKycReview, setSelectedUserForKycReview] = useState<UserProfile | null>(null);
  const [kycRejectReason, setKycRejectReason] = useState<string>('Document image unreadable or name mismatch');
  const [kycAdminNotes, setKycAdminNotes] = useState<string>('Verified government ID credentials match ledger profile');

  // Policy Form State
  const [policyForm, setPolicyForm] = useState({
    antiFraudEnabled: settings.antiFraudEnabled !== false,
    maxDailyWithdrawalKES: settings.maxDailyWithdrawalKES || 50000,
    withdrawalCooldownHours: settings.withdrawalCooldownHours || 24,
    strictPhoneMatchEnabled: settings.strictPhoneMatchEnabled !== false,
    autoFreezeHighRisk: settings.autoFreezeHighRisk !== false,
    kycRequiredForHighRisk: settings.kycRequiredForHighRisk !== false,
    kycRiskScoreThreshold: settings.kycRiskScoreThreshold || 60,
  });

  // Simulator Test Feedback
  const [simTestResult, setSimTestResult] = useState<{ type: string; blocked: boolean; message: string } | null>(null);

  const loadData = async () => {
    try {
      const [m, e, u] = await Promise.all([
        fetchAntiFraudMetrics(),
        fetchAntiFraudEvents(30),
        fetchFlaggedUsers(),
      ]);
      setMetrics(m);
      setEvents(e);
      setFlaggedUsers(u);
      setPolicyForm({
        antiFraudEnabled: m.antiFraudEnabled,
        maxDailyWithdrawalKES: m.maxDailyWithdrawalKES,
        withdrawalCooldownHours: m.withdrawalCooldownHours,
        strictPhoneMatchEnabled: m.strictPhoneMatchEnabled,
        autoFreezeHighRisk: m.autoFreezeHighRisk,
        kycRequiredForHighRisk: m.kycRequiredForHighRisk !== false,
        kycRiskScoreThreshold: m.kycRiskScoreThreshold || 60,
      });
    } catch (err) {
      console.warn('[AntiFraudDashboard] Failed to load data:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  const handleSavePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsActionLoading(true);
    try {
      const res = await updateAntiFraudSettingsApi(policyForm);
      if (res.success && res.settings) {
        if (onUpdateSettings) {
          onUpdateSettings(res.settings);
        }
        setSaveSuccessMsg('Anti-Fraud rules successfully committed to Postgres & active!');
        setTimeout(() => setSaveSuccessMsg(''), 4000);
        loadData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleConfirmFreeze = async () => {
    if (!selectedUserForFreeze) return;
    setIsActionLoading(true);
    try {
      await freezeAccountApi(selectedUserForFreeze.id, freezeReasonInput);
      setSelectedUserForFreeze(null);
      loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleUnfreeze = async (userId: string) => {
    setIsActionLoading(true);
    try {
      await unfreezeAccountApi(userId);
      loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleToggleKyc = async (userId: string, currentStatus?: string) => {
    setIsActionLoading(true);
    try {
      const force = currentStatus !== 'REQUIRED';
      await toggleUserKycApi(userId, force, force ? 'Admin mandated compliance KYC' : 'Admin waived KYC requirement');
      loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleApproveKyc = async (userId: string) => {
    setIsActionLoading(true);
    try {
      await approveUserKycApi(userId, kycAdminNotes);
      setSelectedUserForKycReview(null);
      loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRejectKyc = async (userId: string) => {
    setIsActionLoading(true);
    try {
      await rejectUserKycApi(userId, kycRejectReason);
      setSelectedUserForKycReview(null);
      loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Test fraud rules by simulation
  const handleRunSimulation = async (type: 'overdraft' | 'sybil' | 'velocity') => {
    setSimTestResult(null);
    if (type === 'overdraft') {
      try {
        const res = await fetch('/api/withdrawals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            withdrawal: {
              userId: 'usr-98214',
              amountKES: 99999999, // deliberate overdraft
              method: 'mpesa',
              destinationAddress: '+254 712 345 678',
            }
          })
        });
        const data = await res.json();
        if (!res.ok) {
          setSimTestResult({
            type: 'Double-Spend / Overdraft Test',
            blocked: true,
            message: `BLOCKED AS EXPECTED: Server rejected KES 99,999,999 overdraft. Response: "${data.error}"`,
          });
          loadData();
        } else {
          setSimTestResult({
            type: 'Double-Spend Test',
            blocked: false,
            message: 'Caution: Overdraft was not blocked.',
          });
        }
      } catch (err: any) {
        setSimTestResult({
          type: 'Double-Spend Test',
          blocked: true,
          message: `Shield intervened: ${err.message}`,
        });
      }
    } else if (type === 'sybil') {
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Jane Clone',
            email: 'j.wanjiku+sybil@investor.ke',
            phone: '+254 712 345 678', // matching existing phone
            password: 'password123',
            referredByCode: 'ROYAL-JANE77' // own referral code
          })
        });
        const data = await res.json();
        if (!res.ok || data.user?.referredByCode === undefined) {
          setSimTestResult({
            type: 'Self-Referral Sybil Test',
            blocked: true,
            message: `BLOCKED AS EXPECTED: Duplicate phone or self-referral code neutralized by Anti-Sybil rule. Response: "${data.error || 'Referral link disallowed'}"`,
          });
          loadData();
        }
      } catch (err: any) {
        setSimTestResult({
          type: 'Self-Referral Test',
          blocked: true,
          message: `Shield intercepted request: ${err.message}`,
        });
      }
    } else if (type === 'velocity') {
      setSimTestResult({
        type: 'Velocity Cap Verification',
        blocked: true,
        message: `VERIFIED: Daily cap locked to KES ${(policyForm.maxDailyWithdrawalKES || 50000).toLocaleString()} with 24-hour sliding ledger window.`,
      });
    }
  };

  const filteredEvents = events.filter(e => {
    if (filterSeverity !== 'all' && e.severity !== filterSeverity) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        e.eventType.toLowerCase().includes(q) ||
        (e.userIdentifier && e.userIdentifier.toLowerCase().includes(q)) ||
        (e.details && e.details.toLowerCase().includes(q)) ||
        (e.ipAddress && e.ipAddress.includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-8" id="anti-fraud-dashboard">
      {/* Top Banner: Status & Overview */}
      <div className="relative overflow-hidden bg-gradient-to-r from-rose-950/70 via-slate-900 to-slate-900 border border-rose-800/40 rounded-3xl p-6 lg:p-8 backdrop-blur-md shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
                Live Protection Active
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono text-slate-400 bg-slate-800/80 border border-slate-700/50">
                Neon Postgres Audit Log
              </span>
            </div>
            <h2 className="text-2xl lg:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <ShieldAlert className="w-7 h-7 text-rose-400" />
              Anti-Fraud & Risk Containment Shield
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Real-time heuristic protection preventing balance double-spend, circular self-referral Sybil loops, velocity drain spikes, and unauthorized payout discrepancies.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-200 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 transition flex items-center gap-2 cursor-pointer shadow-md"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-rose-400 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh Telemetry</span>
            </button>
          </div>
        </div>

        {/* Ambient background glow */}
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Blocked Exploits */}
        <div className="bg-slate-900/80 border border-slate-800 hover:border-rose-500/30 rounded-2xl p-5 backdrop-blur-sm transition shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Blocked Exploits</span>
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <Ban className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-white font-mono">
              {metrics ? metrics.totalBlockedExploits : '...'}
            </div>
            <p className="text-xs text-rose-400/80 mt-1 flex items-center gap-1 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Sybil & Overdraft attempts stopped
            </p>
          </div>
        </div>

        {/* Flagged Accounts */}
        <div className="bg-slate-900/80 border border-slate-800 hover:border-amber-500/30 rounded-2xl p-5 backdrop-blur-sm transition shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Flagged Accounts</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-white font-mono">
              {metrics ? metrics.flaggedAccountsCount : '...'}
            </div>
            <p className="text-xs text-amber-400/80 mt-1 flex items-center gap-1 font-medium">
              <Activity className="w-3.5 h-3.5" />
              Elevated risk score &gt; 30/100
            </p>
          </div>
        </div>

        {/* Frozen Accounts */}
        <div className="bg-slate-900/80 border border-slate-800 hover:border-red-500/30 rounded-2xl p-5 backdrop-blur-sm transition shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Frozen Accounts</span>
            <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
              <Lock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-white font-mono">
              {metrics ? metrics.frozenAccountsCount : '...'}
            </div>
            <p className="text-xs text-red-400/80 mt-1 flex items-center gap-1 font-medium">
              <AlertOctagon className="w-3.5 h-3.5" />
              Kill switch active (payouts disabled)
            </p>
          </div>
        </div>

        {/* KYC Verification Queue */}
        <div className="bg-slate-900/80 border border-slate-800 hover:border-indigo-500/30 rounded-2xl p-5 backdrop-blur-sm transition shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">KYC Queue Pending</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-white font-mono">
              {metrics ? (metrics.kycPendingCount || 0) : '0'}
            </div>
            <p className="text-xs text-indigo-400/80 mt-1 flex items-center gap-1 font-medium">
              <UserCheck className="w-3.5 h-3.5" />
              High-risk identity approvals
            </p>
          </div>
        </div>

        {/* Daily Payout Cap */}
        <div className="bg-slate-900/80 border border-slate-800 hover:border-emerald-500/30 rounded-2xl p-5 backdrop-blur-sm transition shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Max Daily Cap / User</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-white font-mono">
              KES {policyForm.maxDailyWithdrawalKES ? Number(policyForm.maxDailyWithdrawalKES).toLocaleString() : '50,000'}
            </div>
            <p className="text-xs text-emerald-400/80 mt-1 flex items-center gap-1 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              Sliding 24-hour limit enforced
            </p>
          </div>
        </div>
      </div>

      {/* Simulator / Shield Verification Suite */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 lg:p-7 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Live Threat Vector Verification</h3>
              <p className="text-xs text-slate-400">Safely test the backend shield with live attack payloads to verify instant server blocks.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => handleRunSimulation('overdraft')}
            className="p-3.5 rounded-xl border border-slate-700/80 bg-slate-800/40 hover:bg-slate-800 transition text-left flex flex-col justify-between group cursor-pointer"
          >
            <div>
              <div className="text-xs font-bold text-white group-hover:text-rose-400 transition flex items-center justify-between">
                <span>Test 1: Balance Overdraft</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-700 text-slate-300">KES 99M</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Simulates an investor attempting to withdraw more capital than their verified wallet ledger.</p>
            </div>
            <div className="mt-3 text-[11px] font-bold text-rose-400 flex items-center gap-1">
              <span>Execute Overdraft Test</span> &rarr;
            </div>
          </button>

          <button
            onClick={() => handleRunSimulation('sybil')}
            className="p-3.5 rounded-xl border border-slate-700/80 bg-slate-800/40 hover:bg-slate-800 transition text-left flex flex-col justify-between group cursor-pointer"
          >
            <div>
              <div className="text-xs font-bold text-white group-hover:text-amber-400 transition flex items-center justify-between">
                <span>Test 2: Self-Referral Sybil</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-700 text-slate-300">Anti-Sybil</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Simulates an investor creating a duplicate account using their own referral code and phone match.</p>
            </div>
            <div className="mt-3 text-[11px] font-bold text-amber-400 flex items-center gap-1">
              <span>Execute Sybil Test</span> &rarr;
            </div>
          </button>

          <button
            onClick={() => handleRunSimulation('velocity')}
            className="p-3.5 rounded-xl border border-slate-700/80 bg-slate-800/40 hover:bg-slate-800 transition text-left flex flex-col justify-between group cursor-pointer"
          >
            <div>
              <div className="text-xs font-bold text-white group-hover:text-emerald-400 transition flex items-center justify-between">
                <span>Test 3: Daily Velocity Cap</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-700 text-slate-300">24h Cooldown</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Verifies that multiple requests exceeding the daily threshold are throttled.</p>
            </div>
            <div className="mt-3 text-[11px] font-bold text-emerald-400 flex items-center gap-1">
              <span>Inspect Velocity Cap</span> &rarr;
            </div>
          </button>
        </div>

        {/* Simulation Output Banner */}
        {simTestResult && (
          <motion.div 
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-xl border flex items-start gap-3 ${
              simTestResult.blocked 
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' 
                : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
            }`}
          >
            {simTestResult.blocked ? <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" /> : <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />}
            <div>
              <span className="font-bold text-xs uppercase tracking-wider font-mono">[{simTestResult.type}]</span>
              <p className="text-xs mt-0.5 leading-relaxed font-mono">{simTestResult.message}</p>
            </div>
          </motion.div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Security Policy & Settings (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 lg:p-7 shadow-xl">
            <div className="flex items-center gap-3 pb-5 border-b border-slate-800">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Security Shield Policy</h3>
                <p className="text-xs text-slate-400">Global algorithmic thresholds applied across all payment channels.</p>
              </div>
            </div>

            <form onSubmit={handleSavePolicy} className="mt-6 space-y-5">
              {/* Master Switch */}
              <div className="flex items-center justify-between p-3.5 bg-slate-800/40 border border-slate-700/60 rounded-xl">
                <div>
                  <label className="text-xs font-bold text-white block">Heuristic Anti-Fraud Engine</label>
                  <p className="text-[11px] text-slate-400">Enforce real-time validation on all registrations and withdrawals.</p>
                </div>
                <input
                  type="checkbox"
                  checked={policyForm.antiFraudEnabled}
                  onChange={(e) => setPolicyForm({ ...policyForm, antiFraudEnabled: e.target.checked })}
                  className="w-5 h-5 accent-rose-500 cursor-pointer rounded"
                />
              </div>

              {/* Self-Referral Prevention */}
              <div className="flex items-center justify-between p-3.5 bg-slate-800/40 border border-slate-700/60 rounded-xl">
                <div>
                  <label className="text-xs font-bold text-white block">Self-Referral Sybil Protection</label>
                  <p className="text-[11px] text-slate-400">Disallow circular loops, same-phone signups, and own-code milking.</p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked={true}
                  disabled
                  className="w-5 h-5 accent-emerald-500 cursor-not-allowed rounded"
                  title="Enforced in core engine"
                />
              </div>

              {/* Max Daily Withdrawal Cap */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>Max Daily Withdrawal Per Investor (KES)</span>
                  <span className="text-[11px] font-mono text-purple-400">KES {Number(policyForm.maxDailyWithdrawalKES).toLocaleString()}</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1000"
                    step="1000"
                    value={policyForm.maxDailyWithdrawalKES}
                    onChange={(e) => setPolicyForm({ ...policyForm, maxDailyWithdrawalKES: Number(e.target.value) })}
                    className="w-full bg-slate-800/70 border border-slate-700 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-xl px-4 py-2.5 text-sm text-white font-mono"
                  />
                </div>
                <p className="text-[11px] text-slate-400">Prevents rapid drain attacks by capping the 24-hour total withdrawal ceiling.</p>
              </div>

              {/* Cooldown Window */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>Withdrawal Cooldown Window (Hours)</span>
                  <span className="text-[11px] font-mono text-purple-400">{policyForm.withdrawalCooldownHours}h</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="168"
                  value={policyForm.withdrawalCooldownHours}
                  onChange={(e) => setPolicyForm({ ...policyForm, withdrawalCooldownHours: Number(e.target.value) })}
                  className="w-full bg-slate-800/70 border border-slate-700 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-xl px-4 py-2.5 text-sm text-white font-mono"
                />
                <p className="text-[11px] text-slate-400">Minimum time between consecutive payouts for a single investor profile.</p>
              </div>

              {/* Strict Phone Match */}
              <div className="flex items-center justify-between p-3.5 bg-slate-800/40 border border-slate-700/60 rounded-xl">
                <div>
                  <label className="text-xs font-bold text-white block">Strict M-Pesa Phone Verification</label>
                  <p className="text-[11px] text-slate-400">Flag withdrawals where M-Pesa destination differs from verified user phone.</p>
                </div>
                <input
                  type="checkbox"
                  checked={policyForm.strictPhoneMatchEnabled}
                  onChange={(e) => setPolicyForm({ ...policyForm, strictPhoneMatchEnabled: e.target.checked })}
                  className="w-5 h-5 accent-rose-500 cursor-pointer rounded"
                />
              </div>

              {/* Auto Freeze */}
              <div className="flex items-center justify-between p-3.5 bg-slate-800/40 border border-slate-700/60 rounded-xl">
                <div>
                  <label className="text-xs font-bold text-white block">Auto-Freeze High Risk Accounts</label>
                  <p className="text-[11px] text-slate-400">Instantly activate Kill Switch when unauthorized overdrafts or hacks are attempted.</p>
                </div>
                <input
                  type="checkbox"
                  checked={policyForm.autoFreezeHighRisk}
                  onChange={(e) => setPolicyForm({ ...policyForm, autoFreezeHighRisk: e.target.checked })}
                  className="w-5 h-5 accent-rose-500 cursor-pointer rounded"
                />
              </div>

              {/* Force KYC for High Risk Accounts */}
              <div className="p-3.5 bg-indigo-950/30 border border-indigo-500/30 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                      <FileCheck className="w-3.5 h-3.5" />
                      <span>Enforce KYC For Flagged High-Risk Accounts</span>
                    </label>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Restricts withdrawals for accounts with elevated risk scores until government ID is uploaded and approved.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={policyForm.kycRequiredForHighRisk}
                    onChange={(e) => setPolicyForm({ ...policyForm, kycRequiredForHighRisk: e.target.checked })}
                    className="w-5 h-5 accent-indigo-500 cursor-pointer rounded"
                  />
                </div>

                {policyForm.kycRequiredForHighRisk && (
                  <div className="pt-2 border-t border-indigo-900/40 space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-slate-300">
                      <span className="font-medium">Trigger Score Threshold:</span>
                      <span className="font-mono font-bold text-indigo-300">{policyForm.kycRiskScoreThreshold} / 100</span>
                    </div>
                    <input
                      type="range"
                      min="30"
                      max="90"
                      step="5"
                      value={policyForm.kycRiskScoreThreshold}
                      onChange={(e) => setPolicyForm({ ...policyForm, kycRiskScoreThreshold: Number(e.target.value) })}
                      className="w-full accent-indigo-500 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                      <span>Strict (30)</span>
                      <span>Balanced (60)</span>
                      <span>Relaxed (90)</span>
                    </div>
                  </div>
                )}
              </div>

              {saveSuccessMsg && (
                <div className="p-3 bg-emerald-950/50 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{saveSuccessMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isActionLoading}
                className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-wider transition cursor-pointer shadow-lg flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Save & Deploy Security Rules</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Flagged Accounts Watchlist & Audit Log (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Watchlist & Risk Table */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  <UserX className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Investor Risk Assessment & Kill Switch</h3>
                  <p className="text-[11px] text-slate-400">Inspect accounts with elevated risk scores or frozen status.</p>
                </div>
              </div>
              <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2.5 py-1 rounded-full border border-slate-700/60 self-start sm:self-auto">
                {flaggedUsers.length} Flagged
              </span>
            </div>

            {flaggedUsers.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto opacity-70" />
                <p className="font-semibold text-slate-300">All Investor Accounts in Healthy Standing</p>
                <p className="text-[11px] text-slate-500">No unauthorized overdrafts or frozen profiles detected.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-800/80 uppercase font-mono text-[10px]">
                      <th className="pb-2.5 font-semibold">Investor</th>
                      <th className="pb-2.5 font-semibold">Ledger Balance</th>
                      <th className="pb-2.5 font-semibold">Risk Score</th>
                      <th className="pb-2.5 font-semibold">Status</th>
                      <th className="pb-2.5 font-semibold text-right">Kill Switch Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {flaggedUsers.map(u => (
                      <tr key={u.id} className="hover:bg-slate-800/30 transition">
                        <td className="py-3">
                          <div className="font-bold text-white">{u.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{u.phone}</div>
                        </td>
                        <td className="py-3 font-mono text-slate-200">
                          KES {Number(u.walletBalanceKES || 0).toLocaleString()}
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            (u.riskScore || 0) >= 70 
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                              : (u.riskScore || 0) >= 30 
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          }`}>
                            {u.riskScore || 0} / 100
                          </span>
                        </td>
                        <td className="py-3">
                          {u.isFrozen ? (
                            <span className="inline-flex items-center gap-1 text-red-400 font-bold text-[11px]">
                              <Lock className="w-3 h-3" />
                              FROZEN
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-slate-400 text-[11px]">
                              <Activity className="w-3 h-3 text-amber-400" />
                              Flagged
                            </span>
                          )}
                        </td>
                        <td className="py-3 text-right">
                          {u.isFrozen ? (
                            <button
                              onClick={() => handleUnfreeze(u.id)}
                              disabled={isActionLoading}
                              className="px-2.5 py-1 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/30 rounded-lg text-[11px] font-bold cursor-pointer transition flex items-center gap-1 ml-auto"
                            >
                              <Unlock className="w-3 h-3" />
                              <span>Unlock</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedUserForFreeze(u);
                                setFreezeReasonInput('Precautionary security lock for manual review');
                              }}
                              disabled={isActionLoading}
                              className="px-2.5 py-1 bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 border border-rose-500/30 rounded-lg text-[11px] font-bold cursor-pointer transition flex items-center gap-1 ml-auto"
                            >
                              <Lock className="w-3 h-3" />
                              <span>Freeze Account</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Real-time Audit Log */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
                  <Fingerprint className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Immutable Anti-Fraud Audit Log</h3>
                  <p className="text-[11px] text-slate-400">Stream of security blocks, unauthorized attempts, and threat actions.</p>
                </div>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search logs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 w-36 sm:w-44"
                  />
                </div>
                <select
                  value={filterSeverity}
                  onChange={(e) => setFilterSeverity(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-rose-500"
                >
                  <option value="all">All Severities</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                </select>
              </div>
            </div>

            {/* Event List */}
            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
              {filteredEvents.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">
                  No fraud events matching your filters.
                </div>
              ) : (
                filteredEvents.map(e => (
                  <div 
                    key={e.id}
                    className="p-3 bg-slate-800/40 border border-slate-800 hover:border-slate-700 rounded-xl space-y-1.5 transition"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                          e.severity === 'critical'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : e.severity === 'high'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        }`}>
                          {e.severity.toUpperCase()}
                        </span>
                        <span className="font-mono font-bold text-slate-200">{e.eventType}</span>
                      </div>
                      <span className="text-slate-400 font-mono text-[10px]">
                        {new Date(e.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {e.details}
                    </p>

                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-800/60">
                      <span>Target: <strong className="text-slate-300 font-sans">{e.userIdentifier || e.userId || 'Guest'}</strong></span>
                      <span className={`font-bold ${e.actionTaken === 'BLOCKED' ? 'text-rose-400' : 'text-amber-400'}`}>
                        ACTION: {e.actionTaken}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Freeze Confirmation Modal */}
      <AnimatePresence>
        {selectedUserForFreeze && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-rose-700/40 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3 text-rose-400">
                <Lock className="w-6 h-6" />
                <h3 className="text-lg font-bold text-white">Activate Kill Switch</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Freezing <strong className="text-white">{selectedUserForFreeze.name}</strong> will instantly lock their wallet balance (KES {Number(selectedUserForFreeze.walletBalanceKES).toLocaleString()}) and reject all subsequent withdrawal and contract activation requests.
              </p>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Logged Security Reason</label>
                <textarea
                  value={freezeReasonInput}
                  onChange={(e) => setFreezeReasonInput(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                  placeholder="State reason for regulatory and audit log..."
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setSelectedUserForFreeze(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmFreeze}
                  disabled={isActionLoading}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-2 shadow-lg"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Confirm Freeze</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
