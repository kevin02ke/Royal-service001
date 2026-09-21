import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Navbar } from './components/Navbar';
import { NavigationDrawer } from './components/NavigationDrawer';
import { AuthScreen } from './components/AuthScreen';
import { LegalAndComplianceModal } from './components/LegalAndComplianceModal';
import { DashboardView } from './components/DashboardView';
import { PackagesView } from './components/PackagesView';
import { CalculatorView } from './components/CalculatorView';
import { ActiveInvestmentsView } from './components/ActiveInvestmentsView';
import { ReferralsView } from './components/ReferralsView';
import { AdminPanel } from './components/AdminPanel';
import { TransactionsView } from './components/TransactionsView';
import { ProfileView } from './components/ProfileView';
import { ApiExplorerView } from './components/ApiExplorerView';
import { DepositModal } from './components/DepositModal';
import { WithdrawModal } from './components/WithdrawModal';
import { FloatingChatWidget } from './components/FloatingChatWidget';
import { CommunicationCenterModal } from './components/CommunicationCenterModal';
import { 
  InvestmentPackage, 
  PlatformSettings, 
  UserProfile, 
  ActiveInvestment, 
  WithdrawalRequest, 
  ReferralMember, 
  Transaction,
  WithdrawalMethod 
} from './types';
import { 
  initialPackages, 
  initialPlatformSettings, 
  initialUser, 
  initialActiveInvestments, 
  initialWithdrawals, 
  initialReferralMembers, 
  initialTransactions 
} from './data/defaultData';
import { 
  packagesApi, 
  investmentsApi, 
  transactionsApi, 
  withdrawalsApi, 
  referralsApi, 
  settingsApi 
} from './services/api';
import { CheckCircle, Info, ShieldAlert, Sparkles, Sliders } from 'lucide-react';

export default function App() {
  // Authentication State: Require login or registration first
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('royalservice_authenticated') === 'true';
  });

  // Application State
  const [packages, setPackages] = useState<InvestmentPackage[]>(() => {
    const saved = localStorage.getItem('royalservice_packages');
    return saved ? JSON.parse(saved) : initialPackages;
  });

  const [isApiConnected, setIsApiConnected] = useState<boolean>(true);
  const [isLoadingPackages, setIsLoadingPackages] = useState<boolean>(true);

  const [settings, setSettings] = useState<PlatformSettings>(() => {
    const saved = localStorage.getItem('royalservice_settings');
    return saved ? JSON.parse(saved) : initialPlatformSettings;
  });

  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('royalservice_user');
    return saved ? JSON.parse(saved) : initialUser;
  });

  const [activeInvestments, setActiveInvestments] = useState<ActiveInvestment[]>(() => {
    const saved = localStorage.getItem('royalservice_investments');
    return saved ? JSON.parse(saved) : initialActiveInvestments;
  });

  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>(() => {
    const saved = localStorage.getItem('royalservice_withdrawals');
    return saved ? JSON.parse(saved) : initialWithdrawals;
  });

  const [referrals, setReferrals] = useState<ReferralMember[]>(() => {
    const saved = localStorage.getItem('royalservice_referrals');
    return saved ? JSON.parse(saved) : initialReferralMembers;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('royalservice_transactions');
    return saved ? JSON.parse(saved) : initialTransactions;
  });

  // UI Navigation State - Defaults to user dashboard upon signing in
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isDepositOpen, setIsDepositOpen] = useState<boolean>(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState<boolean>(false);
  const [isLegalOpen, setIsLegalOpen] = useState<boolean>(false);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [legalInitialTab, setLegalInitialTab] = useState<'reserve' | 'legal' | 'terms' | 'privacy'>('reserve');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load initial data from REST backend on mount (wired to Neon PostgreSQL)
  useEffect(() => {
    let isMounted = true;

    // 1. Packages
    packagesApi.getAll()
      .then((remotePackages) => {
        if (isMounted && remotePackages && remotePackages.length > 0) {
          setPackages(remotePackages);
          setIsApiConnected(true);
        }
      })
      .catch((err) => {
        console.warn('Backend packages API unreachable, using local storage fallback:', err);
        if (isMounted) setIsApiConnected(false);
      })
      .finally(() => {
        if (isMounted) setIsLoadingPackages(false);
      });

    // 2. Platform Settings
    settingsApi.get()
      .then((remoteSettings) => {
        if (isMounted && remoteSettings) setSettings(remoteSettings);
      })
      .catch(() => {});

    // 3. User Investments
    investmentsApi.getAll(user.id)
      .then((remoteInv) => {
        if (isMounted && remoteInv && remoteInv.length > 0) setActiveInvestments(remoteInv);
      })
      .catch(() => {});

    // 4. Ledger Transactions
    transactionsApi.getAll(user.id)
      .then((remoteTx) => {
        if (isMounted && remoteTx && remoteTx.length > 0) setTransactions(remoteTx);
      })
      .catch(() => {});

    // 5. Withdrawals
    withdrawalsApi.getAll(user.id)
      .then((remoteWth) => {
        if (isMounted && remoteWth && remoteWth.length > 0) setWithdrawals(remoteWth);
      })
      .catch(() => {});

    // 6. Referrals
    referralsApi.getAll(user.id)
      .then((remoteRefs) => {
        if (isMounted && remoteRefs && remoteRefs.length > 0) setReferrals(remoteRefs);
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [user.id]);

  // Sync state to localStorage for persistence
  useEffect(() => {
    localStorage.setItem('royalservice_packages', JSON.stringify(packages));
  }, [packages]);

  useEffect(() => {
    localStorage.setItem('royalservice_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('royalservice_user', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem('royalservice_investments', JSON.stringify(activeInvestments));
  }, [activeInvestments]);

  useEffect(() => {
    localStorage.setItem('royalservice_withdrawals', JSON.stringify(withdrawals));
  }, [withdrawals]);

  useEffect(() => {
    localStorage.setItem('royalservice_referrals', JSON.stringify(referrals));
  }, [referrals]);

  useEffect(() => {
    localStorage.setItem('royalservice_transactions', JSON.stringify(transactions));
  }, [transactions]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Activate Investment Package
  const handleActivatePackage = (pkg: InvestmentPackage) => {
    if (user.walletBalanceKES < pkg.priceKES) {
      showToast('Insufficient wallet balance. Please deposit funds first.');
      return;
    }

    const dailyPayout = (pkg.priceKES * (pkg.dailyRoiPercent / 100));
    const newInvestment: ActiveInvestment = {
      id: `inv-${Date.now().toString().slice(-5)}`,
      packageId: pkg.id,
      packageName: pkg.name,
      amountKES: pkg.priceKES,
      dailyRoiPercent: pkg.dailyRoiPercent,
      dailyReturnKES: dailyPayout,
      durationDays: pkg.durationDays,
      daysElapsed: 0,
      totalEarnedKES: 0,
      unclaimedYieldKES: 0,
      startDate: new Date().toISOString().split('T')[0],
      lastClaimDate: new Date().toISOString().split('T')[0],
      status: 'active',
    };

    // Deduct wallet balance, increase invested capital
    setUser(prev => ({
      ...prev,
      walletBalanceKES: prev.walletBalanceKES - pkg.priceKES,
      investedCapitalKES: prev.investedCapitalKES + pkg.priceKES,
    }));

    setActiveInvestments(prev => [newInvestment, ...prev]);

    // Record Transaction
    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      type: 'investment',
      amountKES: pkg.priceKES,
      description: `Activated ${pkg.name} (${pkg.dailyRoiPercent}% daily for ${pkg.durationDays} days)`,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'completed',
      reference: newInvestment.id,
    };
    setTransactions(prev => [newTx, ...prev]);

    // Persist to Neon DB via backend REST API
    investmentsApi.activate({
      userId: user.id,
      investment: newInvestment,
      transaction: newTx,
      userUpdates: {
        walletBalanceKES: user.walletBalanceKES - pkg.priceKES,
        investedCapitalKES: user.investedCapitalKES + pkg.priceKES,
      }
    }).catch(err => console.warn('Neon DB activation sync warning:', err));

    showToast(`Successfully activated ${pkg.name}! Daily returns will accrue every 24 hours.`);
    setActiveTab('investments');
  };

  // 2. Claim Yield from a single contract
  const handleClaimYield = (investmentId: string) => {
    const inv = activeInvestments.find(i => i.id === investmentId);
    if (!inv || inv.unclaimedYieldKES <= 0) return;

    const claimAmount = inv.unclaimedYieldKES;

    setActiveInvestments(prev => prev.map(item => {
      if (item.id === investmentId) {
        return {
          ...item,
          unclaimedYieldKES: 0,
          lastClaimDate: new Date().toISOString().split('T')[0],
        };
      }
      return item;
    }));

    setUser(prev => ({
      ...prev,
      walletBalanceKES: prev.walletBalanceKES + claimAmount,
      totalEarningsAccruedKES: prev.totalEarningsAccruedKES + claimAmount,
    }));

    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      type: 'daily_yield',
      amountKES: claimAmount,
      description: `Claimed daily yield from ${inv.packageName}`,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'completed',
      reference: `CLM-${investmentId}`,
    };
    setTransactions(prev => [newTx, ...prev]);

    showToast(`Claimed KES ${claimAmount.toLocaleString()} to your wallet balance!`);
  };

  // 3. Claim All Unclaimed Yields
  const handleClaimAllYields = () => {
    const totalToClaim = activeInvestments.reduce((sum, i) => sum + i.unclaimedYieldKES, 0);
    if (totalToClaim <= 0) return;

    setActiveInvestments(prev => prev.map(item => ({
      ...item,
      unclaimedYieldKES: 0,
      lastClaimDate: new Date().toISOString().split('T')[0],
    })));

    setUser(prev => ({
      ...prev,
      walletBalanceKES: prev.walletBalanceKES + totalToClaim,
      totalEarningsAccruedKES: prev.totalEarningsAccruedKES + totalToClaim,
    }));

    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      type: 'daily_yield',
      amountKES: totalToClaim,
      description: `Bulk claimed accrued yield across active contracts`,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'completed',
      reference: `BULK-CLAIM-${Date.now().toString().slice(-4)}`,
    };
    setTransactions(prev => [newTx, ...prev]);

    showToast(`Successfully claimed total KES ${totalToClaim.toLocaleString()} to wallet!`);
  };

  // 4. Submit Withdrawal Request (10% fee for M-Pesa, 5% fee for Polygon USDT, Min KES 100)
  const handleSubmitWithdrawal = (
    amountKES: number, 
    method: WithdrawalMethod, 
    destination: string, 
    accountName: string,
    feeKES?: number,
    netAmountKES?: number
  ) => {
    const minThreshold = settings.minWithdrawalKES || 100;
    if (amountKES < minThreshold) {
      showToast(`Minimum withdrawal threshold is KES ${minThreshold}`);
      return;
    }
    if (amountKES > user.walletBalanceKES) {
      showToast('Insufficient wallet balance');
      return;
    }

    // 1. Anti-Fraud & Demo Guard
    const isDemo = user.role === 'demo' || 
                   user.isDemo === true || 
                   user.email === 'j.wanjiku@investor.ke' || 
                   user.email === 'ken.omondi@gmail.com' || 
                   user.id.includes('demo');
    if (isDemo) {
      showToast('⚠️ Withdrawals are strictly disabled on demo simulation accounts. Please create a personal investor account.');
      return;
    }

    // 2. Active Investment / Yield Requirement
    const hasCapital = (user.investedCapitalKES || 0) > 0 || 
                       (user.totalEarningsAccruedKES || 0) > 0 || 
                       (user.totalReferralBonusKES || 0) > 0;
    if (!hasCapital) {
      showToast('Withdrawals require an active investment package or accrued yields.');
      return;
    }

    const isCrypto = method === 'crypto';
    const feePercent = isCrypto 
      ? (settings.cryptoWithdrawalFeePercent ?? 5) 
      : (settings.mpesaWithdrawalFeePercent ?? 10);
    
    const calculatedFee = feeKES !== undefined ? feeKES : Math.round(amountKES * (feePercent / 100));
    const calculatedNet = netAmountKES !== undefined ? netAmountKES : Math.max(0, amountKES - calculatedFee);

    const newWithdrawal: WithdrawalRequest = {
      id: `wth-${Date.now().toString().slice(-5)}`,
      userId: user.id,
      userName: user.name,
      amountKES,
      method,
      destination,
      accountName,
      feeKES: calculatedFee,
      netAmountKES: calculatedNet,
      status: 'pending',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      estimatedDelivery: isCrypto 
        ? 'Pending Review • Up to 2 hours via Polygon USDT' 
        : `Within 6 hours via Safaricom B2C queue`,
      txHashOrRef: isCrypto 
        ? `CRYPTO-USDT-WTH-${Math.random().toString(36).substring(2, 8).toUpperCase()}` 
        : `PEND-MP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    };

    setUser(prev => ({
      ...prev,
      walletBalanceKES: prev.walletBalanceKES - amountKES,
      totalWithdrawnKES: prev.totalWithdrawnKES + calculatedNet,
    }));

    setWithdrawals(prev => [newWithdrawal, ...prev]);

    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      type: 'withdrawal',
      amountKES,
      description: isCrypto 
        ? `Polygon USDT Payout Request (${(calculatedNet / settings.usdtToKesExchangeRate).toFixed(2)} USDT) [5% Fee: KES ${calculatedFee.toLocaleString()}]`
        : `M-Pesa B2C Withdrawal to ${destination} (Net KES ${calculatedNet.toLocaleString()} • 10% Fee)`,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'pending',
      reference: newWithdrawal.txHashOrRef,
    };
    setTransactions(prev => [newTx, ...prev]);

    // Persist withdrawal request and ledger to Neon DB
    withdrawalsApi.create({
      withdrawal: newWithdrawal,
      transaction: newTx,
      userUpdates: {
        walletBalanceKES: user.walletBalanceKES - amountKES,
        totalWithdrawnKES: user.totalWithdrawnKES + calculatedNet,
      }
    }).catch(err => console.warn('Neon DB withdrawal sync warning:', err));

    showToast(`Withdrawal request of KES ${calculatedNet.toLocaleString()} (${isCrypto ? 'Polygon USDT' : 'M-Pesa'}) submitted for admin approval.`);
  };

  // 6. Deposit Callback
  const handleDepositSuccess = (amountKES: number, channel: 'mpesa' | 'crypto', ref: string) => {
    const updatedBalance = user.walletBalanceKES + amountKES;
    setUser(prev => ({
      ...prev,
      walletBalanceKES: updatedBalance,
    }));

    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      type: 'deposit',
      amountKES,
      description: channel === 'mpesa' 
        ? 'M-Pesa STK Push Instant Deposit' 
        : `Polygon USDT Deposit (${(amountKES / settings.usdtToKesExchangeRate).toFixed(2)} USDT)`,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'completed',
      reference: ref,
    };
    setTransactions(prev => [newTx, ...prev]);

    // Persist deposit transaction and updated wallet balance to Neon DB
    transactionsApi.record({
      userId: user.id,
      transaction: newTx,
      userUpdates: {
        walletBalanceKES: updatedBalance,
      }
    }).catch((err: any) => console.warn('Neon DB deposit sync warning:', err));

    showToast(`Credited KES ${amountKES.toLocaleString()} to your wallet balance!`);
  };

  // 7. Admin Package CRUD Controls (Integrated with Backend REST API /api/packages)
  const handleUpdatePackage = async (updatedPkg: InvestmentPackage) => {
    try {
      const saved = await packagesApi.update(updatedPkg.id, updatedPkg);
      setPackages(prev => prev.map(p => p.id === saved.id ? saved : p));
      setIsApiConnected(true);
      showToast(`Updated ${saved.name}: KES ${saved.priceKES.toLocaleString()} • ${saved.dailyRoiPercent}% daily • ${saved.durationDays} days`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'API offline';
      setPackages(prev => prev.map(p => p.id === updatedPkg.id ? updatedPkg : p));
      showToast(`Locally updated ${updatedPkg.name} (${message})`);
    }
  };

  const handleCreatePackage = async (newPkg: InvestmentPackage) => {
    try {
      const created = await packagesApi.create(newPkg);
      setPackages(prev => [...prev, created]);
      setIsApiConnected(true);
      showToast(`Created ${created.name}: KES ${created.priceKES.toLocaleString()} • ${created.dailyRoiPercent}% daily • ${created.durationDays} days`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'API offline';
      setPackages(prev => [...prev, newPkg]);
      showToast(`Locally created plan ${newPkg.name} (${message})`);
    }
  };

  const handleDeletePackage = async (id: string) => {
    try {
      await packagesApi.delete(id);
      setPackages(prev => prev.filter(p => p.id !== id));
      setIsApiConnected(true);
      showToast('Package removed successfully via API.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'API offline';
      setPackages(prev => prev.filter(p => p.id !== id));
      showToast(`Package removed locally (${message})`);
    }
  };

  const handleResetPackages = async () => {
    try {
      const restored = await packagesApi.reset();
      setPackages(restored);
      setIsApiConnected(true);
      showToast('Restored default investment packages (Silver, Bronze, Gold, Platinum).');
    } catch (err: unknown) {
      setPackages(initialPackages);
      showToast('Restored default investment packages locally.');
    }
  };

  const handleUpdateSettings = (newSettings: PlatformSettings) => {
    setSettings(newSettings);
    settingsApi.update(newSettings).catch(err => console.warn('Neon DB settings sync warning:', err));
    showToast('Global thresholds and commission tiers saved.');
  };

  const handleApproveWithdrawal = (id: string) => {
    const paidRef = `MPESA-B2C-PAID-${Date.now().toString().slice(-6)}`;
    setWithdrawals(prev => prev.map(w => {
      if (w.id === id) {
        return {
          ...w,
          status: 'completed',
          txHashOrRef: paidRef,
          estimatedDelivery: 'Disbursed via Safaricom B2C API',
        };
      }
      return w;
    }));

    setTransactions(prev => prev.map(t => {
      if (t.reference && t.reference.includes(id)) {
        return { ...t, status: 'completed' };
      }
      return t;
    }));

    withdrawalsApi.updateStatus(id, 'completed', paidRef).catch(err => console.warn('Neon DB withdrawal status sync warning:', err));
    showToast(`Withdrawal ${id} approved and marked completed.`);
  };

  const handleRejectWithdrawal = (id: string, reason: string) => {
    const target = withdrawals.find(w => w.id === id);
    if (!target) return;

    const newWallet = user.walletBalanceKES + target.amountKES;
    const newWithdrawn = Math.max(0, user.totalWithdrawnKES - target.amountKES);

    // Refund back to user's wallet
    setUser(prev => ({
      ...prev,
      walletBalanceKES: newWallet,
      totalWithdrawnKES: newWithdrawn,
    }));

    setWithdrawals(prev => prev.map(w => {
      if (w.id === id) {
        return {
          ...w,
          status: 'rejected',
          rejectionReason: reason,
        };
      }
      return w;
    }));

    withdrawalsApi.updateStatus(id, 'rejected', undefined, reason).catch(err => console.warn('Neon DB withdrawal status sync warning:', err));

    const refundTx: Transaction = {
      id: `tx-ref-${Date.now()}`,
      type: 'deposit',
      amountKES: target.amountKES,
      description: `Refund for rejected withdrawal ${id}: ${reason}`,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'completed',
      reference: `REFUND-${id}`,
    };
    setTransactions(prev => [refundTx, ...prev]);

    showToast(`Withdrawal ${id} rejected. Refunded KES ${target.amountKES} to user wallet.`);
  };

  const handleLogout = () => {
    localStorage.removeItem('royalservice_authenticated');
    setIsAuthenticated(false);
    setIsDrawerOpen(false);
    setIsAdminMode(false);
    showToast('You have been signed out.');
  };

  const handleUserAuthenticated = (authenticatedUser: UserProfile) => {
    setUser(authenticatedUser);
    setIsAuthenticated(true);
    setActiveTab('dashboard');
    setIsAdminMode(false);
    localStorage.setItem('royalservice_authenticated', 'true');
    showToast(`Welcome, ${authenticatedUser.name}!`);
  };

  const handleRefreshUserData = async () => {
    try {
      const res = await fetch(`/api/auth/me?userId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
          localStorage.setItem('royalservice_user', JSON.stringify(data.user));
        }
      }
      const remoteRefs = await referralsApi.getAll(user.id);
      if (remoteRefs) setReferrals(remoteRefs);
    } catch (err) {
      console.warn('Failed to refresh user:', err);
    }
  };

  // If user is not signed in, show AuthScreen (Registration / Login) first
  if (!isAuthenticated) {
    return (
      <AuthScreen 
        onUserAuthenticated={handleUserAuthenticated}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#080B11] text-slate-100 flex flex-col font-sans antialiased selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Banner: Royal Services with hamburger menu on the right & direct quick actions */}
      <Navbar
        onOpenMenu={() => setIsDrawerOpen(true)}
        onBrandClick={() => { setActiveTab('dashboard'); setIsAdminMode(false); }}
        onOpenChat={() => setIsChatOpen(true)}
        onOpenCalculator={() => { setActiveTab('calculator'); setIsAdminMode(false); }}
        onOpenDeposit={() => setIsDepositOpen(true)}
        onOpenWithdraw={() => setIsWithdrawOpen(true)}
        user={user}
        activeTab={activeTab}
      />

      {/* Slide-over Hamburger Navigation Drawer */}
      <NavigationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isAdminMode={isAdminMode}
        setIsAdminMode={setIsAdminMode}
        onOpenDeposit={() => setIsDepositOpen(true)}
        onOpenWithdraw={() => setIsWithdrawOpen(true)}
        onOpenChat={() => setIsChatOpen(true)}
        onLogout={handleLogout}
        user={user}
        settings={settings}
      />

      {/* Toast Notification Alert */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 bg-[#0f172a] text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700/80 flex items-center gap-3 text-xs"
          >
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Body Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        <AnimatePresence mode="wait">
          {isAdminMode ? (
            <motion.div
              key="admin"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              <AdminPanel
                user={user}
                packages={packages}
                settings={settings}
                withdrawals={withdrawals}
                onUpdatePackage={handleUpdatePackage}
                onCreatePackage={handleCreatePackage}
                onDeletePackage={handleDeletePackage}
                onResetPackages={handleResetPackages}
                isApiConnected={isApiConnected}
                onUpdateSettings={handleUpdateSettings}
                onApproveWithdrawal={handleApproveWithdrawal}
                onRejectWithdrawal={handleRejectWithdrawal}
                onSwitchToInvestorView={() => setIsAdminMode(false)}
              />
            </motion.div>
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              {activeTab === 'dashboard' && (
                <DashboardView
                  user={user}
                  activeInvestments={activeInvestments}
                  packages={packages}
                  transactions={transactions}
                  referrals={referrals}
                  settings={settings}
                  onOpenDeposit={() => setIsDepositOpen(true)}
                  onOpenWithdraw={() => setIsWithdrawOpen(true)}
                  onOpenChat={() => setIsChatOpen(true)}
                  onNavigate={(tab) => {
                    setActiveTab(tab);
                    setIsAdminMode(false);
                  }}
                  onClaimYield={handleClaimYield}
                  onClaimAll={handleClaimAllYields}
                  onSwitchToAdmin={user.role === 'admin' ? () => setIsAdminMode(true) : undefined}
                />
              )}

              {activeTab === 'packages' && (
                <PackagesView
                  packages={packages}
                  user={user}
                  settings={settings}
                  onActivatePackage={handleActivatePackage}
                  onOpenDeposit={() => setIsDepositOpen(true)}
                  onOpenWithdraw={() => setIsWithdrawOpen(true)}
                />
              )}

              {activeTab === 'calculator' && (
                <CalculatorView
                  packages={packages}
                  user={user}
                  settings={settings}
                  onActivatePackage={handleActivatePackage}
                  onOpenDeposit={() => setIsDepositOpen(true)}
                  onNavigateToPackages={() => setActiveTab('packages')}
                />
              )}

              {activeTab === 'investments' && (
                <ActiveInvestmentsView
                  investments={activeInvestments}
                  onClaimYield={handleClaimYield}
                  onClaimAll={handleClaimAllYields}
                  onNavigateToPackages={() => setActiveTab('packages')}
                  onOpenDeposit={() => setIsDepositOpen(true)}
                  onOpenWithdraw={() => setIsWithdrawOpen(true)}
                />
              )}

              {activeTab === 'referrals' && (
                <ReferralsView
                  user={user}
                  referrals={referrals}
                  settings={settings}
                  onRefreshUser={handleRefreshUserData}
                />
              )}

              {activeTab === 'history' && (
                <TransactionsView
                  transactions={transactions}
                  onOpenDeposit={() => setIsDepositOpen(true)}
                  onOpenWithdraw={() => setIsWithdrawOpen(true)}
                />
              )}

              {activeTab === 'profile' && (
                <ProfileView
                  user={user}
                  onOpenDeposit={() => setIsDepositOpen(true)}
                  onOpenWithdraw={() => setIsWithdrawOpen(true)}
                  onNavigateToPortfolios={() => setActiveTab('investments')}
                />
              )}

              {activeTab === 'api' && (
                <ApiExplorerView />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Global Modals */}
      <DepositModal
        isOpen={isDepositOpen}
        onClose={() => setIsDepositOpen(false)}
        user={user}
        settings={settings}
        onDepositSuccess={handleDepositSuccess}
      />

      <WithdrawModal
        isOpen={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
        user={user}
        settings={settings}
        onSubmitWithdrawal={handleSubmitWithdrawal}
      />

      <LegalAndComplianceModal
        isOpen={isLegalOpen}
        onClose={() => setIsLegalOpen(false)}
        initialTab={legalInitialTab}
      />

      {/* Communication Service Floating Concierge & Modal */}
      <FloatingChatWidget
        onOpen={() => setIsChatOpen(true)}
        user={user}
      />

      <CommunicationCenterModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        user={user}
      />

      {/* Clean Minimalist Dark Footer */}
      <footer className="bg-[#0a0e17] border-t border-slate-800/80 py-5 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
            <div className="flex items-center gap-2">
              <span className="text-slate-300 font-bold">Royal Services</span>
              <span>&copy; {new Date().getFullYear()} All rights reserved.</span>
            </div>
            <div className="flex items-center gap-4">
              <span>Polygon USDT: <strong className="text-emerald-400">Instant</strong></span>
              <span>M-Pesa: <strong className="text-slate-300">Automated</strong></span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
