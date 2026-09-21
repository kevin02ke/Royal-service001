import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Check, 
  ArrowRight, 
  Clock, 
  Percent, 
  Coins, 
  AlertCircle,
  TrendingUp,
  X,
  ArrowDownCircle,
  ArrowUpCircle,
  Wallet
} from 'lucide-react';
import { InvestmentPackage, PlatformSettings, UserProfile } from '../types';

interface PackagesViewProps {
  packages: InvestmentPackage[];
  user: UserProfile;
  settings: PlatformSettings;
  onActivatePackage: (pkg: InvestmentPackage) => void;
  onOpenDeposit: () => void;
  onOpenWithdraw?: () => void;
}

export const PackagesView: React.FC<PackagesViewProps> = ({
  packages,
  user,
  settings,
  onActivatePackage,
  onOpenDeposit,
  onOpenWithdraw,
}) => {
  const [confirmModalPkg, setConfirmModalPkg] = useState<InvestmentPackage | null>(null);

  const activePackages = packages
    .filter(p => p.isActive)
    .sort((a, b) => a.priceKES - b.priceKES);

  const handleOpenConfirm = (pkg: InvestmentPackage) => {
    setConfirmModalPkg(pkg);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header Bar Strictly for Investment Packages with Quick Capital Actions */}
      <div className="bg-gradient-to-r from-[#0c121f] via-[#11192e] to-[#0c121f] border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider">
              Official Yield Contracts
            </span>
            <span className="text-xs text-slate-400">• Exactly 20-Day Durations</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Investment Plans & Yield Portfolios
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
            Select a contract to earn predictable daily returns credited directly to your wallet every 24 hours. Capital yields are paid continuously until Day 20 maturity.
          </p>
        </div>

        {/* Quick Wallet Balance & Action Card */}
        <div className="bg-[#090d16]/90 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row md:flex-col items-start sm:items-center md:items-stretch justify-between gap-3 shrink-0 shadow-lg">
          <div>
            <span className="text-[11px] text-slate-400 font-semibold block uppercase tracking-wider">Available Wallet</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xs font-bold text-emerald-400">KES</span>
              <span className="text-2xl font-black text-white font-mono">{user.walletBalanceKES.toLocaleString()}</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono block">
              ≈ ${(user.walletBalanceKES / settings.usdtToKesExchangeRate).toFixed(1)} USDT
            </span>
          </div>

          <div className="flex items-center gap-2 w-full pt-1">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              id="packages-quick-deposit-btn"
              onClick={onOpenDeposit}
              className="flex-1 flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition cursor-pointer shadow-sm"
            >
              <ArrowDownCircle className="w-4 h-4 stroke-[2.5]" />
              <span>Deposit</span>
            </motion.button>
            {onOpenWithdraw && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                id="packages-quick-withdraw-btn"
                onClick={onOpenWithdraw}
                className="flex-1 flex items-center justify-center gap-1.5 px-3.5 py-2 bg-[#121929] hover:bg-[#182238] text-amber-300 hover:text-amber-200 border border-amber-500/40 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                <ArrowUpCircle className="w-4 h-4 text-amber-400 stroke-[2.5]" />
                <span>Withdraw</span>
              </motion.button>
            )}
          </div>
        </div>
      </div>

      {/* Package Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {activePackages.map((pkg, index) => {
          const isHighlighted = pkg.tag?.toLowerCase().includes('popular') || pkg.tag?.toLowerCase().includes('best');
          const dailyPayout = Math.round(pkg.priceKES * (pkg.dailyRoiPercent / 100));
          const totalCycleReturn = Math.round(dailyPayout * pkg.durationDays);
          const netProfit = totalCycleReturn - pkg.priceKES;
          const canAfford = user.walletBalanceKES >= pkg.priceKES;

          return (
            <motion.div
              key={pkg.id}
              id={`package-card-${pkg.id}`}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: index * 0.04 }}
              whileHover={{ y: -4, transition: { duration: 0.15 } }}
              className={`relative bg-[#0d1320] rounded-2xl border flex flex-col justify-between overflow-hidden shadow-xl transition-all ${
                isHighlighted 
                  ? 'border-emerald-500/70 ring-1 ring-emerald-500/30 shadow-[0_0_25px_rgba(16,185,129,0.12)]' 
                  : 'border-slate-800/90 hover:border-slate-700'
              }`}
            >
              {/* Plan Tag */}
              {pkg.tag && (
                <div className="absolute top-3 right-3 z-10">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border shadow-sm ${
                    isHighlighted 
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-extrabold' 
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}>
                    {pkg.tag}
                  </span>
                </div>
              )}

              {/* Card Content */}
              <div className="p-5 space-y-4">
                <div>
                  <h3 className="font-bold text-lg text-white tracking-tight">{pkg.name}</h3>
                  <p className="text-xs text-slate-400 min-h-[32px] mt-1">{pkg.description}</p>
                </div>

                {/* Capital Price Tag */}
                <div className="bg-[#121929]/80 p-3.5 rounded-xl border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-0.5">Contract Capital</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xs font-semibold text-emerald-400">KES</span>
                    <span className="text-2xl font-black text-white tracking-tight font-mono">
                      {pkg.priceKES.toLocaleString()}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      ≈ ${(pkg.priceKES / settings.usdtToKesExchangeRate).toFixed(1)} USDT
                    </span>
                  </div>
                </div>

                {/* Key Financial Return Metrics */}
                <div className="space-y-2 py-3 px-3 bg-[#0a0e17] rounded-xl border border-slate-800/60 text-xs">
                  <div className="flex justify-between items-center text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      Duration
                    </span>
                    <span className="font-semibold text-slate-200 font-mono">Exactly {pkg.durationDays} Days</span>
                  </div>

                  <div className="flex justify-between items-center text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                      Daily Rate
                    </span>
                    <span className="font-bold text-emerald-400 font-mono">
                      {pkg.dailyRoiPercent}% / day
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Coins className="w-3.5 h-3.5 text-emerald-400" />
                      Daily Return
                    </span>
                    <span className="font-semibold text-white font-mono">
                      KES {dailyPayout.toLocaleString()} / day
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-slate-400 pt-1.5 border-t border-slate-800/60">
                    <span className="flex items-center gap-1.5">
                      <Percent className="w-3.5 h-3.5 text-blue-400" />
                      Total Payout
                    </span>
                    <span className="font-extrabold text-white font-mono">
                      KES {totalCycleReturn.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-slate-400 pt-1 border-t border-slate-800/40 text-[11px]">
                    <span>Net Profit:</span>
                    <span className="text-blue-400 font-bold font-mono">
                      +KES {netProfit.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Features List */}
                <ul className="space-y-1.5 pt-1">
                  {pkg.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="leading-tight">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Card Action */}
              <div className="p-5 pt-0 space-y-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  id={`btn-invest-${pkg.id}`}
                  onClick={() => handleOpenConfirm(pkg)}
                  className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs transition cursor-pointer flex items-center justify-center gap-2 ${
                    isHighlighted
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                      : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700/80'
                  }`}
                >
                  <span>Activate Plan • KES {pkg.priceKES.toLocaleString()}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </motion.button>

                {!canAfford && (
                  <p className="text-[10px] text-amber-400 text-center">
                    Requires KES {(pkg.priceKES - user.walletBalanceKES).toLocaleString()} balance
                  </p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmModalPkg && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmModalPkg(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative bg-[#0d121d] rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-800 z-10 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white text-lg tracking-tight">
                    Confirm Contract Activation
                  </h3>
                  <p className="text-xs text-slate-400">
                    Review specifications for {confirmModalPkg.name}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setConfirmModalPkg(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2.5 p-4 bg-[#111726]/70 rounded-xl border border-slate-800 text-xs text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Plan:</span>
                  <span className="font-semibold text-white">{confirmModalPkg.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Capital Required:</span>
                  <span className="font-bold text-white font-mono">KES {confirmModalPkg.priceKES.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Daily Return Payout:</span>
                  <span className="font-bold text-emerald-400 font-mono">
                    KES {(confirmModalPkg.priceKES * (confirmModalPkg.dailyRoiPercent/100)).toFixed(1)} / day ({confirmModalPkg.dailyRoiPercent}%)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Duration:</span>
                  <span className="font-semibold text-white font-mono">Exactly {confirmModalPkg.durationDays} Days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Accumulated Payout:</span>
                  <span className="font-extrabold text-white font-mono">
                    KES {(confirmModalPkg.priceKES * (confirmModalPkg.dailyRoiPercent/100) * confirmModalPkg.durationDays).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-800/80 text-[11px]">
                  <span className="text-slate-400">Maturity Status:</span>
                  <span className="text-amber-400 font-semibold">Contract Expires (Capital Non-Refundable)</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-800">
                  <span className="text-slate-400">Available Wallet Balance:</span>
                  <span className={`font-bold font-mono ${user.walletBalanceKES >= confirmModalPkg.priceKES ? 'text-emerald-400' : 'text-rose-400'}`}>
                    KES {user.walletBalanceKES.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20 text-[11px] text-blue-300">
                <strong>How It Works:</strong> Your account will receive <span className="font-mono font-bold text-white">KES {(confirmModalPkg.priceKES * (confirmModalPkg.dailyRoiPercent/100)).toFixed(0)}</span> each day for exactly <span className="font-bold text-white">{confirmModalPkg.durationDays} days</span>. Once all {confirmModalPkg.durationDays} days are complete, total returns will have been paid, and the contract completes.
              </div>

              {user.walletBalanceKES < confirmModalPkg.priceKES && (
                <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/30 text-xs text-amber-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong>Insufficient Capital:</strong> You need KES {(confirmModalPkg.priceKES - user.walletBalanceKES).toLocaleString()} more to activate this contract.
                  </div>
                </div>
              )}

              <div className="flex gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setConfirmModalPkg(null)}
                  className="flex-1 py-2.5 px-3 rounded-xl border border-slate-700 text-slate-300 text-xs font-semibold hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>

                {user.walletBalanceKES >= confirmModalPkg.priceKES ? (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    id="btn-confirm-investment"
                    onClick={() => {
                      onActivatePackage(confirmModalPkg);
                      setConfirmModalPkg(null);
                    }}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.25)]"
                  >
                    Confirm & Activate
                  </motion.button>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => {
                      setConfirmModalPkg(null);
                      onOpenDeposit();
                    }}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition cursor-pointer"
                  >
                    Deposit Funds Now
                  </motion.button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
