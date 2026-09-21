import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Layers, 
  Coins, 
  Clock, 
  CheckCircle2, 
  RefreshCw, 
  ArrowRight,
  TrendingUp,
  Sparkles,
  Zap,
  ArrowDownCircle,
  ArrowUpCircle
} from 'lucide-react';
import { ActiveInvestment } from '../types';

interface ActiveInvestmentsViewProps {
  investments: ActiveInvestment[];
  onClaimYield: (investmentId: string) => void;
  onClaimAll: () => void;
  onNavigateToPackages: () => void;
  onOpenDeposit?: () => void;
  onOpenWithdraw?: () => void;
}

export const ActiveInvestmentsView: React.FC<ActiveInvestmentsViewProps> = ({
  investments,
  onClaimYield,
  onClaimAll,
  onNavigateToPackages,
  onOpenDeposit,
  onOpenWithdraw,
}) => {
  const activeContracts = investments.filter(i => i.status === 'active');
  const completedContracts = investments.filter(i => i.status === 'completed');
  const totalUnclaimed = activeContracts.reduce((acc, curr) => acc + curr.unclaimedYieldKES, 0);
  const totalDailyPacing = activeContracts.reduce((acc, curr) => acc + curr.dailyReturnKES, 0);

  return (
    <div className="space-y-6">
      {/* Header & Claim Action Center */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="bg-[#0d1320] rounded-2xl border border-slate-800 p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Active Investment Portfolios
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Yields accrue daily based on contract parameters. Claim accruals directly to your withdrawable balance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {onOpenDeposit && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              id="portfolios-deposit-btn"
              onClick={onOpenDeposit}
              className="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <ArrowDownCircle className="w-4 h-4 text-emerald-400" />
              <span>Deposit</span>
            </motion.button>
          )}

          {onOpenWithdraw && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              id="portfolios-withdraw-btn"
              onClick={onOpenWithdraw}
              className="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <ArrowUpCircle className="w-4 h-4 text-amber-400" />
              <span>Withdraw</span>
            </motion.button>
          )}

          <motion.button
            whileHover={{ scale: totalUnclaimed > 0 ? 1.03 : 1 }}
            whileTap={{ scale: totalUnclaimed > 0 ? 0.97 : 1 }}
            id="btn-claim-all-yield"
            onClick={onClaimAll}
            disabled={totalUnclaimed <= 0}
            className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
              totalUnclaimed > 0
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_0_25px_rgba(16,185,129,0.35)] animate-pulse'
                : 'bg-slate-800/60 text-slate-500 cursor-not-allowed border border-slate-800'
            }`}
          >
            <Coins className="w-4 h-4" />
            <span>Claim All Accruals (KES {totalUnclaimed.toLocaleString()})</span>
          </motion.button>
        </div>
      </motion.div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-[#0e1422] rounded-2xl p-4 border border-slate-800/90 shadow-md"
        >
          <span className="text-[11px] text-slate-400 block mb-1">Active Daily Velocity</span>
          <div className="text-xl font-black text-emerald-400 font-mono tracking-tight">
            +KES {totalDailyPacing.toLocaleString()} <span className="text-xs font-normal text-slate-400">/ day</span>
          </div>
          <span className="text-[10px] text-slate-500">{activeContracts.length} running contract portfolios</span>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#0e1422] rounded-2xl p-4 border border-slate-800/90 shadow-md"
        >
          <span className="text-[11px] text-slate-400 block mb-1">Unclaimed Accruals Ready</span>
          <div className="text-xl font-black text-white font-mono tracking-tight">
            KES {totalUnclaimed.toLocaleString()}
          </div>
          <span className="text-[10px] text-emerald-400">Instantly eligible for withdrawal</span>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-[#0e1422] rounded-2xl p-4 border border-slate-800/90 shadow-md"
        >
          <span className="text-[11px] text-slate-400 block mb-1">Cumulative Platform Yield</span>
          <div className="text-xl font-black text-blue-400 font-mono tracking-tight">
            KES {investments.reduce((sum, i) => sum + i.totalEarnedKES, 0).toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-500">Historical interest realized</span>
        </motion.div>
      </div>

      {/* Contracts List */}
      {activeContracts.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-[#0d1320] rounded-2xl border border-dashed border-slate-800 p-12 text-center"
        >
          <div className="w-12 h-12 rounded-2xl bg-slate-800/80 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-white text-base mb-1">No Active Portfolios</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-5">
            You currently have no running investment contracts. Select an active package to initiate daily yield generation.
          </p>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={onNavigateToPackages}
            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-bold transition cursor-pointer inline-flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.25)]"
          >
            <span>Explore Investment Plans</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </motion.button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {activeContracts.map((contract, index) => {
            const progressPercent = Math.min(100, Math.round((contract.daysElapsed / contract.durationDays) * 100));
            const totalProjected = contract.dailyReturnKES * contract.durationDays;

            return (
              <motion.div
                key={contract.id}
                id={`contract-${contract.id}`}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: index * 0.05 }}
                className="bg-[#0d1320] rounded-2xl border border-slate-800/90 p-5 shadow-xl flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-white text-base tracking-tight">{contract.packageName}</h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          Active
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 font-mono">
                        Capital: KES {contract.amountKES.toLocaleString()} &bull; Activated: {contract.startDate}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold text-emerald-400 font-mono block">
                        +{contract.dailyRoiPercent}% / Day
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        KES {contract.dailyReturnKES}/day
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="my-4 bg-[#0a0e17] p-3 rounded-xl border border-slate-800/60">
                    <div className="flex justify-between text-xs font-medium text-slate-400 mb-2">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        Day {contract.daysElapsed} of {contract.durationDays} ({Math.max(0, contract.durationDays - contract.daysElapsed)} days left)
                      </span>
                      <span className="font-bold text-white font-mono">{progressPercent}%</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        className="bg-gradient-to-r from-emerald-500 to-teal-400 h-2 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                      />
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-slate-500 mt-2 pt-1.5 border-t border-slate-800/50">
                      <span>Rate: KES {contract.dailyReturnKES}/day</span>
                      <span className="text-amber-400/90">Expires at Day {contract.durationDays} (Capital not returned)</span>
                    </div>
                  </div>

                  {/* Earnings Breakdown */}
                  <div className="grid grid-cols-3 gap-2 p-3 bg-[#111726]/60 rounded-xl border border-slate-800 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5">Accrued to Date</span>
                      <span className="font-bold text-white font-mono">KES {contract.totalEarnedKES.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5">Total Contract Payout</span>
                      <span className="font-bold text-white font-mono">KES {totalProjected.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5">Unclaimed</span>
                      <span className="font-extrabold text-emerald-400 font-mono">KES {contract.unclaimedYieldKES.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Claim Button */}
                <div className="pt-2 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">
                    KES {contract.dailyReturnKES} credited every 24h
                  </span>
                  <motion.button
                    whileHover={{ scale: contract.unclaimedYieldKES > 0 ? 1.03 : 1 }}
                    whileTap={{ scale: contract.unclaimedYieldKES > 0 ? 0.97 : 1 }}
                    id={`btn-claim-${contract.id}`}
                    onClick={() => onClaimYield(contract.id)}
                    disabled={contract.unclaimedYieldKES <= 0}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                      contract.unclaimedYieldKES > 0
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.25)]'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-800'
                    }`}
                  >
                    <Coins className="w-3.5 h-3.5" />
                    <span>Claim (KES {contract.unclaimedYieldKES})</span>
                  </motion.button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Completed & Expired Contracts Section */}
      {completedContracts.length > 0 && (
        <div className="space-y-3 pt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-slate-400" />
              <span>Expired & Completed Contracts ({completedContracts.length})</span>
            </h3>
            <span className="text-[11px] text-slate-500">
              Contract terms completed & capital expired
            </span>
          </div>
          <div className="space-y-2">
            {completedContracts.map((c) => (
              <div key={c.id} className="p-3.5 bg-[#0e1422] rounded-xl border border-slate-800 text-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-slate-300">
                <div>
                  <span className="font-semibold text-white">{c.packageName}</span>
                  <span className="text-slate-500 ml-2">(Capital: KES {c.amountKES.toLocaleString()})</span>
                </div>
                <div className="flex items-center gap-3 text-slate-400 font-mono text-[11px]">
                  <span>Tenure: {c.durationDays} Days Completed</span>
                  <span className="text-slate-600">&bull;</span>
                  <span className="font-bold text-emerald-400">Total Payout Received: KES {c.totalEarnedKES.toLocaleString()}</span>
                  <span className="text-slate-600">&bull;</span>
                  <span className="text-amber-400/80 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20 text-[10px]">Capital Expired</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
