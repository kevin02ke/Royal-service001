import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Eye, 
  EyeOff, 
  Share2, 
  CheckCircle2, 
  AlertCircle, 
  Database, 
  Crown,
  ArrowRight,
  LogIn,
  UserPlus
} from 'lucide-react';
import { UserProfile } from '../types';
import { authApi, NeonStatusResponse } from '../services/authApi';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onUserAuthenticated: (user: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserAuthenticated,
}) => {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  
  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('+254 ');
  const [regPassword, setRegPassword] = useState('');
  const [regReferralCode, setRegReferralCode] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Neon DB status state
  const [neonStatus, setNeonStatus] = useState<NeonStatusResponse | null>(null);

  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      setSuccessMsg(null);
      authApi.getNeonStatus()
        .then(status => setNeonStatus(status))
        .catch(() => setNeonStatus(null));

      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const refCode = params.get('ref') || params.get('invite') || params.get('referral');
        if (refCode && refCode.trim() && !regReferralCode) {
          setRegReferralCode(refCode.trim().toUpperCase());
          setTab('register');
          setSuccessMsg(`Invited with partner code ${refCode.trim().toUpperCase()}!`);
        }
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!loginIdentifier.trim()) {
      setErrorMsg('Please enter your email or phone number');
      return;
    }
    if (!loginPassword) {
      setErrorMsg('Please enter your password');
      return;
    }

    setIsLoading(true);
    try {
      const res = await authApi.login({
        identifier: loginIdentifier.trim(),
        password: loginPassword,
      });
      setSuccessMsg('Signed in successfully! Loading your portfolio...');
      setTimeout(() => {
        onUserAuthenticated(res.user);
        onClose();
      }, 700);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to sign in. Please verify your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!regName.trim()) {
      setErrorMsg('Please enter your full legal name');
      return;
    }
    if (!regEmail.trim() || !regEmail.includes('@')) {
      setErrorMsg('Please provide a valid email address');
      return;
    }
    if (!regPhone.trim() || regPhone.length < 9) {
      setErrorMsg('Please provide your phone number (e.g. +254 7XX XXX XXX)');
      return;
    }
    if (regPassword.length < 6) {
      setErrorMsg('Password must contain at least 6 characters');
      return;
    }

    setIsLoading(true);
    try {
      const res = await authApi.register({
        name: regName.trim(),
        email: regEmail.trim(),
        phone: regPhone.trim(),
        password: regPassword,
        referredByCode: regReferralCode.trim() || undefined,
      });
      setSuccessMsg('Account created! KES 100 starter credit added to your wallet.');
      setTimeout(() => {
        onUserAuthenticated(res.user);
        onClose();
      }, 900);
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoSwitch = (identifier: string, password = 'password123') => {
    setLoginIdentifier(identifier);
    setLoginPassword(password);
    setErrorMsg(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-[#0b101b] border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl my-8 relative"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-[#101726] p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-emerald-500 flex items-center justify-center text-slate-950 font-black shadow-lg">
              <Crown className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">Investor Portal Access</h2>
              <p className="text-[11px] text-slate-400">Royal Service Capital & Yield Desk</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switchers */}
        <div className="flex border-b border-slate-800 bg-[#080d17]">
          <button
            onClick={() => { setTab('login'); setErrorMsg(null); setSuccessMsg(null); }}
            className={`flex-1 py-3 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              tab === 'login'
                ? 'text-emerald-400 border-b-2 border-emerald-500 bg-emerald-500/5'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
          <button
            onClick={() => { setTab('register'); setErrorMsg(null); setSuccessMsg(null); }}
            className={`flex-1 py-3 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              tab === 'register'
                ? 'text-emerald-400 border-b-2 border-emerald-500 bg-emerald-500/5'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Create Account</span>
            <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.5 rounded-full border border-emerald-500/30">
              +100 KES
            </span>
          </button>
        </div>

        {/* Feedback alerts */}
        {errorMsg && (
          <div className="mx-5 mt-4 p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mx-5 mt-4 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Forms Body */}
        <div className="p-5">
          {tab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Email Address or Phone
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="j.wanjiku@investor.ke or +254..."
                    className="w-full bg-[#111726] border border-slate-700/80 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter account password"
                    className="w-full bg-[#111726] border border-slate-700/80 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition cursor-pointer"
              >
                {isLoading ? (
                  <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-slate-950 border-t-transparent" />
                ) : (
                  <>
                    <span>Sign In to Portfolio</span>
                    <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                  </>
                )}
              </button>

              {/* Quick test accounts */}
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <p className="text-[11px] text-slate-400 font-medium flex items-center justify-between">
                  <span>Quick 1-click test sign-in:</span>
                  <span className="text-[10px] text-purple-400 font-semibold">Admin Available</span>
                </p>

                <button
                  type="button"
                  id="modal-quick-admin-login"
                  onClick={() => handleQuickDemoSwitch('admin@royalservices.ke', 'AdminSecure2026!')}
                  className="w-full py-1.5 px-3 bg-purple-950/40 hover:bg-purple-950/70 border border-purple-500/40 rounded-xl text-xs text-purple-200 font-medium transition text-left cursor-pointer flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-white text-[11px]">Royal Administrator</div>
                    <div className="text-[10px] text-purple-300/80 font-mono">admin@royalservices.ke</div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold uppercase tracking-wider border border-purple-500/30">
                    Admin
                  </span>
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickDemoSwitch('j.wanjiku@investor.ke', 'password123')}
                    className="flex-1 py-1.5 px-2 bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 rounded-lg text-[10px] text-slate-300 font-medium transition text-left"
                  >
                    <div className="font-bold text-white">Jane Wanjiku</div>
                    <div className="text-[9px] text-emerald-400">Investor (Demo)</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDemoSwitch('ken.omondi@gmail.com', 'password123')}
                    className="flex-1 py-1.5 px-2 bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 rounded-lg text-[10px] text-slate-300 font-medium transition text-left"
                  >
                    <div className="font-bold text-white">Kennedy Omondi</div>
                    <div className="text-[9px] text-emerald-400">Investor (Demo)</div>
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Full Legal Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. Peter Kamau"
                    className="w-full bg-[#111726] border border-slate-700/80 rounded-xl pl-10 pr-3.5 py-2.2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="peter.kamau@investor.ke"
                    className="w-full bg-[#111726] border border-slate-700/80 rounded-xl pl-10 pr-3.5 py-2.2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Phone Number (M-Pesa Payout Rail)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="+254 7XX XXX XXX"
                    className="w-full bg-[#111726] border border-slate-700/80 rounded-xl pl-10 pr-3.5 py-2.2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Account Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full bg-[#111726] border border-slate-700/80 rounded-xl pl-10 pr-10 py-2.2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Sponsor / Referral Code <span className="text-slate-500 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <Share2 className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={regReferralCode}
                    onChange={(e) => setRegReferralCode(e.target.value.toUpperCase())}
                    placeholder="e.g. ROYAL-JANE77"
                    className="w-full bg-[#111726] border border-slate-700/80 rounded-xl pl-10 pr-3.5 py-2.2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition font-mono"
                  />
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-[11px] text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>New accounts automatically receive a KES 100 starter wallet credit.</span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition cursor-pointer"
              >
                {isLoading ? (
                  <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-slate-950 border-t-transparent" />
                ) : (
                  <>
                    <span>Complete Registration</span>
                    <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Database backend pill footer */}
        <div className="px-5 py-3 bg-[#080d17] border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-teal-400" />
            <span>Database: <strong className="text-slate-300">Neon PostgreSQL</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-slate-400">ep-little-hall-b5o6vcsm</span>
            <span className={`w-2 h-2 rounded-full ${neonStatus?.connected ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]' : 'bg-emerald-500'}`} />
          </div>
        </div>
      </motion.div>
    </div>
  );
};
