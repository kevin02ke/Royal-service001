import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  ShieldCheck, 
  FileText, 
  Lock, 
  Mail, 
  CheckCircle2, 
  Building2,
  Scale,
  Award,
  ArrowRight
} from 'lucide-react';

interface LegalAndComplianceModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'reserve' | 'legal' | 'terms' | 'privacy';
}

export const LegalAndComplianceModal: React.FC<LegalAndComplianceModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'reserve',
}) => {
  const [activeTab, setActiveTab] = useState<'reserve' | 'legal' | 'terms' | 'privacy'>(initialTab);
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [requestEmail, setRequestEmail] = useState('');
  const [requestName, setRequestName] = useState('');

  if (!isOpen) return null;

  const handleRequestDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestEmail) return;
    setContactSubmitted(true);
  };

  const tabs = [
    { id: 'reserve', label: 'KES 500k Escrow Fund', icon: Award },
    { id: 'legal', label: 'Request Legal Docs', icon: Scale },
    { id: 'terms', label: 'Terms of Service', icon: FileText },
    { id: 'privacy', label: 'User Data & Privacy', icon: Lock },
  ] as const;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="relative bg-[#0d121d] rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-800/90 overflow-hidden flex flex-col max-h-[90vh] z-10"
        >
          {/* Header */}
          <div className="p-5 flex items-center justify-between bg-[#111726]/80 text-white shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-white tracking-tight">Trust, Legal & Regulatory Portal</h3>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30 font-semibold uppercase tracking-wider">
                    Verified
                  </span>
                </div>
                <p className="text-xs text-slate-400">Legal Governance, Reserve Escrow & Standard Terms</p>
              </div>
            </div>
            <motion.button 
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </motion.button>
          </div>

          {/* Tab Navigation Pill Bar */}
          <div className="px-5 py-2.5 bg-[#0a0e17] flex gap-1.5 overflow-x-auto text-xs font-semibold shrink-0">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setContactSubmitted(false); }}
                  className={`relative px-3.5 py-2 rounded-xl transition cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                    isSelected ? 'text-emerald-300' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {isSelected && (
                    <motion.div
                      layoutId="legalTabPill"
                      className="absolute inset-0 bg-emerald-500/15 border border-emerald-500/30 rounded-xl"
                      transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                    />
                  )}
                  <Icon className="w-3.5 h-3.5 relative z-10" />
                  <span className="relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Content Body */}
          <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-300 leading-relaxed">
            
            {/* TAB 1: KES 500,000 Reserve Fund */}
            {activeTab === 'reserve' && (
              <motion.div 
                key="tab-reserve"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="p-4 bg-emerald-950/40 rounded-xl border border-emerald-500/30 shadow-[0_0_25px_rgba(16,185,129,0.06)]">
                  <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm mb-1.5">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <span>Bonded Risk Reserve & Liquidity Escrow (KES 500,000)</span>
                  </div>
                  <p className="text-slate-300">
                    To guarantee absolute financial solvency and protect user capital, a bonded <strong className="text-emerald-300">KES 500,000 Risk Reserve Fund</strong> is held in dedicated escrow. This emergency liquidity pool guarantees continuous member contract disbursements in any business condition.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-4 bg-[#111726]/60 rounded-xl border border-slate-800/80">
                    <div className="font-semibold text-white mb-1 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-emerald-400" />
                      Attorney-Supervised Escrow
                    </div>
                    <p className="text-slate-400 text-[11px]">
                      Reserve assets and regulatory compliance charters are retained under custodial oversight by retained legal counsel.
                    </p>
                  </div>

                  <div className="p-4 bg-[#111726]/60 rounded-xl border border-slate-800/80">
                    <div className="font-semibold text-white mb-1 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      100% Payout Solvency
                    </div>
                    <p className="text-slate-400 text-[11px]">
                      Automated Binance Pay rails and instant Safaricom M-Pesa B2C batch allocations backed by verified capital reserves.
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-[#111726] border border-slate-800 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-white text-xs">Inspect Legal Documentation & Proof of Escrow</h4>
                    <p className="text-slate-400 text-[11px]">
                      Our legal representatives maintain all certified records and will provide full documentation without hesitation.
                    </p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveTab('legal')}
                    className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition cursor-pointer whitespace-nowrap shrink-0"
                  >
                    Request Documents →
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* TAB 2: Legal Documentation Request */}
            {activeTab === 'legal' && (
              <motion.div 
                key="tab-legal"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="p-4 bg-blue-950/30 rounded-xl border border-blue-500/30 text-slate-200">
                  <h4 className="font-bold text-sm mb-1.5 flex items-center gap-2 text-blue-300">
                    <Scale className="w-4 h-4 text-blue-400" />
                    Official Legal Documents & Regulatory Verification
                  </h4>
                  <p className="text-xs text-slate-300">
                    All statutory filings, corporate registration documents, tax compliance records, and risk reserve affidavits are managed by our lawyers. If you are a prospective partner or auditor wishing to inspect our legal credentials, we provide them immediately upon request.
                  </p>
                </div>

                {contactSubmitted ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-6 bg-emerald-950/40 rounded-xl border border-emerald-500/30 text-center space-y-2.5"
                  >
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <h4 className="font-bold text-white text-sm">Request Transmitted to Legal Counsel</h4>
                    <p className="text-xs text-slate-300 max-w-sm mx-auto">
                      Thank you, <strong className="text-white">{requestName || 'Partner'}</strong>. Certified documentation packages and escrow certificates will be transmitted to <strong className="text-emerald-300">{requestEmail}</strong> shortly.
                    </p>
                    <button
                      onClick={() => setContactSubmitted(false)}
                      className="text-xs text-emerald-400 hover:text-emerald-300 underline font-semibold cursor-pointer pt-2"
                    >
                      Submit another inquiry
                    </button>
                  </motion.div>
                ) : (
                  <form onSubmit={handleRequestDoc} className="space-y-3.5 p-4 bg-[#111726]/60 rounded-xl border border-slate-800/80">
                    <h5 className="font-semibold text-white text-xs">Direct Document Request Form</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">Your Full Name</label>
                        <input
                          type="text"
                          value={requestName}
                          onChange={(e) => setRequestName(e.target.value)}
                          className="w-full px-3 py-2 bg-[#0a0e17] border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                          placeholder="e.g. John Doe / Firm Name"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">Official Email Address</label>
                        <input
                          type="email"
                          value={requestEmail}
                          onChange={(e) => setRequestEmail(e.target.value)}
                          className="w-full px-3 py-2 bg-[#0a0e17] border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                          placeholder="e.g. partner@example.com"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">Documents to Include</label>
                      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" defaultChecked className="rounded accent-emerald-500" />
                          KES 500k Escrow Proof
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" defaultChecked className="rounded accent-emerald-500" />
                          Company Registration
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" defaultChecked className="rounded accent-emerald-500" />
                          Tax Compliance Certificate
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" defaultChecked className="rounded accent-emerald-500" />
                          Legal Counsel Affidavit
                        </label>
                      </div>
                    </div>

                    <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <span className="text-[11px] text-slate-400">
                        Official Legal Desk: <span className="text-emerald-400 font-mono">legal@royalservice.ke</span>
                      </span>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-bold cursor-pointer transition shadow-sm"
                      >
                        Request Certified Documents
                      </motion.button>
                    </div>
                  </form>
                )}
              </motion.div>
            )}

            {/* TAB 3: Terms of Service */}
            {activeTab === 'terms' && (
              <motion.div 
                key="tab-terms"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-3"
              >
                <div className="p-3.5 bg-[#111726]/60 rounded-xl border border-slate-800/80">
                  <h4 className="font-semibold text-white mb-1">1. User Agreement & Participation</h4>
                  <p className="text-slate-300 text-xs">
                    By funding an investment package, the user agrees to adhere to platform operational rules, smart contract durations, and automated daily return schedules. All capital deployments are executed under user direction.
                  </p>
                </div>

                <div className="p-3.5 bg-[#111726]/60 rounded-xl border border-slate-800/80">
                  <h4 className="font-semibold text-white mb-1">2. Yield Accrual, Tenure & Expiration Terms</h4>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    Daily returns accrue every 24 hours based on package specifications (for example, a KES 900 package with 10% daily return generates KES 90 per day for exactly 20 days, delivering KES 1,800 in total return payouts). Accruals are credited to the ledger and can be withdrawn anytime. Upon completion of the designated tenure (e.g., 20 days), the package has delivered its full cycle of payouts and automatically expires; initial capital is non-refundable and will not be returned.
                  </p>
                </div>

                <div className="p-3.5 bg-[#111726]/60 rounded-xl border border-slate-800/80">
                  <h4 className="font-semibold text-white mb-1">3. Multi-Tier Affiliate Guidelines</h4>
                  <p className="text-slate-300 text-xs">
                    Affiliate commissions (Tier 1: 7%, Tier 2: 3%, Tier 3: 1%) are granted upon verified package activations by downline network members. Fraudulent accounts or synthetic self-referral structures are strictly prohibited.
                  </p>
                </div>

                <div className="p-3.5 bg-[#111726]/60 rounded-xl border border-slate-800/80">
                  <h4 className="font-semibold text-white mb-1">4. Risk Management & Reserve Commitment</h4>
                  <p className="text-slate-300 text-xs">
                    To mitigate market volatility, Royal Service maintains a bonded KES 500,000 reserve fund in attorney escrow to back liquidity commitments.
                  </p>
                </div>
              </motion.div>
            )}

            {/* TAB 4: User Data & Privacy */}
            {activeTab === 'privacy' && (
              <motion.div 
                key="tab-privacy"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-3"
              >
                <div className="p-3.5 bg-[#111726]/60 rounded-xl border border-slate-800/80">
                  <h4 className="font-semibold text-white mb-1">1. Personal Data Protection</h4>
                  <p className="text-slate-300 text-xs">
                    We strictly comply with the Kenya Data Protection Act (KDPA) 2019 and global privacy standards. Phone numbers, transaction hashes, and Binance identifiers are encrypted using AES-256 standards and are never sold or shared.
                  </p>
                </div>

                <div className="p-3.5 bg-[#111726]/60 rounded-xl border border-slate-800/80">
                  <h4 className="font-semibold text-white mb-1">2. Payment Verification Records</h4>
                  <p className="text-slate-300 text-xs">
                    Transaction identifiers (Safaricom STK Push receipt codes and Binance Pay transaction IDs) are retained solely for balance reconciliation, fraud prevention, and audit compliance.
                  </p>
                </div>

                <div className="p-3.5 bg-[#111726]/60 rounded-xl border border-slate-800/80">
                  <h4 className="font-semibold text-white mb-1">3. Right to Information</h4>
                  <p className="text-slate-300 text-xs">
                    Users may request account statement exports or balance confirmation certificates by submitting an inquiry to our compliance desk.
                  </p>
                </div>
              </motion.div>
            )}

          </div>

          {/* Footer */}
          <div className="p-4 bg-[#0a0e17] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <div className="text-[11px] text-slate-400 flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>Corporate Compliance: <strong className="text-slate-300 font-mono">compliance@royalservice.ke</strong></span>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold cursor-pointer transition"
            >
              Close Disclosures
            </motion.button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
