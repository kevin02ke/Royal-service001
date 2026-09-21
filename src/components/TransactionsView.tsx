import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Clock, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Coins, 
  Users, 
  Layers, 
  Filter,
  CheckCircle2,
  Calendar,
  CreditCard,
  ArrowDownCircle,
  ArrowUpCircle
} from 'lucide-react';
import { Transaction } from '../types';

interface TransactionsViewProps {
  transactions: Transaction[];
  onOpenDeposit?: () => void;
  onOpenWithdraw?: () => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({ 
  transactions,
  onOpenDeposit,
  onOpenWithdraw
}) => {
  const [filter, setFilter] = useState<'all' | 'deposit' | 'daily_yield' | 'referral_bonus' | 'withdrawal' | 'investment'>('all');

  const filtered = filter === 'all' 
    ? transactions 
    : transactions.filter(t => t.type === filter);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#0d1320] rounded-2xl border border-slate-800 overflow-hidden shadow-xl"
    >
      <div className="p-5 sm:p-6 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              Ledger & Settlement Activity
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time auditable history of all yield dividends, deposits, referral distributions, and withdrawals.
          </p>
        </div>

        {/* Action and Filter Controls */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {(onOpenDeposit || onOpenWithdraw) && (
            <div className="flex items-center gap-1.5 mr-1">
              {onOpenDeposit && (
                <button
                  type="button"
                  id="ledger-deposit-btn"
                  onClick={onOpenDeposit}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs transition cursor-pointer shadow-sm"
                >
                  <ArrowDownCircle className="w-3.5 h-3.5" />
                  <span>Deposit</span>
                </button>
              )}
              {onOpenWithdraw && (
                <button
                  type="button"
                  id="ledger-withdraw-btn"
                  onClick={onOpenWithdraw}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer"
                >
                  <ArrowUpCircle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Withdraw</span>
                </button>
              )}
            </div>
          )}

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-[#0a0e17] rounded-xl border border-slate-800">
            {(['all', 'daily_yield', 'referral_bonus', 'withdrawal', 'deposit'] as const).map((key) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg capitalize cursor-pointer whitespace-nowrap transition ${
                  filter === key
                    ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {key === 'all' ? 'All Ledger' : key.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-[#0a0e17] text-slate-400 border-b border-slate-800">
              <th className="py-3 px-5 font-semibold">Transaction Type</th>
              <th className="py-3 px-5 font-semibold">Details & Channel</th>
              <th className="py-3 px-5 font-semibold">Timestamp & Reference</th>
              <th className="py-3 px-5 font-semibold">Status</th>
              <th className="py-3 px-5 font-semibold text-right">Settlement (KES)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-500">
                  No activity found in this filter category.
                </td>
              </tr>
            ) : (
              filtered.map((tx, idx) => {
                const isPositive = tx.type === 'deposit' || tx.type === 'daily_yield' || tx.type === 'referral_bonus';
                
                return (
                  <motion.tr 
                    key={tx.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.02 }}
                    className="hover:bg-[#111726]/40 transition-colors"
                  >
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                          tx.type === 'daily_yield'
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : tx.type === 'referral_bonus'
                            ? 'bg-purple-500/15 text-purple-400 border-purple-500/30'
                            : tx.type === 'withdrawal'
                            ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                            : tx.type === 'deposit'
                            ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}>
                          {tx.type === 'daily_yield' ? <Coins className="w-4 h-4" /> :
                           tx.type === 'referral_bonus' ? <Users className="w-4 h-4" /> :
                           tx.type === 'withdrawal' ? <ArrowUpRight className="w-4 h-4" /> :
                           tx.type === 'deposit' ? <ArrowDownLeft className="w-4 h-4" /> :
                           <Layers className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="font-bold text-white capitalize">{tx.type.replace('_', ' ')}</div>
                          <div className="text-[11px] text-slate-400">{tx.destination || tx.reference}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-5 text-slate-300">
                      <div>{tx.description}</div>
                    </td>

                    <td className="py-3.5 px-5 text-slate-400 font-mono text-[11px]">
                      <div>{tx.date}</div>
                      <div className="text-slate-500">{tx.reference}</div>
                    </td>

                    <td className="py-3.5 px-5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                        tx.status === 'completed'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : tx.status === 'processing'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        {tx.status === 'completed' && <CheckCircle2 className="w-3 h-3" />}
                        <span className="capitalize">{tx.status}</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-5 text-right font-mono font-bold text-sm">
                      <span className={isPositive ? 'text-emerald-400' : 'text-slate-300'}>
                        {isPositive ? '+' : '-'}KES {tx.amountKES.toLocaleString()}
                      </span>
                    </td>
                  </motion.tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};
