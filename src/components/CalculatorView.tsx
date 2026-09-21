import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Calculator, 
  TrendingUp, 
  Clock, 
  Coins, 
  Percent, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  Calendar,
  Sparkles,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { InvestmentPackage, PlatformSettings, UserProfile } from '../types';

interface CalculatorViewProps {
  packages: InvestmentPackage[];
  user: UserProfile;
  settings: PlatformSettings;
  onActivatePackage: (pkg: InvestmentPackage) => void;
  onOpenDeposit: () => void;
  onNavigateToPackages?: () => void;
}

export const CalculatorView: React.FC<CalculatorViewProps> = ({
  packages,
  user,
  settings,
  onActivatePackage,
  onOpenDeposit,
  onNavigateToPackages,
}) => {
  const [selectedPackageId, setSelectedPackageId] = useState<string>(
    packages[0]?.id || 'pkg-bronze'
  );
  const [customAmountKES, setCustomAmountKES] = useState<number | null>(null);

  const activePlan = packages.find(p => p.id === selectedPackageId) || packages[0];
  const capitalAmount = customAmountKES ?? (activePlan ? activePlan.priceKES : 1000);
  const dailyRoiPercent = activePlan ? activePlan.dailyRoiPercent : 7.0;
  const durationDays = activePlan ? activePlan.durationDays : 20;

  // Financial calculations
  const dailyReturnKES = Math.round(capitalAmount * (dailyRoiPercent / 100));
  const totalReturnKES = Math.round(dailyReturnKES * durationDays);
  const netProfitKES = Math.max(0, totalReturnKES - capitalAmount);
  const netRoiPercent = capitalAmount > 0 ? ((totalReturnKES - capitalAmount) / capitalAmount) * 100 : 0;
  const breakEvenDay = Math.ceil(100 / dailyRoiPercent);

  const canAfford = user.walletBalanceKES >= capitalAmount;

  const quickAmounts = [1000, 3500, 8000, 15000, 30000, 50000, 100000];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-[#0e1526] via-[#10192e] to-[#0c1322] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
                <Calculator className="w-4 h-4" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-500/20">
                Financial Projection Engine
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Contract Profit Projection Calculator
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
              Model your daily cash-flow, total returns, and net gains across official Royal Services 20-day contracts. Forecast yields in both Kenyan Shillings (KES) and Polygon USDT equivalent.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center shrink-0">
            {onNavigateToPackages && (
              <button
                type="button"
                onClick={onNavigateToPackages}
                className="px-4 py-2 bg-slate-800/80 hover:bg-slate-700 text-white rounded-xl text-xs font-bold border border-slate-700 transition flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <span>Browse All Plans</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Controls & Live Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Selectors & Inputs */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Step 1: Choose Contract Plan */}
          <div className="bg-[#0d1320] rounded-2xl border border-slate-800 p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 font-black text-xs flex items-center justify-center">1</span>
                <h3 className="font-bold text-white text-sm">Select Contract Plan Tier</h3>
              </div>
              <span className="text-[11px] text-slate-400">Fixed 20-Day Cycle</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {packages.map((pkg) => {
                const isSelected = selectedPackageId === pkg.id && customAmountKES === null;
                return (
                  <button
                    key={pkg.id}
                    type="button"
                    onClick={() => {
                      setSelectedPackageId(pkg.id);
                      setCustomAmountKES(null);
                    }}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer relative overflow-hidden ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/30'
                        : 'border-slate-800 bg-[#111726]/60 hover:bg-[#111726] text-slate-300'
                    }`}
                  >
                    {pkg.tag && (
                      <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-sm bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mb-1 inline-block">
                        {pkg.tag}
                      </span>
                    )}
                    <div className="font-bold text-xs text-white truncate">{pkg.name}</div>
                    <div className="text-[11px] text-emerald-400 font-mono font-semibold mt-0.5">
                      KES {pkg.priceKES.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      {pkg.dailyRoiPercent}% / day
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Custom Amount or Preset Chips */}
          <div className="bg-[#0d1320] rounded-2xl border border-slate-800 p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 font-black text-xs flex items-center justify-center">2</span>
                <h3 className="font-bold text-white text-sm">Capital Amount (KES)</h3>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                Wallet: KES {user.walletBalanceKES.toLocaleString()}
              </span>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-2">
              {quickAmounts.map((amt) => {
                const isSelected = capitalAmount === amt;
                return (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => {
                      setCustomAmountKES(amt);
                      // Match closest package for ROI
                      const matched = packages.find(p => p.priceKES === amt) || packages[0];
                      setSelectedPackageId(matched.id);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition cursor-pointer border ${
                      isSelected
                        ? 'bg-blue-500/20 border-blue-500 text-blue-300'
                        : 'bg-[#111726] border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    KES {amt.toLocaleString()}
                  </button>
                );
              })}
            </div>

            {/* Numeric input & slider */}
            <div className="space-y-3 pt-1">
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  KES
                </span>
                <input
                  type="number"
                  value={capitalAmount}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setCustomAmountKES(val >= 0 ? val : 0);
                  }}
                  min={500}
                  step={500}
                  className="w-full pl-14 pr-4 py-2.5 bg-[#111726] border border-slate-700 rounded-xl text-white font-mono font-bold text-base focus:outline-none focus:border-emerald-500 transition shadow-inner"
                  placeholder="Enter capital amount..."
                />
              </div>

              <input
                type="range"
                min={1000}
                max={150000}
                step={500}
                value={capitalAmount}
                onChange={(e) => setCustomAmountKES(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />

              <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                <span>Min: KES 1,000</span>
                <span>Max: KES 150,000</span>
              </div>
            </div>
          </div>

          {/* Capital Policy Disclaimer */}
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-xs text-amber-300/90 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1 leading-relaxed text-[11px]">
              <strong className="text-amber-200 block">Capital Amortization & Maturity Policy</strong>
              Contracts run for exactly <strong>{durationDays} days</strong>. Initial capital is amortized across daily payouts. Upon Day 20 maturity, the contract completes and expires (no separate capital return). Total accrued yields represent your principal recovery plus net profit.
            </div>
          </div>
        </div>

        {/* Right Column: Financial Forecast Display */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-[#0d1320] rounded-2xl border border-slate-800 p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">Projected Yield Summary</h3>
                <p className="text-xs text-slate-400">Based on {activePlan.name} rate ({dailyRoiPercent}% / day)</p>
              </div>
              <span className="bg-emerald-500/15 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold border border-emerald-500/30">
                +{netRoiPercent.toFixed(1)}% Net Gain
              </span>
            </div>

            {/* Core Metrics Cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-[#111726] p-3.5 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Daily Return</span>
                <div className="text-lg font-black text-emerald-400 font-mono">
                  KES {dailyReturnKES.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  ≈ ${(dailyReturnKES / settings.usdtToKesExchangeRate).toFixed(2)} USDT
                </div>
              </div>

              <div className="bg-[#111726] p-3.5 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Total Payout</span>
                <div className="text-lg font-black text-white font-mono">
                  KES {totalReturnKES.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-400">
                  over {durationDays} days
                </div>
              </div>

              <div className="bg-[#111726] p-3.5 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Net Profit</span>
                <div className="text-lg font-black text-blue-400 font-mono">
                  +KES {netProfitKES.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-400">
                  pure profit
                </div>
              </div>
            </div>

            {/* Day by Day 20-Day Yield Timeline Progress */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-400" />
                  20-Day Progress Timeline
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  Break-even: <strong className="text-emerald-400">Day {breakEvenDay}</strong>
                </span>
              </div>

              {/* Progress Bar */}
              <div className="relative h-4 bg-[#111726] rounded-full overflow-hidden border border-slate-800">
                <div 
                  className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-blue-500 via-emerald-400 to-emerald-300 rounded-full"
                  style={{ width: '100%' }}
                />
                {/* Break-even line */}
                <div 
                  className="absolute top-0 bottom-0 w-0.5 bg-white z-10 shadow-[0_0_8px_white]"
                  style={{ left: `${(breakEvenDay / durationDays) * 100}%` }}
                />
              </div>

              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>Day 1 (Payout Starts)</span>
                <span className="text-emerald-300 font-bold">Day {breakEvenDay} (100% Principal Returned)</span>
                <span>Day 20 (Cycle Complete)</span>
              </div>
            </div>

            {/* Daily Schedule Preview */}
            <div className="bg-[#111726] rounded-xl p-4 border border-slate-800 space-y-2">
              <div className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Milestone Accumulation</span>
                <span className="text-[10px] text-slate-400">Daily 12:00 AM Payout</span>
              </div>
              
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="bg-[#0c121f] p-2 rounded-lg border border-slate-800/80">
                  <span className="text-[9px] text-slate-500 block">Day 5</span>
                  <span className="font-bold text-white font-mono">KES {(dailyReturnKES * 5).toLocaleString()}</span>
                </div>
                <div className="bg-[#0c121f] p-2 rounded-lg border border-slate-800/80">
                  <span className="text-[9px] text-slate-500 block">Day 10</span>
                  <span className="font-bold text-white font-mono">KES {(dailyReturnKES * 10).toLocaleString()}</span>
                </div>
                <div className="bg-[#0c121f] p-2 rounded-lg border border-slate-800/80">
                  <span className="text-[9px] text-slate-500 block">Day 15</span>
                  <span className="font-bold text-white font-mono">KES {(dailyReturnKES * 15).toLocaleString()}</span>
                </div>
                <div className="bg-emerald-950/40 p-2 rounded-lg border border-emerald-500/40">
                  <span className="text-[9px] text-emerald-400 block font-bold">Day 20</span>
                  <span className="font-extrabold text-emerald-300 font-mono">KES {totalReturnKES.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Activation CTA */}
            <div className="pt-2">
              {canAfford ? (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  id="btn-calc-activate-now"
                  onClick={() => {
                    const pkgToActivate: InvestmentPackage = {
                      ...activePlan,
                      priceKES: capitalAmount,
                    };
                    onActivatePackage(pkgToActivate);
                  }}
                  className="w-full py-3.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-sm transition cursor-pointer shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Activate {activePlan.name} • KES {capitalAmount.toLocaleString()}</span>
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              ) : (
                <div className="space-y-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    id="btn-calc-deposit-needed"
                    onClick={onOpenDeposit}
                    className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm transition cursor-pointer shadow-lg flex items-center justify-center gap-2"
                  >
                    <span>Deposit KES {(capitalAmount - user.walletBalanceKES).toLocaleString()} to Activate</span>
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                  <p className="text-[11px] text-center text-slate-400">
                    Your current wallet balance is <strong className="text-white font-mono">KES {user.walletBalanceKES.toLocaleString()}</strong>
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
