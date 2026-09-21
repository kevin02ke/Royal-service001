import React, { useState } from 'react';
import { AlertTriangle, ShieldCheck, Info, X } from 'lucide-react';

export const RiskNoticeBanner: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <aside 
        aria-label="Financial risk and regulatory compliance disclosure"
        className="bg-amber-50 border-y border-amber-200 px-4 py-2.5 text-xs text-amber-900"
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Regulatory & Risk Transparency Notice:</strong> In real commercial finance, no investment carries "zero risk." Guaranteed high daily returns (such as 3%/day) carry significant market risk and require Capital Markets Authority (CMA) licensing.
            </span>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="text-amber-800 underline hover:text-amber-950 font-semibold shrink-0 cursor-pointer text-xs"
          >
            Read CMA & Risk Guidelines
          </button>
        </div>
      </aside>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-base">Financial Integrity & Disclosure</h3>
                  <p className="text-xs text-slate-500">Legal & Regulatory Guidelines (Kenya & International)</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3.5 text-xs text-slate-600 leading-relaxed max-h-[60vh] overflow-y-auto">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <h4 className="font-semibold text-slate-800 mb-1 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-emerald-600" />
                  1. The "Zero Risk" Principle in Finance
                </h4>
                <p>
                  Any financial product that guarantees fixed high returns (e.g. 3% daily = 90% monthly) cannot mathematically be "risk-free." Real-world financial regulators (such as the Capital Markets Authority of Kenya, CBK, and global SECs) explicitly prohibit advertising investments as "zero risk."
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <h4 className="font-semibold text-slate-800 mb-1 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-emerald-600" />
                  2. Multi-tier Referral Compliance
                </h4>
                <p>
                  Multi-tier affiliate compensation structures must be strictly backed by genuine economic utility, trading yields, or asset appreciation. Schemes where returns to early investors are derived exclusively from incoming member deposits are classified as pyramid or Ponzi models and violate Section 396A of the Kenyan Penal Code.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <h4 className="font-semibold text-slate-800 mb-1 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-emerald-600" />
                  3. Settlement Speed & Liquidity
                </h4>
                <p>
                  While Polygon USDT crypto rails support automated API settlement, mobile money disbursements (M-Pesa B2C) are subject to batch liquidity reconciliations and compliance verifications, typically processed within 6 hours.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition"
              >
                I Understand & Proceed
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
