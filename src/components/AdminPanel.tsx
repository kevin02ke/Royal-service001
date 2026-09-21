import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sliders, 
  Settings2, 
  Layers, 
  Edit3, 
  Check, 
  Plus, 
  Trash2, 
  AlertCircle, 
  Clock, 
  CheckCircle, 
  DollarSign, 
  Percent,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  ArrowUpRight,
  MessageSquare,
  X,
  Database,
  Copy,
  Zap,
  Terminal,
  ShieldAlert
} from 'lucide-react';
import { InvestmentPackage, PlatformSettings, WithdrawalRequest, UserProfile } from '../types';
import { AdminCommunicationCenter } from './AdminCommunicationCenter';
import { DatabaseDashboard } from './DatabaseDashboard';
import { ApiExplorerView } from './ApiExplorerView';
import { AntiFraudDashboard } from './AntiFraudDashboard';
import { chatService } from '../services/chatService';

interface AdminPanelProps {
  user?: UserProfile;
  packages: InvestmentPackage[];
  settings: PlatformSettings;
  withdrawals: WithdrawalRequest[];
  onUpdatePackage: (pkg: InvestmentPackage) => void;
  onCreatePackage: (pkg: InvestmentPackage) => void;
  onDeletePackage: (id: string) => void;
  onUpdateSettings: (newSettings: PlatformSettings) => void;
  onApproveWithdrawal: (id: string) => void;
  onRejectWithdrawal: (id: string, reason: string) => void;
  onSwitchToInvestorView: () => void;
  onResetPackages?: () => void;
  isApiConnected?: boolean;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  user,
  packages,
  settings,
  withdrawals,
  onUpdatePackage,
  onCreatePackage,
  onDeletePackage,
  onUpdateSettings,
  onApproveWithdrawal,
  onRejectWithdrawal,
  onSwitchToInvestorView,
  onResetPackages,
  isApiConnected = true,
}) => {
  const [activeAdminTab, setActiveAdminTab] = useState<'database' | 'packages' | 'commissions' | 'withdrawals' | 'communication' | 'settings' | 'api' | 'antifraud'>('database');
  const [unreadAdminCount, setUnreadAdminCount] = useState<number>(0);

  useEffect(() => {
    const checkUnread = async () => {
      try {
        const threads = await chatService.getAllThreads();
        const total = threads.reduce((acc, t) => acc + (t.unreadCountAdmin || 0), 0);
        setUnreadAdminCount(total);
      } catch (err) {
        // ignore
      }
    };

    checkUnread();
    const interval = setInterval(checkUnread, 3500);
    const unsubscribe = chatService.subscribe(() => checkUnread());

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, []);

  // Edit package state
  const [editingPkg, setEditingPkg] = useState<InvestmentPackage | null>(null);

  // Delete package confirmation modal state
  const [deletingPkg, setDeletingPkg] = useState<InvestmentPackage | null>(null);

  // New package modal state
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newPkgForm, setNewPkgForm] = useState<Omit<InvestmentPackage, 'id'>>({
    name: 'Silver',
    tag: 'Popular',
    priceKES: 1300,
    dailyRoiPercent: 3.0,
    durationDays: 30,
    description: 'Balanced daily yield contract offering 3% daily returns for 30 days.',
    isActive: true,
    color: 'from-slate-400 to-slate-600',
    features: ['Daily 3.0% return (KES 39/day)', 'Total Return: KES 2,470 (190%)', 'Contract cycle: 30 Days'],
  });

  // Settings form state
  const [settingsForm, setSettingsForm] = useState<PlatformSettings>({ ...settings });
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Synchronize settingsForm when parent settings change
  useEffect(() => {
    setSettingsForm({ ...settings });
  }, [settings]);

  // Access Guard: Strict RBAC check - Only 'admin' and 'support' accounts are allowed
  if (user && user.role !== 'admin' && user.role !== 'support') {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-[#0d1320] border border-rose-500/30 rounded-2xl text-center space-y-4 shadow-2xl">
        <div className="w-14 h-14 mx-auto rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white">Administrative Access Restricted</h2>
        <p className="text-xs text-slate-300 leading-relaxed">
          The Admin Console, REST API controls, and parameter management tools are strictly confidential 
          and restricted to verified <strong>Master Administrator</strong> and <strong>VIP Support Staff</strong> accounts.
        </p>
        <p className="text-[11px] text-slate-400">
          Current logged in account: <span className="font-mono text-emerald-400">{user.email || user.phone}</span> (Role: <span className="font-mono text-amber-400 uppercase">{user.role || 'user'}</span>)
        </p>
        <div className="pt-2">
          <button
            onClick={onSwitchToInvestorView}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-lg"
          >
            Return to Investor Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Handle saving package edit
  const handleSavePackageEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPkg) return;
    onUpdatePackage(editingPkg);
    setEditingPkg(null);
  };

  // Handle creating new package
  const handleCreatePackageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = `pkg-${Date.now()}`;
    onCreatePackage({
      id,
      ...newPkgForm,
    });
    setIsAddingNew(false);
  };

  // Handle settings update
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(settingsForm);
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2500);
  };

  const isMasterAdmin = !user || user.role === 'admin';

  return (
    <div className="space-y-6">
      {/* Admin Header Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-[#130f26] via-[#0d1320] to-[#0a0e17] text-white rounded-2xl p-6 sm:p-7 border border-purple-500/20 shadow-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/15 text-purple-300 text-xs font-semibold border border-purple-500/30">
            <Sliders className="w-3.5 h-3.5" />
            <span>
              {user?.role === 'support' 
                ? 'VIP Support & Staff Operations Desk' 
                : 'Master Console & ROI Engine'}
            </span>
            <span className="ml-1 px-1.5 py-0.2 bg-purple-400/20 text-purple-200 text-[10px] rounded font-mono">
              {user?.role ? user.role.toUpperCase() : 'ADMIN'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            {user?.role === 'support' ? 'Support Desk & Member Operations' : 'Platform Operations & Parameter Tuning'}
          </h1>
          <p className="text-xs text-slate-300 max-w-xl">
            {user?.role === 'support' 
              ? `Operational console for ${user.name}. Manage member inquiries, monitor B2C disbarsals, and review risk alerts.`
              : 'Real-time management for daily ROI percentages, contract duration terms, multi-tier referral commissions, and instant payouts.'}
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onSwitchToInvestorView}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-bold transition cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.25)] flex items-center gap-1.5 shrink-0 relative z-10"
        >
          <span>Investor Portal</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </motion.button>
      </motion.div>

      {/* Admin Navigation Tabs */}
      <div className="flex bg-[#0d1320] rounded-2xl p-1.5 border border-slate-800 gap-1.5 overflow-x-auto">
        <button
          id="admin-tab-database"
          onClick={() => setActiveAdminTab('database')}
          className={`py-2.5 px-4 text-xs font-bold rounded-xl transition cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeAdminTab === 'database'
              ? 'bg-purple-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <Database className="w-4 h-4 text-emerald-400" />
          <span>Database Dashboard</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </button>

        <button
          id="admin-tab-packages"
          onClick={() => setActiveAdminTab('packages')}
          className={`py-2.5 px-4 text-xs font-bold rounded-xl transition cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeAdminTab === 'packages'
              ? 'bg-purple-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Packages & ROI Tuning</span>
        </button>

        <button
          id="admin-tab-commissions"
          onClick={() => setActiveAdminTab('commissions')}
          className={`py-2.5 px-4 text-xs font-bold rounded-xl transition cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeAdminTab === 'commissions'
              ? 'bg-purple-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <Percent className="w-4 h-4" />
          <span>Multi-Tier Commission Structure</span>
        </button>

        <button
          id="admin-tab-withdrawals"
          onClick={() => setActiveAdminTab('withdrawals')}
          className={`py-2.5 px-4 text-xs font-bold rounded-xl transition cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeAdminTab === 'withdrawals'
              ? 'bg-purple-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Withdrawal Processing ({withdrawals.filter(w => w.status === 'processing' || w.status === 'pending').length})</span>
        </button>

        <button
          id="admin-tab-communication"
          onClick={() => setActiveAdminTab('communication')}
          className={`py-2.5 px-4 text-xs font-bold rounded-xl transition cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeAdminTab === 'communication'
              ? 'bg-purple-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Communication Center</span>
          {unreadAdminCount > 0 && (
            <span className="px-1.5 py-0.5 bg-emerald-500 text-slate-950 rounded-full font-mono text-[10px] font-bold animate-pulse">
              {unreadAdminCount}
            </span>
          )}
        </button>

        <button
          id="admin-tab-settings"
          onClick={() => setActiveAdminTab('settings')}
          className={`py-2.5 px-4 text-xs font-bold rounded-xl transition cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeAdminTab === 'settings'
              ? 'bg-purple-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <Settings2 className="w-4 h-4" />
          <span>Global Thresholds</span>
        </button>

        <button
          id="admin-tab-api"
          onClick={() => setActiveAdminTab('api')}
          className={`py-2.5 px-4 text-xs font-bold rounded-xl transition cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeAdminTab === 'api'
              ? 'bg-emerald-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span>REST API Console & Docs</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </button>

        <button
          id="admin-tab-antifraud"
          onClick={() => setActiveAdminTab('antifraud')}
          className={`py-2.5 px-4 text-xs font-bold rounded-xl transition cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeAdminTab === 'antifraud'
              ? 'bg-rose-600 text-white shadow-lg'
              : 'text-rose-400 hover:text-white hover:bg-rose-950/40 border border-rose-900/40'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-rose-400" />
          <span>Anti-Fraud & Risk Shield</span>
          <span className="px-1.5 py-0.5 bg-rose-500/20 text-rose-300 rounded-full font-mono text-[10px] font-bold border border-rose-500/30">
            PROD
          </span>
        </button>
      </div>

      {/* Tab 0: Database Dashboard & Health Monitor */}
      {activeAdminTab === 'database' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <DatabaseDashboard />
        </motion.div>
      )}

      {/* Tab 1: Packages & Dynamic ROI Tuning */}
      {activeAdminTab === 'packages' && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0d1320] p-5 rounded-2xl border border-slate-800">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-white text-base">Active Investment Packages</h3>
                {isApiConnected ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    API Synced (/api/packages)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    Local Storage
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Configure package properties like name (Silver), cost (KES 1,300), daily ROI % (3%), and contract duration (30 days).
              </p>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              {onResetPackages && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  id="btn-reset-packages-defaults"
                  onClick={onResetPackages}
                  className="px-3.5 py-2 bg-[#121929] hover:bg-[#182338] text-slate-300 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  title="Reset packages to default factory plans"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                  <span>Reset Defaults</span>
                </motion.button>
              )}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                id="btn-open-create-pkg"
                onClick={() => setIsAddingNew(true)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-[0_0_15px_rgba(168,85,247,0.25)]"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Plan</span>
              </motion.button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {packages.map((pkg) => (
              <motion.div
                key={pkg.id}
                id={`admin-pkg-card-${pkg.id}`}
                whileHover={{ y: -2 }}
                className="bg-[#0d1320] rounded-2xl border border-slate-800 p-5 shadow-lg flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-white text-base">{pkg.name}</h4>
                        {pkg.tag && (
                          <span className="text-[10px] bg-purple-500/15 border border-purple-500/30 text-purple-300 font-semibold px-2 py-0.5 rounded-full">
                            {pkg.tag}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{pkg.description}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                      pkg.isActive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                    }`}>
                      {pkg.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </div>

                  {/* Key Metrics Display */}
                  <div className="grid grid-cols-3 gap-2 p-3 bg-[#0a0e17] rounded-xl border border-slate-800 text-xs mb-3">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Package Cost</span>
                      <span className="font-bold text-white font-mono">KES {pkg.priceKES.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Daily ROI</span>
                      <span className="font-bold text-emerald-400 font-mono">{pkg.dailyRoiPercent}% / day</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Duration</span>
                      <span className="font-bold text-white font-mono">{pkg.durationDays} Days</span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-300 space-y-1">
                    <div>• Daily Payout: <strong className="text-emerald-400 font-mono">KES {(pkg.priceKES * (pkg.dailyRoiPercent/100)).toFixed(1)} / day</strong></div>
                    <div>• Total Cycle Return: <strong className="text-white font-mono">KES {(pkg.priceKES * (pkg.dailyRoiPercent/100) * pkg.durationDays).toFixed(1)}</strong> ({((pkg.dailyRoiPercent * pkg.durationDays)).toFixed(0)}%)</div>
                    <div className="text-[10px] text-amber-400/90">• Capital: Expired at Day {pkg.durationDays} (Non-refundable)</div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      onUpdatePackage({
                        ...pkg,
                        isActive: !pkg.isActive,
                      });
                    }}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition cursor-pointer ${
                      pkg.isActive 
                        ? 'border-slate-700 text-slate-300 hover:bg-slate-800' 
                        : 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20'
                    }`}
                  >
                    {pkg.isActive ? 'Pause Offer' : 'Activate Offer'}
                  </button>

                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      id={`btn-edit-pkg-${pkg.id}`}
                      onClick={() => setEditingPkg(pkg)}
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Parameters</span>
                    </motion.button>
                    {packages.length > 1 && (
                      <button
                        id={`btn-delete-pkg-${pkg.id}`}
                        onClick={() => setDeletingPkg(pkg)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition cursor-pointer"
                        title="Delete package"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Edit Package Modal */}
      {editingPkg && (
        <AnimatePresence>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              onClick={() => setEditingPkg(null)} 
              className="absolute inset-0 bg-black/80 backdrop-blur-md" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              className="relative bg-[#0d121d] rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-800 z-10 space-y-4"
            >
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-white text-base">
                  Adjust Contract Parameters
                </h3>
                <button onClick={() => setEditingPkg(null)} className="text-slate-400 hover:text-white p-1">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-slate-400">
                Modify pricing, daily returns, or duration for {editingPkg.name}.
              </p>

              <form onSubmit={handleSavePackageEdit} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Package Name</label>
                  <input
                    type="text"
                    value={editingPkg.name}
                    onChange={(e) => setEditingPkg({ ...editingPkg, name: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0a0e17] border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Price (KES)</label>
                    <input
                      id="input-edit-pkg-price"
                      type="number"
                      value={editingPkg.priceKES}
                      onChange={(e) => setEditingPkg({ ...editingPkg, priceKES: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-[#0a0e17] border border-slate-700/80 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                      min={1}
                      step={1}
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Daily ROI (%)</label>
                    <input
                      id="input-edit-pkg-roi"
                      type="number"
                      value={editingPkg.dailyRoiPercent}
                      onChange={(e) => setEditingPkg({ ...editingPkg, dailyRoiPercent: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-[#0a0e17] border border-slate-700/80 rounded-xl text-xs text-emerald-400 font-mono font-bold focus:outline-none focus:border-emerald-500"
                      min={0.1}
                      max={20}
                      step={0.1}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Duration (Days)</label>
                    <input
                      id="input-edit-pkg-duration"
                      type="number"
                      value={editingPkg.durationDays}
                      onChange={(e) => setEditingPkg({ ...editingPkg, durationDays: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-[#0a0e17] border border-slate-700/80 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                      min={1}
                      max={365}
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Badge / Tag</label>
                    <input
                      type="text"
                      value={editingPkg.tag || ''}
                      onChange={(e) => setEditingPkg({ ...editingPkg, tag: e.target.value })}
                      className="w-full px-3 py-2 bg-[#0a0e17] border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                      placeholder="e.g. Most Popular"
                    />
                  </div>
                </div>

                {/* Live Calculations Preview */}
                <div className="p-3 bg-[#111726] rounded-xl border border-slate-800 text-[11px] text-slate-300 space-y-1 font-mono">
                  <div>Calculated Daily Yield: <strong className="text-emerald-400">KES {(editingPkg.priceKES * (editingPkg.dailyRoiPercent/100)).toFixed(1)} / day</strong></div>
                  <div>Calculated Total Payout: <strong className="text-white">KES {(editingPkg.priceKES * (editingPkg.dailyRoiPercent/100) * editingPkg.durationDays).toFixed(1)}</strong> over {editingPkg.durationDays} days ({((editingPkg.dailyRoiPercent * editingPkg.durationDays)).toFixed(0)}%)</div>
                  <div className="text-amber-400/90 text-[10px] pt-0.5">Capital Policy: Contract expires on Day {editingPkg.durationDays} (Capital is not returned)</div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingPkg(null)}
                    className="flex-1 py-2 px-3 border border-slate-700 rounded-xl text-slate-300 text-xs font-semibold hover:bg-slate-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    id="btn-save-pkg-changes"
                    className="flex-1 py-2 px-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold cursor-pointer shadow-lg"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </AnimatePresence>
      )}

      {/* Create New Package Modal */}
      {isAddingNew && (
        <AnimatePresence>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              onClick={() => setIsAddingNew(false)} 
              className="absolute inset-0 bg-black/80 backdrop-blur-md" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              className="relative bg-[#0d121d] rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-800 z-10 space-y-4"
            >
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-white text-base">
                  Add New Investment Plan
                </h3>
                <button onClick={() => setIsAddingNew(false)} className="text-slate-400 hover:text-white p-1">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Presets */}
              <div className="p-3 bg-[#0a0e17] rounded-xl border border-slate-800">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  Quick Presets:
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewPkgForm({
                      name: 'Royal Silver',
                      tag: 'Most Popular',
                      priceKES: 900,
                      dailyRoiPercent: 10.0,
                      durationDays: 20,
                      description: 'Contract pays KES 90/day for exactly 20 days (KES 1,800 total). Capital expires upon completion without separate refund.',
                      isActive: true,
                      color: 'from-emerald-500 to-teal-700',
                      features: ['Daily 10.0% return (KES 90/day)', 'Total Payout: KES 1,800 (200%)', 'Contract cycle: 20 Days', 'Capital Non-Refundable • Expired at term'],
                    })}
                    className="py-1.5 px-2 bg-[#111726] hover:bg-[#162033] border border-slate-700/80 rounded-lg text-[11px] font-semibold text-slate-200 transition cursor-pointer text-center"
                  >
                    Silver (900 • 10% / 20d)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewPkgForm({
                      name: 'Royal Bronze',
                      tag: 'Starter Tier',
                      priceKES: 500,
                      dailyRoiPercent: 8.0,
                      durationDays: 20,
                      description: 'Entry package paying KES 40/day for 20 days. Capital is non-refundable; contract expires upon completion.',
                      isActive: true,
                      color: 'from-amber-600 to-amber-700',
                      features: ['Daily 8.0% return (KES 40/day)', 'Total Payout: KES 800 (160%)', 'Contract cycle: 20 Days', 'Capital Non-Refundable • Expired at term'],
                    })}
                    className="py-1.5 px-2 bg-[#111726] hover:bg-[#162033] border border-slate-700/80 rounded-lg text-[11px] font-semibold text-slate-200 transition cursor-pointer text-center"
                  >
                    Bronze (500 • 8% / 20d)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewPkgForm({
                      name: 'Royal Gold',
                      tag: 'High Yield',
                      priceKES: 2500,
                      dailyRoiPercent: 10.0,
                      durationDays: 20,
                      description: 'High yield package paying KES 250/day for 20 days (KES 5,000 total). Capital non-refundable.',
                      isActive: true,
                      color: 'from-yellow-500 to-amber-600',
                      features: ['Daily 10.0% return (KES 250/day)', 'Total Payout: KES 5,000 (200%)', 'Contract cycle: 20 Days', 'Capital Non-Refundable • Expired at term'],
                    })}
                    className="py-1.5 px-2 bg-[#111726] hover:bg-[#162033] border border-slate-700/80 rounded-lg text-[11px] font-semibold text-slate-200 transition cursor-pointer text-center"
                  >
                    Gold (2.5k • 10% / 20d)
                  </button>
                </div>
              </div>

              <form onSubmit={handleCreatePackageSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Plan Name (e.g. 'Silver')
                  </label>
                  <input
                    id="input-new-pkg-name"
                    type="text"
                    value={newPkgForm.name}
                    onChange={(e) => setNewPkgForm({ ...newPkgForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0a0e17] border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                    placeholder="e.g. Silver or Diamond"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">
                      Cost (KES) (e.g. 1300)
                    </label>
                    <input
                      id="input-new-pkg-cost"
                      type="number"
                      value={newPkgForm.priceKES}
                      onChange={(e) => setNewPkgForm({ ...newPkgForm, priceKES: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-[#0a0e17] border border-slate-700/80 rounded-xl text-xs font-bold text-white font-mono focus:outline-none focus:border-emerald-500"
                      min={1}
                      step={1}
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">
                      Daily ROI (%) (e.g. 3%)
                    </label>
                    <input
                      id="input-new-pkg-roi"
                      type="number"
                      value={newPkgForm.dailyRoiPercent}
                      onChange={(e) => setNewPkgForm({ ...newPkgForm, dailyRoiPercent: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-[#0a0e17] border border-slate-700/80 rounded-xl text-xs font-bold text-emerald-400 font-mono focus:outline-none focus:border-emerald-500"
                      min={0.1}
                      max={20}
                      step={0.1}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">
                      Duration (Days) (e.g. 30)
                    </label>
                    <input
                      id="input-new-pkg-duration"
                      type="number"
                      value={newPkgForm.durationDays}
                      onChange={(e) => setNewPkgForm({ ...newPkgForm, durationDays: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-[#0a0e17] border border-slate-700/80 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                      min={1}
                      max={365}
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Tag / Badge</label>
                    <input
                      id="input-new-pkg-tag"
                      type="text"
                      value={newPkgForm.tag || ''}
                      onChange={(e) => setNewPkgForm({ ...newPkgForm, tag: e.target.value })}
                      className="w-full px-3 py-2 bg-[#0a0e17] border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                      placeholder="e.g. Most Popular"
                    />
                  </div>
                </div>

                {/* Live Calculations Preview */}
                <div className="p-3 bg-[#111726] rounded-xl border border-slate-800 text-[11px] text-slate-300 space-y-1 font-mono">
                  <div>Calculated Daily Payout: <strong className="text-emerald-400">KES {(newPkgForm.priceKES * (newPkgForm.dailyRoiPercent/100)).toFixed(1)} / day</strong></div>
                  <div>Calculated Total Payout: <strong className="text-white">KES {(newPkgForm.priceKES * (newPkgForm.dailyRoiPercent/100) * newPkgForm.durationDays).toFixed(1)}</strong> over {newPkgForm.durationDays} days ({((newPkgForm.dailyRoiPercent * newPkgForm.durationDays)).toFixed(0)}%)</div>
                  <div className="text-amber-400/90 text-[10px] pt-0.5">Capital Policy: Contract expires on Day {newPkgForm.durationDays} (Capital is not returned)</div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingNew(false)}
                    className="flex-1 py-2 px-3 border border-slate-700 rounded-xl text-slate-300 text-xs font-semibold hover:bg-slate-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    id="btn-submit-create-pkg"
                    type="submit"
                    className="flex-1 py-2 px-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold cursor-pointer shadow-lg"
                  >
                    Deploy Package
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </AnimatePresence>
      )}

      {/* Delete Package Confirmation Modal */}
      {deletingPkg && (
        <AnimatePresence>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              onClick={() => setDeletingPkg(null)} 
              className="absolute inset-0 bg-black/80 backdrop-blur-md" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              className="relative bg-[#0d121d] rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-800 z-10 space-y-4"
            >
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">
                  Delete Package: {deletingPkg.name}?
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Are you sure you want to remove this package? Active user contracts will continue until expiration.
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingPkg(null)}
                  className="flex-1 py-2 px-3 border border-slate-700 rounded-xl text-slate-300 text-xs font-semibold hover:bg-slate-800 cursor-pointer"
                >
                  Keep Package
                </button>
                <button
                  id="btn-confirm-delete-pkg"
                  type="button"
                  onClick={() => {
                    onDeletePackage(deletingPkg.id);
                    setDeletingPkg(null);
                  }}
                  className="flex-1 py-2 px-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold cursor-pointer shadow-lg"
                >
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </div>
        </AnimatePresence>
      )}

      {/* Tab 2: Multi-Tier Commissions */}
      {activeAdminTab === 'commissions' && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-[#0d1320] rounded-2xl border border-slate-800 p-6 shadow-xl"
        >
          <div className="max-w-2xl space-y-4">
            <div>
              <h3 className="font-bold text-white text-base">
                Multi-Tier Commission Structure
              </h3>
              <p className="text-xs text-slate-400">
                Configure affiliate bonus percentages distributed across 3 tiers when downlines fund contracts.
              </p>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
              <div className="p-4 bg-[#0a0e17] rounded-xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white block">Tier 1 Commission (Direct Referral)</span>
                    <span className="text-slate-400 text-[11px]">Paid immediately to direct inviter</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      id="input-tier1-commission"
                      type="number"
                      value={settingsForm.tier1CommissionPercent}
                      onChange={(e) => setSettingsForm({ ...settingsForm, tier1CommissionPercent: Number(e.target.value) })}
                      className="w-20 px-3 py-1.5 bg-[#111726] border border-slate-700 rounded-xl text-xs font-bold text-emerald-400 font-mono text-right focus:outline-none focus:border-emerald-500"
                      min={0}
                      max={50}
                      step={0.5}
                      required
                    />
                    <span className="font-bold text-slate-400">%</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                  <div>
                    <span className="font-bold text-white block">Tier 2 Commission (Secondary Referral)</span>
                    <span className="text-slate-400 text-[11px]">Paid to secondary downline mentor</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      id="input-tier2-commission"
                      type="number"
                      value={settingsForm.tier2CommissionPercent}
                      onChange={(e) => setSettingsForm({ ...settingsForm, tier2CommissionPercent: Number(e.target.value) })}
                      className="w-20 px-3 py-1.5 bg-[#111726] border border-slate-700 rounded-xl text-xs font-bold text-blue-400 font-mono text-right focus:outline-none focus:border-blue-500"
                      min={0}
                      max={50}
                      step={0.5}
                      required
                    />
                    <span className="font-bold text-slate-400">%</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                  <div>
                    <span className="font-bold text-white block">Tier 3 Commission (Network Referral)</span>
                    <span className="text-slate-400 text-[11px]">Paid to third-level network leader</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      id="input-tier3-commission"
                      type="number"
                      value={settingsForm.tier3CommissionPercent}
                      onChange={(e) => setSettingsForm({ ...settingsForm, tier3CommissionPercent: Number(e.target.value) })}
                      className="w-20 px-3 py-1.5 bg-[#111726] border border-slate-700 rounded-xl text-xs font-bold text-purple-400 font-mono text-right focus:outline-none focus:border-purple-500"
                      min={0}
                      max={50}
                      step={0.5}
                      required
                    />
                    <span className="font-bold text-slate-400">%</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-slate-400 text-[11px]">
                  Total affiliate overhead: <strong className="text-white font-mono">{(settingsForm.tier1CommissionPercent + settingsForm.tier2CommissionPercent + settingsForm.tier3CommissionPercent).toFixed(1)}%</strong>
                </span>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  id="btn-save-commissions"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-lg flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Update Commission Rates</span>
                </motion.button>
              </div>

              {settingsSaved && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>Commission tiers successfully updated!</span>
                </div>
              )}
            </form>
          </div>
        </motion.div>
      )}

      {/* Tab 3: Withdrawals Processing Desk */}
      {activeAdminTab === 'withdrawals' && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-[#0d1320] rounded-2xl border border-slate-800 overflow-hidden shadow-xl"
        >
          <div className="p-5 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base">Manual B2C Disbursal Desk (Admin & Staff Managed)</h3>
                <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/30 font-semibold">
                  Manual Payouts
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Customer deposits (C2B) are 100% automated via M-Pesa STK Push. B2C withdrawals are manually processed by you and your staff via M-Pesa / Till for security verification.
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-300 bg-[#0a0e17] border border-slate-800 px-3 py-1 rounded-xl font-mono shrink-0">
              {withdrawals.length} Total Requests
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#0a0e17] text-slate-400 border-b border-slate-800">
                  <th className="py-3 px-5 font-semibold">Request Details</th>
                  <th className="py-3 px-5 font-semibold">User & Rail</th>
                  <th className="py-3 px-5 font-semibold">Destination (Pay Details)</th>
                  <th className="py-3 px-5 font-semibold text-right">Net Payout</th>
                  <th className="py-3 px-5 font-semibold">Status</th>
                  <th className="py-3 px-5 font-semibold text-right">Fulfillment Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {withdrawals.map((w) => (
                  <tr key={w.id} className="hover:bg-[#111726]/40 transition-colors">
                    <td className="py-3.5 px-5">
                      <div className="font-mono font-bold text-white">{w.id}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{w.createdAt}</div>
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="font-medium text-white">{w.userName}</div>
                      <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        w.method === 'crypto' 
                          ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' 
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      }`}>
                        {w.method === 'crypto' ? 'USDT (Polygon)' : 'M-Pesa B2C (Manual)'}
                      </span>
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-1.5 font-mono text-slate-200">
                        <span className="font-bold">{w.destination}</span>
                        <button
                          onClick={() => {
                            navigator.clipboard?.writeText(w.destination);
                            alert(`Copied: ${w.destination}`);
                          }}
                          className="p-1 hover:text-emerald-400 hover:bg-emerald-500/10 rounded transition cursor-pointer text-slate-500"
                          title="Copy destination number"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="text-[10px] text-slate-400">Account: {w.accountName || w.userName}</div>
                    </td>
                    <td className="py-3.5 px-5 text-right font-mono">
                      <div className="font-bold text-emerald-400 text-sm">KES {w.netAmountKES.toLocaleString()}</div>
                      <div className="text-[10px] text-slate-400">
                        Fee: KES {w.feeKES} • ${(w.netAmountKES / settings.usdtToKesExchangeRate).toFixed(2)} USDT
                      </div>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                        w.status === 'completed'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      }`}>
                        {w.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right space-x-1.5 whitespace-nowrap">
                      {w.status === 'processing' || w.status === 'pending' ? (
                        <>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            id={`btn-approve-${w.id}`}
                            onClick={() => {
                              const ref = window.prompt(
                                `Enter M-Pesa B2C Disbursal Reference Code for KES ${w.netAmountKES.toLocaleString()} to ${w.destination}:`,
                                `QKD${Math.random().toString(36).substring(2, 7).toUpperCase()}`
                              );
                              if (ref !== null) {
                                onApproveWithdrawal(w.id);
                              }
                            }}
                            className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-[11px] transition cursor-pointer shadow"
                          >
                            Disburse & Mark Paid
                          </motion.button>
                          <button
                            onClick={() => {
                              const reason = window.prompt('Enter rejection reason (will refund user wallet):', 'Account details invalid');
                              if (reason) {
                                onRejectWithdrawal(w.id, reason);
                              }
                            }}
                            className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg text-[11px] font-semibold transition cursor-pointer"
                          >
                            Reject & Refund
                          </button>
                        </>
                      ) : (
                        <div className="text-right">
                          <span className="text-[11px] text-emerald-400 font-mono font-semibold block">
                            Paid: {w.txHashOrRef || 'DISBURSED'}
                          </span>
                          <span className="text-[10px] text-slate-500">Manual B2C Settled</span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Tab 4: Communication Center & Real-Time Chat Management */}
      {activeAdminTab === 'communication' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          <div className="bg-[#0b0f19] p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-purple-400" />
                <span>Live Member Communication Desk</span>
              </h3>
              <p className="text-xs text-slate-400">
                Manage incoming user inquiries, listen to voice notes, review payment proof screenshots, and send instant voice/text responses.
              </p>
            </div>
            <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-xl font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Live Server Audio & Chat Online
            </span>
          </div>

          <AdminCommunicationCenter />
        </motion.div>
      )}

      {/* Tab 5: Global Thresholds */}
      {activeAdminTab === 'settings' && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-[#0d1320] rounded-2xl border border-slate-800 p-6 shadow-xl max-w-2xl"
        >
          <h3 className="font-bold text-white text-base mb-1">Global System Parameters</h3>
          <p className="text-xs text-slate-400 mb-6">
            Configure withdrawal and deposit thresholds (fully configurable down to KES 1 for instant testing), turnaround SLA, and exchange rates.
          </p>

          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            <div className="p-4 bg-[#0a0e17] rounded-xl border border-slate-800 space-y-4">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Minimum Withdrawal Threshold (KES)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="input-min-withdrawal"
                    type="number"
                    value={settingsForm.minWithdrawalKES}
                    onChange={(e) => setSettingsForm({ ...settingsForm, minWithdrawalKES: Number(e.target.value) })}
                    className="w-32 px-3 py-2 bg-[#111726] border border-slate-700 rounded-xl text-xs font-bold text-white font-mono focus:outline-none focus:border-emerald-500"
                    min={1}
                    step={1}
                    required
                  />
                  <span className="text-emerald-400 text-[11px] font-semibold">
                    (Configurable from KES 1 • Allows instant testing &lt; 10 KES)
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800">
                <label className="block font-semibold text-slate-300 mb-1">
                  Minimum Deposit Threshold (KES)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="input-min-deposit"
                    type="number"
                    value={settingsForm.minDepositKES ?? 1}
                    onChange={(e) => setSettingsForm({ ...settingsForm, minDepositKES: Number(e.target.value) })}
                    className="w-32 px-3 py-2 bg-[#111726] border border-slate-700 rounded-xl text-xs font-bold text-white font-mono focus:outline-none focus:border-emerald-500"
                    min={1}
                    step={1}
                    required
                  />
                  <span className="text-amber-400 text-[11px] font-semibold">
                    (PayHero waives transaction fees on amounts &lt; KES 10 for testing)
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800">
                <label className="block font-semibold text-slate-300 mb-1">
                  M-Pesa Turnaround SLA (Hours)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="input-mpesa-hours"
                    type="number"
                    value={settingsForm.mpesaEstimatedHours}
                    onChange={(e) => setSettingsForm({ ...settingsForm, mpesaEstimatedHours: Number(e.target.value) })}
                    className="w-32 px-3 py-2 bg-[#111726] border border-slate-700 rounded-xl text-xs font-bold text-white font-mono focus:outline-none focus:border-emerald-500"
                    min={1}
                    max={72}
                    required
                  />
                  <span className="text-slate-400 text-[11px]">
                    (User request: "within 6 hours they have received their funds")
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800">
                <label className="block font-semibold text-slate-300 mb-1">
                  M-Pesa Withdrawal Fee (%)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="input-mpesa-fee"
                    type="number"
                    value={settingsForm.mpesaWithdrawalFeePercent ?? 10}
                    onChange={(e) => setSettingsForm({ ...settingsForm, mpesaWithdrawalFeePercent: Number(e.target.value) })}
                    className="w-32 px-3 py-2 bg-[#111726] border border-slate-700 rounded-xl text-xs font-bold text-white font-mono focus:outline-none focus:border-emerald-500"
                    min={0}
                    max={50}
                    step={1}
                    required
                  />
                  <span className="text-slate-400 text-[11px]">
                    (User mandate: 10% fee applied to M-Pesa payouts)
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800">
                <label className="block font-semibold text-slate-300 mb-1">
                  Crypto / Polygon USDT Withdrawal Fee (%)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="input-crypto-fee"
                    type="number"
                    value={settingsForm.cryptoWithdrawalFeePercent ?? 5}
                    onChange={(e) => setSettingsForm({ ...settingsForm, cryptoWithdrawalFeePercent: Number(e.target.value) })}
                    className="w-32 px-3 py-2 bg-[#111726] border border-slate-700 rounded-xl text-xs font-bold text-white font-mono focus:outline-none focus:border-emerald-500"
                    min={0}
                    max={50}
                    step={1}
                    required
                  />
                  <span className="text-slate-400 text-[11px]">
                    (User mandate: 5% fee applied to crypto instant payouts)
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800">
                <label className="block font-semibold text-slate-300 mb-1">
                  USDT / KES Peg Exchange Rate
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={settingsForm.usdtToKesExchangeRate}
                    onChange={(e) => setSettingsForm({ ...settingsForm, usdtToKesExchangeRate: Number(e.target.value) })}
                    className="w-32 px-3 py-2 bg-[#111726] border border-slate-700 rounded-xl text-xs font-bold text-white font-mono focus:outline-none focus:border-emerald-500"
                    min={50}
                    max={300}
                    step={1}
                    required
                  />
                  <span className="text-slate-400 text-[11px] font-mono">
                    1 USDT = KES {settingsForm.usdtToKesExchangeRate}
                  </span>
                </div>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              id="btn-save-global-settings"
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-lg flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save System Thresholds</span>
            </motion.button>

            {settingsSaved && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>Settings updated successfully!</span>
              </div>
            )}
          </form>

          {/* Neon Database Engine Configuration Box */}
          <div className="mt-8 pt-6 border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                <h4 className="font-bold text-white text-xs">Neon PostgreSQL Serverless</h4>
              </div>
              <span className="text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono font-semibold">
                Endpoint: ep-little-hall-b5o6vcsm
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              User registration, credentials, wallet balances, and referral trees are stored in your Neon PostgreSQL database via serverless driver.
            </p>
            <div className="p-3 bg-[#0a0e17] rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300 space-y-1">
              <div>Table: <span className="text-emerald-400">public.users</span> (id, name, email, phone, password_hash, balances, referral_code)</div>
              <div>Host: <span className="text-slate-400">ep-little-hall-b5o6vcsm-pooler.c-7.us-east-2.aws.neon.tech</span></div>
            </div>
          </div>

          {/* PayHero Kenya C2B Gateway Configuration Box */}
          <div className="mt-6 pt-6 border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                <h4 className="font-bold text-white text-xs">PayHero Kenya C2B Gateway (STK Push)</h4>
              </div>
              <span className="text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono font-semibold">
                Auto C2B Active • Manual B2C
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              All member deposits trigger an automated PayHero STK Push to Safaricom M-Pesa. Webhook callbacks are <strong>fully dynamic</strong> and adapt automatically to your current hosting domain or custom domain.
            </p>

            <div className="p-3 bg-[#0a0e17] rounded-xl border border-slate-800 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-300 font-semibold text-[11px]">Dynamic Webhook Callback URL:</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-mono font-bold">
                    Auto-Detected
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const url = `${window.location.origin}/api/payhero/callback`;
                    navigator.clipboard?.writeText(url);
                    alert(`Copied Dynamic Webhook URL:\n${url}\n\nPaste this in your PayHero merchant dashboard under Webhooks if registering a global URL.`);
                  }}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[10px] font-mono flex items-center gap-1 transition cursor-pointer shadow-sm"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy Dynamic URL</span>
                </button>
              </div>

              <div className="font-mono text-[11px] text-emerald-400 bg-slate-950 p-2.5 rounded-lg border border-slate-800 break-all select-all flex items-center justify-between">
                <span>{typeof window !== 'undefined' ? `${window.location.origin}/api/payhero/callback` : '/api/payhero/callback'}</span>
              </div>

              <p className="text-[10px] text-slate-400 leading-relaxed">
                ℹ️ <strong>How Dynamic Callbacks Work:</strong> Each time a customer requests an STK Push, the system dynamically passes <code className="text-emerald-300 font-mono">{typeof window !== 'undefined' ? `${window.location.origin}/api/payhero/callback` : '/api/payhero/callback'}</code> in the PayHero API request body (<code className="text-slate-300 font-mono">callback_url</code> parameter). If you migrate domains or attach a custom domain, callbacks will adjust automatically without code edits.
              </p>

              <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-slate-300">
                <div className="p-2 bg-slate-900/60 rounded border border-slate-800/80">
                  <span className="text-slate-400 block text-[10px]">C2B Endpoint:</span>
                  <span className="font-mono text-white text-[11px]">backend.payhero.co.ke</span>
                </div>
                <div className="p-2 bg-slate-900/60 rounded border border-slate-800/80">
                  <span className="text-slate-400 block text-[10px]">B2C Policy:</span>
                  <span className="font-mono text-purple-300 text-[11px]">Manual Staff Disbursal</span>
                </div>
              </div>

              {/* PayHero HTTP Basic Auth Guide */}
              <div className="mt-3 p-3 bg-slate-900/80 rounded-lg border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-amber-400 font-semibold text-[11px] flex items-center gap-1">
                    🔑 Official PayHero HTTP Basic Auth Credentials
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Authorization: Basic &lt;base64&gt;
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  PayHero uses standard <strong>HTTP Basic Authentication</strong>. In your PayHero Dashboard, copy your direct <strong>Basic Auth Token</strong> and configure it under <strong>Settings → Secrets</strong>:
                </p>
                <div className="bg-slate-950 p-2 rounded border border-slate-800 font-mono text-[10px] text-slate-300 space-y-1">
                  <div><span className="text-emerald-400 font-bold">PAYHERO_AUTH_TOKEN</span>=your_payhero_basic_auth_token</div>
                  <div><span className="text-emerald-400 font-bold">PAYHERO_CHANNEL_ID</span>=your_channel_id</div>
                </div>
              </div>
            </div>
          </div>

          {/* NOWPayments IPN Webhook Configuration Box */}
          <div className="mt-6 pt-6 border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-purple-400 fill-purple-400" />
                <h4 className="font-bold text-white text-xs">NOWPayments IPN Webhook (Polygon USDT)</h4>
              </div>
              <span className="text-[10px] bg-purple-500/15 text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded-full font-mono font-semibold">
                Auto IPN Active
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Provide this exact Instant Payment Notification (IPN) webhook URL in your NOWPayments Account Settings to automatically confirm Polygon USDT deposits and payouts.
            </p>

            <div className="p-3 bg-[#0a0e17] rounded-xl border border-slate-800 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-semibold text-[11px]">Primary Deposit IPN URL:</span>
                <button
                  type="button"
                  onClick={() => {
                    const url = `${window.location.origin}/api/nowpayments/ipn`;
                    navigator.clipboard?.writeText(url);
                    alert(`Copied NOWPayments IPN Webhook URL:\n${url}\n\nPaste this in your NOWPayments dashboard under Store Settings -> Instant Payment Notifications (IPN).`);
                  }}
                  className="px-2 py-1 bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 rounded text-[10px] font-mono flex items-center gap-1 transition cursor-pointer shadow-sm"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy IPN URL</span>
                </button>
              </div>

              <div className="font-mono text-[11px] text-purple-300 bg-slate-950 p-2.5 rounded-lg border border-slate-800 break-all select-all flex items-center justify-between">
                <span>{typeof window !== 'undefined' ? `${window.location.origin}/api/nowpayments/ipn` : '/api/nowpayments/ipn'}</span>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-slate-400 text-[11px]">Automated Payout IPN URL:</span>
                <button
                  type="button"
                  onClick={() => {
                    const url = `${window.location.origin}/api/nowpayments/payout-ipn`;
                    navigator.clipboard?.writeText(url);
                    alert(`Copied NOWPayments Payout IPN URL:\n${url}`);
                  }}
                  className="text-[10px] text-slate-400 hover:text-white font-mono flex items-center gap-1 transition cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy Payout IPN</span>
                </button>
              </div>
              <div className="font-mono text-[10px] text-slate-400 bg-slate-950/70 p-2 rounded border border-slate-800/60 break-all select-all">
                {typeof window !== 'undefined' ? `${window.location.origin}/api/nowpayments/payout-ipn` : '/api/nowpayments/payout-ipn'}
              </div>

              <div className="p-2.5 bg-purple-950/20 border border-purple-500/20 rounded-lg text-[10px] text-purple-300 leading-relaxed">
                💡 <strong>NOWPayments IPN Secret:</strong> When configuring IPN in NOWPayments, make sure your <code className="text-white font-mono">NOWPAYMENTS_IPN_SECRET</code> in environment secrets matches the secret key generated by NOWPayments for cryptographic signature validation (<code className="text-white font-mono">x-nowpayments-sig</code>).
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Tab 6: Interactive REST API Console & Documentation */}
      {activeAdminTab === 'api' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <ApiExplorerView />
        </motion.div>
      )}

      {/* Tab 7: Anti-Fraud & Risk Containment Shield */}
      {activeAdminTab === 'antifraud' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <AntiFraudDashboard 
            settings={settings} 
            onUpdateSettings={onUpdateSettings} 
          />
        </motion.div>
      )}
    </div>
  );
};
