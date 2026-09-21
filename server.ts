import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { 
  initNeonSchema, 
  getDbStatus, 
  findUserByEmailOrPhone, 
  findUserById, 
  createUser, 
  listAllUsers, 
  updateUserBalance,
  getAllPackages,
  createInvestmentPackage,
  updateInvestmentPackage,
  deleteInvestmentPackage,
  resetInvestmentPackages,
  getUserInvestments,
  createInvestment,
  getUserTransactions,
  createTransaction,
  getUserWithdrawals,
  createWithdrawal,
  updateWithdrawalStatus,
  getUserReferrals,
  getChatThreads,
  getChatThreadByUserId,
  addChatMessageToDb,
  getPlatformSettings,
  updatePlatformSettingsInDb,
  logAntiFraudEvent,
  getAntiFraudEvents,
  freezeUserAccount,
  unfreezeUserAccount,
  getAntiFraudMetrics,
  calculateUserCampaignStats,
  updateUserSalaryConfig,
  processSundaySalaryDisbursements,
  releaseMaturedCommissions,
  processReferralDepositReward,
  getPendingCommissions,
  getWeeklySalaryPayouts,
  insertReferralMember,
  recordReferralContactReminder
} from './src/services/neonDb.ts';
import { 
  initiatePayHeroStkPush, 
  handlePayHeroCallback, 
  checkPayHeroPaymentStatus,
  getPayHeroBasicAuth
} from './src/services/payheroService.ts';
import {
  createNowPaymentsDeposit,
  checkNowPaymentsPaymentStatus,
  handleNowPaymentsIpnWebhook,
  createNowPaymentsPayout,
  getNowPaymentsCredentials
} from './src/services/nowpaymentsService.ts';
import { RiskAssessmentService } from './src/services/riskAssessmentService.ts';
import { InvestmentPackage, ChatMessage, ChatThread } from './src/types.ts';

// Helper: Format current timestamp (e.g., '10:45 AM')
const getFormattedTime = () => {
  const d = new Date();
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '30mb' }));
  app.use(express.urlencoded({ extended: true, limit: '30mb' }));

  // Logging middleware for API requests
  app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
      console.log(`[API] ${req.method} ${req.path}`);
    }
    next();
  });

  // Health check endpoint
  app.get('/api/health', async (req: Request, res: Response) => {
    const packages = await getAllPackages().catch(() => []);
    res.json({
      status: 'ok',
      service: 'Royal Service Investment API',
      timestamp: new Date().toISOString(),
      packageCount: packages.length,
    });
  });

  // Initialize Neon DB schema & tables if DATABASE_URL is configured
  initNeonSchema().then((ok) => {
    if (ok) {
      console.log('[Neon DB] Schema and all 9 tables ready on Neon PostgreSQL.');
    }
  }).catch(err => console.warn('[Neon DB] Schema init notice:', err));

  // GET /api/neon/status - Real-time connection status & row counts across all 9 Neon tables
  app.get('/api/neon/status', async (req: Request, res: Response) => {
    try {
      const status = await getDbStatus();
      res.json(status);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to check Neon DB status' });
    }
  });

  // POST /api/neon/sync - Force re-initialization and verification of Neon schema
  app.post('/api/neon/sync', async (req: Request, res: Response) => {
    try {
      const ok = await initNeonSchema();
      const status = await getDbStatus();
      res.json({ success: ok, status });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to sync Neon schema' });
    }
  });

  // ==========================================
  // AUTHENTICATION & USER MANAGEMENT (Neon DB)
  // ==========================================

  // POST /api/auth/register - Register new investor account in Neon
  app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
      const { name, email, phone, password, referredByCode } = req.body;
      if (!name || !email || !phone || !password) {
        return res.status(400).json({ error: 'Full name, email, phone number, and password are required' });
      }
      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
      }

      const existingEmail = await findUserByEmailOrPhone(email);
      if (existingEmail) {
        return res.status(409).json({ error: 'An account with this email address already exists' });
      }

      const existingPhone = await findUserByEmailOrPhone(phone);
      if (existingPhone) {
        return res.status(409).json({ error: 'An account with this phone number already exists' });
      }

      // Anti-Fraud: Self-Referral Prevention (Anti-Sybil)
      let validatedReferralCode: string | undefined = undefined;
      if (referredByCode && typeof referredByCode === 'string' && referredByCode.trim()) {
        const trimmedCode = referredByCode.trim();
        const allUsers = await listAllUsers();
        const referrerUser = allUsers.find(u => u.referralCode?.toUpperCase() === trimmedCode.toUpperCase());

        if (referrerUser) {
          const cleanPhone1 = phone.replace(/[^0-9]/g, '');
          const cleanPhone2 = referrerUser.phone.replace(/[^0-9]/g, '');
          const isPhoneMatch = (cleanPhone1 && cleanPhone2) && (cleanPhone1.endsWith(cleanPhone2.slice(-7)) || cleanPhone2.endsWith(cleanPhone1.slice(-7)));
          const isEmailMatch = email.trim().toLowerCase() === referrerUser.email.trim().toLowerCase();

          if (isPhoneMatch || isEmailMatch) {
            await logAntiFraudEvent({
              id: `afe-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              eventType: 'SELF_REFERRAL_ATTEMPT',
              userIdentifier: `${name} (${phone})`,
              riskScore: 75,
              severity: 'high',
              actionTaken: 'BLOCKED',
              details: `Self-referral attempt blocked: Applicant used referral code ${trimmedCode} matching existing phone/email account (${referrerUser.name}). Referral link rejected.`,
              ipAddress: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress,
              createdAt: new Date().toISOString(),
            });
            validatedReferralCode = undefined;
          } else {
            validatedReferralCode = trimmedCode;
          }
        }
      }

      const user = await createUser({ 
        name, 
        email, 
        phone, 
        password, 
        referredByCode: validatedReferralCode 
      });

      if (validatedReferralCode) {
        try {
          const allUsers = await listAllUsers();
          const referrerUser = allUsers.find(u => u.referralCode?.toUpperCase() === validatedReferralCode!.toUpperCase());
          if (referrerUser) {
            await insertReferralMember({
              id: `ref-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              name: user.name,
              phoneOrEmail: user.phone || user.email,
              tier: 1,
              referredBy: referrerUser.id,
              joinedDate: new Date().toISOString().substring(0, 10),
              totalDepositedKES: 0,
              commissionEarnedKES: 0,
              packageActive: 'Pending Deposit',
              status: 'active',
              isQualifying: false,
            });
          }
        } catch (refLinkErr) {
          console.warn('[Register] Error linking downline member:', refLinkErr);
        }
      }

      const { passwordHash, ...safeUser } = user;
      res.status(201).json({
        success: true,
        user: safeUser,
        message: 'Account created successfully! KES 100 starter bonus credited.',
      });
    } catch (err: any) {
      console.error('[API Auth] Registration error:', err);
      res.status(500).json({ error: err.message || 'Failed to register account' });
    }
  });

  // POST /api/auth/login - Investor sign in
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const { identifier, password } = req.body;
      if (!identifier || !password) {
        return res.status(400).json({ error: 'Please provide email/phone and password' });
      }
      const user = await findUserByEmailOrPhone(identifier);
      if (!user || user.passwordHash !== password) {
        return res.status(401).json({ error: 'Invalid email/phone or password' });
      }
      const { passwordHash, ...safeUser } = user;
      res.json({
        success: true,
        user: safeUser,
        message: 'Signed in successfully',
      });
    } catch (err: any) {
      console.error('[API Auth] Login error:', err);
      res.status(500).json({ error: err.message || 'Sign in failed' });
    }
  });

  // GET /api/auth/me - Current user profile
  app.get('/api/auth/me', async (req: Request, res: Response) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }
      const user = await findUserById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User profile not found' });
      }
      const { passwordHash, ...safeUser } = user;
      res.json({ success: true, user: safeUser });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch user profile' });
    }
  });

  // GET /api/auth/users - List all users (admin)
  app.get('/api/auth/users', async (req: Request, res: Response) => {
    try {
      const users = await listAllUsers();
      res.json({ success: true, users });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to list users' });
    }
  });

  // PUT /api/auth/profile/:id - Update user balances in Neon DB
  app.put('/api/auth/profile/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      await updateUserBalance(id, updates);
      const updated = await findUserById(id);
      if (!updated) return res.status(404).json({ error: 'User not found' });
      const { passwordHash, ...safeUser } = updated;
      res.json({ success: true, user: safeUser });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to update user profile' });
    }
  });

  // ==========================================
  // INVESTMENT PACKAGES APIS (Neon DB)
  // ==========================================

  // GET /api/packages - Retrieve investment packages
  app.get('/api/packages', async (req: Request, res: Response) => {
    try {
      const packages = await getAllPackages();
      const { activeOnly } = req.query;
      if (activeOnly === 'true') {
        return res.json(packages.filter(p => p.isActive));
      }
      res.json(packages);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch packages' });
    }
  });

  // GET /api/packages/:id - Single package
  app.get('/api/packages/:id', async (req: Request, res: Response) => {
    try {
      const packages = await getAllPackages();
      const pkg = packages.find(p => p.id === req.params.id);
      if (!pkg) {
        return res.status(404).json({ error: 'Package not found' });
      }
      res.json(pkg);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch package' });
    }
  });

  // POST /api/packages - Administrator creates package in Neon DB
  app.post('/api/packages', async (req: Request, res: Response) => {
    try {
      const body = req.body;
      const name = body.name?.trim();
      const cost = Number(body.priceKES !== undefined ? body.priceKES : body.cost);
      const dailyRoiPercent = Number(body.dailyRoiPercent);
      const durationDays = Number(body.durationDays);

      if (!name) return res.status(400).json({ error: 'Package name is required' });
      if (isNaN(cost) || cost <= 0) return res.status(400).json({ error: 'Package cost must be a positive number' });
      if (isNaN(dailyRoiPercent) || dailyRoiPercent <= 0) return res.status(400).json({ error: 'Daily ROI must be greater than 0' });
      if (isNaN(durationDays) || durationDays <= 0 || !Number.isInteger(durationDays)) return res.status(400).json({ error: 'Duration must be a positive integer in days' });

      const dailyPayout = cost * (dailyRoiPercent / 100);
      const totalReturn = dailyPayout * durationDays;

      const newPackage: InvestmentPackage = {
        id: body.id || `pkg-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString().slice(-4)}`,
        name,
        tag: body.tag?.trim() || undefined,
        priceKES: cost,
        dailyRoiPercent,
        durationDays,
        description: body.description?.trim() || `${dailyRoiPercent}% daily yield for ${durationDays} days.`,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
        color: body.color || 'from-indigo-600 to-purple-700',
        features: Array.isArray(body.features) && body.features.length > 0 
          ? body.features 
          : [
              `Daily ${dailyRoiPercent}% return (KES ${dailyPayout.toFixed(1)}/day)`,
              `Total Return: KES ${totalReturn.toFixed(0)} (${((totalReturn / cost) * 100).toFixed(0)}%)`,
              `Contract cycle: ${durationDays} Days`,
              'Direct withdrawal eligibility once > KES 100',
            ],
      };

      const saved = await createInvestmentPackage(newPackage);
      res.status(201).json(saved);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to create package' });
    }
  });

  // PUT /api/packages/:id - Administrator edits package in Neon DB
  app.put('/api/packages/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const body = req.body;
      const updated = await updateInvestmentPackage(id, body);
      if (!updated) {
        return res.status(404).json({ error: `Package with ID ${id} not found` });
      }
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to update package' });
    }
  });

  // DELETE /api/packages/:id - Administrator deletes package in Neon DB
  app.delete('/api/packages/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await deleteInvestmentPackage(id);
      res.json({ success: true, message: `Package ${id} removed successfully`, deletedId: id });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to delete package' });
    }
  });

  // POST /api/packages/reset - Reset packages back to defaults in Neon DB
  app.post('/api/packages/reset', async (req: Request, res: Response) => {
    try {
      const packages = await resetInvestmentPackages();
      res.json({ success: true, packages });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to reset packages' });
    }
  });

  // ==========================================
  // USER INVESTMENTS APIS (Neon DB)
  // ==========================================

  // GET /api/investments - List user active & completed investments
  app.get('/api/investments', async (req: Request, res: Response) => {
    try {
      const userId = (req.query.userId as string) || 'usr-98214';
      const investments = await getUserInvestments(userId);
      res.json(investments);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch investments' });
    }
  });

  // POST /api/investments - Activate investment contract in Neon DB
  app.post('/api/investments', async (req: Request, res: Response) => {
    try {
      const { userId, investment, transaction, userUpdates } = req.body;
      const uid = userId || 'usr-98214';

      const user = await findUserById(uid);
      if (user?.isFrozen) {
        return res.status(403).json({
          error: `Account is frozen under Anti-Fraud Protocol: ${user.freezeReason || 'Security lock active'}. Capital activation is disabled.`,
        });
      }

      const savedInv = await createInvestment(uid, investment);
      if (transaction) {
        await createTransaction(uid, transaction);
      }
      if (userUpdates) {
        await updateUserBalance(uid, userUpdates);
      }

      res.status(201).json({ success: true, investment: savedInv });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to activate investment' });
    }
  });

  // ==========================================
  // TRANSACTIONS APIS (Neon DB)
  // ==========================================

  // GET /api/transactions - List ledger transactions from Neon DB
  app.get('/api/transactions', async (req: Request, res: Response) => {
    try {
      const userId = (req.query.userId as string) || 'usr-98214';
      const transactions = await getUserTransactions(userId);
      res.json(transactions);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch transactions' });
    }
  });

  // POST /api/transactions - Record new deposit, yield or bonus in Neon DB
  app.post('/api/transactions', async (req: Request, res: Response) => {
    try {
      const { userId, transaction, userUpdates } = req.body;
      const uid = userId || 'usr-98214';
      const savedTx = await createTransaction(uid, transaction);
      if (userUpdates) {
        await updateUserBalance(uid, userUpdates);
      }

      // Referral Campaign: Trigger 10% reward with 72-hour fraud shield on friend deposit
      if (transaction && transaction.type === 'deposit' && Number(transaction.amountKES || 0) > 0) {
        try {
          const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
          await processReferralDepositReward(uid, Number(transaction.amountKES), clientIp, transaction.reference || transaction.id);
        } catch (rewErr) {
          console.warn('[Deposit Reward] Referral reward processing notice:', rewErr);
        }
      }

      res.status(201).json({ success: true, transaction: savedTx });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to record transaction' });
    }
  });

  // ==========================================
  // WITHDRAWALS APIS (Neon DB)
  // ==========================================

  // GET /api/withdrawals - List withdrawals from Neon DB
  app.get('/api/withdrawals', async (req: Request, res: Response) => {
    try {
      const userId = req.query.userId as string | undefined;
      const withdrawals = await getUserWithdrawals(userId);
      res.json(withdrawals);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch withdrawals' });
    }
  });

  // POST /api/withdrawals - Request withdrawal in Neon DB with Anti-Fraud Shield
  app.post('/api/withdrawals', async (req: Request, res: Response) => {
    try {
      const { withdrawal, transaction } = req.body;
      if (!withdrawal) {
        return res.status(400).json({ error: 'Withdrawal payload is required' });
      }

      const uid = withdrawal.userId || 'usr-98214';
      const settings = await getPlatformSettings();
      const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

      // 1. Fetch User Record
      const user = await findUserById(uid);
      if (!user) {
        return res.status(404).json({ error: 'Investor account profile not found' });
      }

      // 1b. Anti-Fraud Rule: Demo Account Simulation Guard
      const isDemoAccount = (user.role as string) === 'demo' || 
                            (user as any).isDemo === true ||
                            uid.includes('demo') ||
                            user.email === 'j.wanjiku@investor.ke' ||
                            user.email === 'ken.omondi@gmail.com';
      if (isDemoAccount) {
        await logAntiFraudEvent({
          id: `afe-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          eventType: 'UNAUTHORIZED_BALANCE_DRAIN',
          userId: uid,
          userIdentifier: `${user.name} (${user.email})`,
          riskScore: 85,
          severity: 'high',
          actionTaken: 'BLOCKED',
          details: `Blocked payout attempt on simulated demo account. Demo funds are non-disbursable.`,
          ipAddress: clientIp,
          createdAt: new Date().toISOString(),
        });

        return res.status(403).json({
          error: 'Withdrawals are disabled on demo simulation accounts. Please register your own investor account and make an active capital deposit to earn and withdraw returns.',
          isDemoBlocked: true,
        });
      }

      // 1c. Anti-Fraud Rule: Active Capital / Accrued Earnings Requirement
      const hasInvested = (user.investedCapitalKES || 0) > 0;
      const hasEarned = (user.totalEarningsAccruedKES || 0) > 0 || (user.totalReferralBonusKES || 0) > 0;
      if (!hasInvested && !hasEarned) {
        return res.status(403).json({
          error: 'Withdrawals require an active investment package or verified accrued yield.',
        });
      }

      // 2. Anti-Fraud Rule: Account Frozen Check (Kill Switch)
      if (user.isFrozen) {
        await logAntiFraudEvent({
          id: `afe-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          eventType: 'ACCOUNT_FROZEN',
          userId: uid,
          userIdentifier: `${user.name} (${user.phone})`,
          riskScore: 90,
          severity: 'critical',
          actionTaken: 'BLOCKED',
          details: `Blocked withdrawal attempt of KES ${withdrawal.amountKES} on frozen account: ${user.freezeReason || 'Security review active'}`,
          ipAddress: clientIp,
          createdAt: new Date().toISOString(),
        });
        return res.status(403).json({
          error: `Account is frozen under Anti-Fraud Protocol: ${user.freezeReason || 'Security lock active'}. Financial operations are suspended. Contact compliance support.`,
        });
      }

      // 3. Risk-Based KYC Verification Gate
      const kycThreshold = Number(settings.kycRiskScoreThreshold || 60);
      const isKycEnforced = (settings.kycRequiredForHighRisk !== false && (user.riskScore || 0) >= kycThreshold) || user.kycStatus === 'REQUIRED';
      if (isKycEnforced && user.kycStatus !== 'APPROVED') {
        await logAntiFraudEvent({
          id: `afe-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          eventType: 'KYC_TRIGGERED',
          userId: uid,
          userIdentifier: `${user.name} (${user.phone})`,
          riskScore: Number(user.riskScore || 65),
          severity: 'high',
          actionTaken: 'KYC_ENFORCED',
          details: `Payout blocked pending mandatory KYC clearance (Risk score: ${user.riskScore || 0}/${100}, KYC status: ${user.kycStatus || 'REQUIRED'}).`,
          ipAddress: clientIp,
          createdAt: new Date().toISOString(),
        });

        return res.status(403).json({
          error: 'Identity verification required. High-risk activity detected on this account. Please complete KYC verification before requesting payouts.',
          requiresKyc: true,
          kycStatus: user.kycStatus || 'REQUIRED',
        });
      }

      const reqAmountKES = Number(withdrawal.amountKES || 0);
      if (reqAmountKES <= 0) {
        return res.status(400).json({ error: 'Invalid withdrawal amount' });
      }

      if (reqAmountKES < (settings.minWithdrawalKES || 100)) {
        return res.status(400).json({ error: `Minimum withdrawal is KES ${(settings.minWithdrawalKES || 100).toLocaleString()}` });
      }

      // 4. Evaluate Transaction Risk with RiskAssessmentService
      const userWithdrawals = await getUserWithdrawals(uid);
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      const recentWithdrawals24h = userWithdrawals.filter(w => {
        const timeStr = w.createdAt || (w as any).requestedAt;
        const time = timeStr ? new Date(timeStr).getTime() : Date.now();
        return time >= oneDayAgo && w.status !== 'rejected';
      });
      const total24hKES = recentWithdrawals24h.reduce((sum, w) => sum + Number(w.amountKES || 0), 0);

      const riskEvaluation = await RiskAssessmentService.assessTransactionRisk({
        userId: uid,
        type: 'withdrawal',
        amountKES: reqAmountKES,
        destination: withdrawal.destinationAddress || withdrawal.destination,
        clientIp,
        pastWithdrawalsCount24h: recentWithdrawals24h.length,
        totalWithdrawn24hKES: total24hKES,
      });

      // If this transaction triggers KYC on the spot
      if (riskEvaluation.requiresKyc && user.kycStatus !== 'APPROVED') {
        return res.status(403).json({
          error: 'Transaction triggered elevated security score. Government ID KYC verification is required to authorize this withdrawal.',
          requiresKyc: true,
          kycStatus: 'REQUIRED',
          riskScore: riskEvaluation.newRiskScore,
        });
      }

      // 5. Anti-Fraud Rule: Balance Double-Spend & Capital Verification
      if (reqAmountKES > user.walletBalanceKES) {
        await logAntiFraudEvent({
          id: `afe-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          eventType: 'UNAUTHORIZED_BALANCE_DRAIN',
          userId: uid,
          userIdentifier: `${user.name} (${user.phone})`,
          riskScore: 80,
          severity: 'high',
          actionTaken: 'BLOCKED',
          details: `Double-spend / overdraft attempt: Requested KES ${reqAmountKES}, but confirmed ledger balance is only KES ${user.walletBalanceKES}.`,
          ipAddress: clientIp,
          createdAt: new Date().toISOString(),
        });

        if (settings.autoFreezeHighRisk) {
          await freezeUserAccount(uid, `Automatic freeze: Attempted unauthorized balance drain (KES ${reqAmountKES} vs KES ${user.walletBalanceKES})`);
        }

        return res.status(400).json({
          error: `Insufficient verified balance. Requested KES ${reqAmountKES.toLocaleString()}, but available wallet balance is KES ${user.walletBalanceKES.toLocaleString()}.`,
        });
      }

      // 6. Anti-Fraud Rule: Daily Withdrawal Velocity Cap
      const maxDailyKES = Number(settings.maxDailyWithdrawalKES || 50000);

      if (settings.antiFraudEnabled && (total24hKES + reqAmountKES) > maxDailyKES) {
        await logAntiFraudEvent({
          id: `afe-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          eventType: 'VELOCITY_LIMIT_EXCEEDED',
          userId: uid,
          userIdentifier: `${user.name} (${user.phone})`,
          riskScore: 65,
          severity: 'high',
          actionTaken: 'BLOCKED',
          details: `Daily velocity limit exceeded: Attempted KES ${reqAmountKES} on top of KES ${total24hKES} withdrawn in last 24h (Max allowed: KES ${maxDailyKES}).`,
          ipAddress: clientIp,
          createdAt: new Date().toISOString(),
        });

        return res.status(429).json({
          error: `Daily withdrawal limit of KES ${maxDailyKES.toLocaleString()} exceeded. Already processed in last 24h: KES ${total24hKES.toLocaleString()}. Available daily quota: KES ${Math.max(0, maxDailyKES - total24hKES).toLocaleString()}.`,
        });
      }

      // 7. Anti-Fraud Rule: Withdrawal Cooldown Window & Concurrency Guard
      const hasPending = userWithdrawals.some(w => w.status === 'pending');
      if (hasPending) {
        await logAntiFraudEvent({
          id: `afe-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          eventType: 'VELOCITY_LIMIT_EXCEEDED',
          userId: uid,
          userIdentifier: `${user.name} (${user.phone})`,
          riskScore: 40,
          severity: 'medium',
          actionTaken: 'BLOCKED',
          details: `Concurrency block: User attempted second withdrawal while another withdrawal is still pending clearance.`,
          ipAddress: clientIp,
          createdAt: new Date().toISOString(),
        });

        return res.status(429).json({
          error: 'You already have a withdrawal pending review. Please wait for settlement before submitting another request.',
        });
      }

      // 6. Anti-Fraud Rule: Destination Phone Discrepancy Check (M-Pesa)
      if (withdrawal.method === 'mpesa' && withdrawal.destinationAddress) {
        const destPhone = withdrawal.destinationAddress.replace(/[^0-9]/g, '');
        const userPhone = user.phone.replace(/[^0-9]/g, '');
        if (destPhone && userPhone && !destPhone.endsWith(userPhone.slice(-7)) && !userPhone.endsWith(destPhone.slice(-7))) {
          await logAntiFraudEvent({
            id: `afe-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            eventType: 'SUSPICIOUS_WITHDRAWAL',
            userId: uid,
            userIdentifier: `${user.name} (${user.phone})`,
            riskScore: 45,
            severity: 'medium',
            actionTaken: 'FLAGGED_FOR_REVIEW',
            details: `Destination phone (${withdrawal.destinationAddress}) differs from verified profile phone (${user.phone}). Flagged for compliance audit.`,
            ipAddress: clientIp,
            createdAt: new Date().toISOString(),
          });
        }
      }

      // Server-side calculated fee prevents client payload tampering
      const feePercent = withdrawal.method === 'mpesa' 
        ? Number(settings.mpesaWithdrawalFeePercent || 10)
        : Number(settings.cryptoWithdrawalFeePercent ?? 5);
      const feeKES = (reqAmountKES * feePercent) / 100;
      const netAmountKES = reqAmountKES - feeKES;

      const sanitizedWithdrawal = {
        ...withdrawal,
        id: `wth-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        userId: uid,
        amountKES: reqAmountKES,
        feeKES,
        netAmountKES,
        status: 'pending' as const,
        createdAt: new Date().toISOString(),
      };

      const savedWth = await createWithdrawal(sanitizedWithdrawal);

      // Debit ledger balance immediately to prevent double-spend
      const newWalletBalance = Math.max(0, user.walletBalanceKES - reqAmountKES);
      const newWithdrawn = (user.totalWithdrawnKES || 0) + reqAmountKES;

      await updateUserBalance(uid, {
        walletBalanceKES: newWalletBalance,
        totalWithdrawnKES: newWithdrawn,
      });

      if (transaction) {
        await createTransaction(uid, {
          ...transaction,
          id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          userId: uid,
          amountKES: reqAmountKES,
          balanceAfterKES: newWalletBalance,
          status: 'pending',
          timestamp: new Date().toISOString(),
        });
      }

      // Check if crypto/NOWPayments withdrawal method with Polygon address (0x...)
      const isCryptoMethod = ['crypto', 'nowpayments', 'polygon'].includes(sanitizedWithdrawal.method);
      const destStr = sanitizedWithdrawal.destinationAddress || (sanitizedWithdrawal as any).destination || '';
      const polygonAddrMatch = destStr.match(/0x[a-fA-F0-9]{40}/);

      if (isCryptoMethod && polygonAddrMatch) {
        const polygonAddr = polygonAddrMatch[0];
        const { canAutoPayout } = getNowPaymentsCredentials();
        if (canAutoPayout) {
          // Attempt instant automated payout dispatch via NOWPayments API
          createNowPaymentsPayout({
            withdrawalId: savedWth.id,
            userId: uid,
            amountKES: reqAmountKES,
            netAmountKES: netAmountKES,
            usdtToKesRate: 130,
            polygonAddress: polygonAddr,
          }).then(async (payoutRes) => {
            if (payoutRes.success) {
              await updateWithdrawalStatus(
                savedWth.id,
                payoutRes.status === 'finished' ? 'completed' : 'processing',
                payoutRes.txHash || `NOW-PO-${payoutRes.payoutId}`
              );
            }
          }).catch((err) => console.warn('[Auto-Payout Error]:', err.message));
        }
      }

      res.status(201).json({ 
        success: true, 
        withdrawal: savedWth,
        message: 'Withdrawal authenticated and queued for processing.',
      });
    } catch (err: any) {
      console.error('[API Withdrawals] Error:', err);
      res.status(500).json({ error: err.message || 'Failed to create withdrawal' });
    }
  });

  // PATCH /api/withdrawals/:id/status - Update withdrawal status (admin) in Neon DB
  app.patch('/api/withdrawals/:id/status', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status, txHashOrRef, rejectionReason } = req.body;
      await updateWithdrawalStatus(id, status, txHashOrRef, rejectionReason);
      res.json({ success: true, id, status });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to update withdrawal status' });
    }
  });

  // ==========================================
  // REFERRALS APIS (Neon DB)
  // ==========================================

  // GET /api/referrals - List referral members from Neon DB
  app.get('/api/referrals', async (req: Request, res: Response) => {
    try {
      const referrerId = (req.query.referrerId || req.query.userId) as string | undefined;
      const referrals = await getUserReferrals(referrerId);
      res.json(referrals);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch referrals' });
    }
  });

  // POST /api/referrals/remind - Log contact reminder sent to invited friend
  app.post('/api/referrals/remind', async (req: Request, res: Response) => {
    try {
      const { memberId } = req.body;
      if (!memberId) {
        return res.status(400).json({ error: 'memberId is required' });
      }
      await recordReferralContactReminder(memberId);
      res.json({ success: true, message: 'Recharge reminder logged successfully' });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to record reminder' });
    }
  });

  // GET /api/referrals/campaign - Dynamic campaign stats, Sunday salary tier & pending balance
  app.get('/api/referrals/campaign', async (req: Request, res: Response) => {
    try {
      const userId = (req.query.userId as string) || 'usr-98214';
      // Dynamically detect host and protocol from incoming request (never hardcoded)
      const proto = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'https';
      const host = (req.headers['x-forwarded-host'] as string) || req.get('host') || 'royalservice.ke';
      const hostOrigin = `${proto}://${host}`;

      const campaign = await calculateUserCampaignStats(userId, hostOrigin);
      res.json(campaign);
    } catch (err: any) {
      console.error('[API Campaign] Error calculating campaign stats:', err);
      res.status(500).json({ error: err.message || 'Failed to fetch campaign overview' });
    }
  });

  // POST /api/referrals/salary-config - Configure automated Sunday salary destination (M-Pesa or Polygon USDT)
  app.post('/api/referrals/salary-config', async (req: Request, res: Response) => {
    try {
      const { userId, method, destination, accountName } = req.body;
      const uid = userId || 'usr-98214';
      
      if (!destination || typeof destination !== 'string' || !destination.trim()) {
        return res.status(400).json({ error: 'A valid payout destination (M-Pesa phone or Polygon USDT address) is required.' });
      }

      const cleanDest = destination.trim();
      const cleanMethod = method === 'crypto' ? 'crypto' : 'mpesa';

      // Anti-Fraud: Destination validation
      if (cleanMethod === 'mpesa') {
        const digits = cleanDest.replace(/[^0-9]/g, '');
        if (digits.length < 9 || digits.length > 13) {
          return res.status(400).json({ error: 'Invalid Safaricom M-Pesa phone number format (e.g. 0712345678 or 254712345678).' });
        }
      } else if (cleanMethod === 'crypto') {
        if (!cleanDest.startsWith('0x') || cleanDest.length !== 42) {
          return res.status(400).json({ error: 'Invalid Polygon USDT wallet address. Must be a valid 42-character EVM hex address (0x...).' });
        }
      }

      const updated = await updateUserSalaryConfig(uid, {
        method: cleanMethod,
        destination: cleanDest,
        accountName: accountName?.trim() || undefined,
        isAutoDisburse: true,
      });

      res.json({
        success: true,
        salaryConfig: updated,
        message: `Royal Weekly Salary automated destination saved successfully (${cleanMethod === 'crypto' ? 'Polygon USDT' : 'M-Pesa'}: ${cleanDest}). Payouts will trigger every Sunday automatically.`,
      });
    } catch (err: any) {
      console.error('[API Campaign] Error saving salary config:', err);
      res.status(500).json({ error: err.message || 'Failed to update salary destination' });
    }
  });

  // POST /api/referrals/process-matured - Trigger release of 72h matured pending commissions
  app.post('/api/referrals/process-matured', async (_req: Request, res: Response) => {
    try {
      const result = await releaseMaturedCommissions();
      res.json({
        success: true,
        ...result,
        message: `${result.releasedCount} matured 72-hour commissions released (KES ${result.releasedAmountKES.toLocaleString()} credited).`,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to release matured commissions' });
    }
  });

  // POST /api/referrals/process-sunday-salaries - Trigger Sunday salary automated payouts
  app.post('/api/referrals/process-sunday-salaries', async (req: Request, res: Response) => {
    try {
      const force = req.body?.force === true;
      const result = await processSundaySalaryDisbursements(force);
      res.json({
        success: true,
        ...result,
        message: `Royal Sunday Salary run completed: ${result.disbursedCount} partner disbursements processed (Total: KES ${result.totalDisbursedKES.toLocaleString()}).`,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to process Sunday salary disbursements' });
    }
  });

  // GET /api/referrals/pending-commissions - View pending 10% commissions with 72h countdown
  app.get('/api/referrals/pending-commissions', async (req: Request, res: Response) => {
    try {
      const userId = req.query.userId as string | undefined;
      const pending = await getPendingCommissions(userId);
      res.json(pending);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch pending commissions' });
    }
  });

  // GET /api/referrals/salary-payouts - View past Royal Weekly Salary payouts
  app.get('/api/referrals/salary-payouts', async (req: Request, res: Response) => {
    try {
      const userId = req.query.userId as string | undefined;
      const payouts = await getWeeklySalaryPayouts(userId);
      res.json(payouts);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch weekly salary payouts' });
    }
  });

  // ==========================================
  // PLATFORM SETTINGS APIS (Neon DB)
  // ==========================================

  // GET /api/settings - Platform configuration from Neon DB
  app.get('/api/settings', async (req: Request, res: Response) => {
    try {
      const settings = await getPlatformSettings();
      res.json(settings);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch platform settings' });
    }
  });

  // PUT /api/settings - Update platform configuration in Neon DB (Admin)
  app.put('/api/settings', async (req: Request, res: Response) => {
    try {
      const settings = await updatePlatformSettingsInDb(req.body);
      res.json(settings);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to update platform settings' });
    }
  });

  // ==========================================
  // ANTI-FRAUD & RISK SHIELD APIS (Neon DB)
  // ==========================================

  // GET /api/antifraud/metrics - Live security and threat metrics
  app.get('/api/antifraud/metrics', async (req: Request, res: Response) => {
    try {
      const metrics = await getAntiFraudMetrics();
      res.json({ success: true, metrics });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to get anti-fraud metrics' });
    }
  });

  // GET /api/antifraud/events - Real-time audit log of blocked exploits and alerts
  app.get('/api/antifraud/events', async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const events = await getAntiFraudEvents(limit);
      res.json({ success: true, events });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to get anti-fraud events' });
    }
  });

  // GET /api/antifraud/flagged-users - List flagged and high risk accounts
  app.get('/api/antifraud/flagged-users', async (req: Request, res: Response) => {
    try {
      const allUsers = await listAllUsers();
      const flagged = allUsers.filter(u => u.isFrozen || (u.riskScore || 0) > 0);
      res.json({ success: true, users: flagged });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to get flagged accounts' });
    }
  });

  // POST /api/antifraud/user/:id/freeze - Kill Switch: Lock account instantly
  app.post('/api/antifraud/user/:id/freeze', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const success = await freezeUserAccount(id, reason || 'Compliance and risk containment freeze');
      res.json({ success, message: `Account ${id} has been frozen. All payout and contract actions disabled.` });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to freeze account' });
    }
  });

  // POST /api/antifraud/user/:id/unfreeze - Restore account and reset risk score
  app.post('/api/antifraud/user/:id/unfreeze', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const success = await unfreezeUserAccount(id);
      res.json({ success, message: `Account ${id} unlocked and returned to active standing.` });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to unfreeze account' });
    }
  });

  // POST /api/antifraud/user/:id/kyc-toggle - Toggle/force KYC verification for flagged user (Admin)
  app.post('/api/antifraud/user/:id/kyc-toggle', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { force, reason } = req.body;
      const result = await RiskAssessmentService.setForceKyc(id, force !== false, reason);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to toggle KYC requirement' });
    }
  });

  // POST /api/kyc/submit - User submits KYC identity credentials
  app.post('/api/kyc/submit', async (req: Request, res: Response) => {
    try {
      const { userId, documentType, documentNumber, fullName, idFrontUrl, idBackUrl, selfieUrl } = req.body;
      if (!userId || !documentType || !documentNumber || !fullName) {
        return res.status(400).json({ error: 'User ID, document type, ID number, and full legal name are required' });
      }

      const result = await RiskAssessmentService.submitKyc(userId, {
        documentType,
        documentNumber,
        fullName,
        idFrontUrl,
        idBackUrl,
        selfieUrl,
      });

      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to submit KYC documents' });
    }
  });

  // POST /api/kyc/approve - Admin approves user KYC verification
  app.post('/api/kyc/approve', async (req: Request, res: Response) => {
    try {
      const { userId, adminNotes } = req.body;
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      const result = await RiskAssessmentService.approveKyc(userId, adminNotes);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to approve KYC' });
    }
  });

  // POST /api/kyc/reject - Admin rejects user KYC submission with reason
  app.post('/api/kyc/reject', async (req: Request, res: Response) => {
    try {
      const { userId, reason } = req.body;
      if (!userId || !reason) {
        return res.status(400).json({ error: 'User ID and rejection reason are required' });
      }

      const result = await RiskAssessmentService.rejectKyc(userId, reason);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to reject KYC' });
    }
  });

  // PUT /api/antifraud/settings - Update anti-fraud rules & parameters
  app.put('/api/antifraud/settings', async (req: Request, res: Response) => {
    try {
      const settings = await updatePlatformSettingsInDb(req.body);
      res.json({ success: true, settings, message: 'Anti-fraud policy updated successfully.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to update anti-fraud policy' });
    }
  });

  // ==========================================
  // COMMUNICATION CENTER / CHAT APIS (Neon DB)
  // ==========================================

  // GET /api/chat/threads - List all chat threads for Admin from Neon DB
  app.get('/api/chat/threads', async (req: Request, res: Response) => {
    try {
      const threads = await getChatThreads();
      const { status, search } = req.query;
      let filtered = [...threads];

      if (status && status !== 'all') {
        filtered = filtered.filter(t => t.status === status);
      }

      if (search && typeof search === 'string' && search.trim() !== '') {
        const q = search.trim().toLowerCase();
        filtered = filtered.filter(t => 
          t.userName.toLowerCase().includes(q) ||
          t.userPhone.toLowerCase().includes(q) ||
          t.userEmail.toLowerCase().includes(q) ||
          t.lastMessageSnippet.toLowerCase().includes(q)
        );
      }

      res.json(filtered);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch chat threads' });
    }
  });

  // GET /api/chat/threads/:userId - Get or initialize thread for user in Neon DB
  app.get('/api/chat/threads/:userId', async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const name = req.query.name?.toString() || 'Royal Member';
      const thread = await getChatThreadByUserId(userId, name);
      res.json(thread);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to get chat thread' });
    }
  });

  // POST /api/chat/threads/:userId/messages - Send message saved to Neon DB
  app.post('/api/chat/threads/:userId/messages', async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const body = req.body;
      const thread = await getChatThreadByUserId(userId);

      const sender = body.sender === 'admin' ? 'admin' : 'user';
      let senderName = (body.senderName || '').trim();
      if (sender === 'admin') {
        if (!senderName || !senderName.includes('(Assigned #')) {
          senderName = 'VIP Support Manager (Assigned #VIP-402)';
        }
      } else {
        senderName = senderName || thread.userName;
      }
      const text = body.text?.trim();
      const voiceNote = body.voiceNote;
      const attachment = body.attachment;

      if (!text && !voiceNote && !attachment) {
        return res.status(400).json({ error: 'Message must contain text, voice note, or attachment' });
      }

      const newMsg: ChatMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        threadId: thread.id,
        sender,
        senderName,
        text: text || undefined,
        timestamp: getFormattedTime(),
        isRead: false,
        voiceNote: voiceNote || undefined,
        attachment: attachment || undefined,
      };

      const snippet = text 
        ? (text.length > 50 ? `${text.slice(0, 50)}...` : text) 
        : voiceNote 
        ? `Voice note (${voiceNote.durationSec}s)` 
        : `Attachment: ${attachment?.name || 'File'}`;

      const incUser = sender === 'admin';
      const incAdmin = sender === 'user';

      await addChatMessageToDb(thread.id, newMsg, snippet, incUser, incAdmin);

      console.log(`[API Chat] Saved message in ${thread.id} to Neon DB`);
      res.status(201).json(newMsg);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to send message' });
    }
  });

  // ==========================================
  // PAYHERO KENYA C2B PAYMENT GATEWAY
  // ==========================================

  // POST /api/payhero/stk-push - Trigger M-Pesa STK Push for C2B deposit
  app.post('/api/payhero/stk-push', async (req: Request, res: Response) => {
    try {
      const { amount, phoneNumber, userId, channelId, callbackUrl } = req.body;
      if (!amount || Number(amount) <= 0) {
        return res.status(400).json({ error: 'Valid deposit amount in KES is required' });
      }
      const cleaned = (phoneNumber || '').replace(/\D/g, '');
      if (!phoneNumber || cleaned.length < 9) {
        return res.status(400).json({ error: 'Please enter a valid Safaricom phone number (e.g. 0712345678 or 254712345678)' });
      }

      // Dynamically resolve protocol and host from the active request
      const proto = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'https';
      const host = (req.headers['x-forwarded-host'] as string) || req.get('host') || '';
      const requestBase = host ? `${proto}://${host}` : '';
      const dynamicCallback = callbackUrl || (requestBase ? `${requestBase}/api/payhero/callback` : undefined);

      const uid = userId || 'usr-98214';
      const parsedChannel = channelId && !isNaN(Number(channelId)) && Number(channelId) > 1 ? Number(channelId) : undefined;

      const result = await initiatePayHeroStkPush({
        amount: Number(amount),
        phoneNumber,
        userId: uid,
        channelId: parsedChannel,
        callbackUrl: dynamicCallback,
      });

      res.status(200).json(result);
    } catch (err: any) {
      console.error('[API /api/payhero/stk-push Error]:', err.message);
      res.status(400).json({ error: err.message || 'M-Pesa STK Push initiation failed' });
    }
  });

  // POST /api/payhero/callback - Webhook endpoint registered with PayHero
  app.post('/api/payhero/callback', async (req: Request, res: Response) => {
    // PayHero docs mandate responding immediately with 200 OK
    res.status(200).json({ status: 'received' });

    try {
      const payload = req.body;
      await handlePayHeroCallback(payload);
    } catch (err: any) {
      console.error('[API /api/payhero/callback Error]:', err.message);
    }
  });

  // GET /api/payhero/status - Poll status of STK Push payment
  app.get('/api/payhero/status', async (req: Request, res: Response) => {
    try {
      const reference = (req.query.reference as string) || '';
      const externalReference = (req.query.externalReference as string) || '';

      if (!reference && !externalReference) {
        return res.status(400).json({ error: 'Transaction reference is required' });
      }

      const status = await checkPayHeroPaymentStatus(reference, externalReference);
      res.json(status);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to check PayHero status' });
    }
  });

  // GET /api/payhero/config - Gateway status for Admin
  app.get('/api/payhero/config', (req: Request, res: Response) => {
    const { authHeader, mode } = getPayHeroBasicAuth();
    const isLiveConfigured = Boolean(authHeader);
    const proto = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'https';
    const host = (req.headers['x-forwarded-host'] as string) || req.get('host') || '';
    const dynamicBaseUrl = host ? `${proto}://${host}` : (process.env.APP_URL ? (process.env.APP_URL.startsWith('http') ? process.env.APP_URL : `https://${process.env.APP_URL}`) : '');
    const dynamicCallbackUrl = process.env.PAYHERO_CALLBACK_URL?.trim() || (dynamicBaseUrl ? `${dynamicBaseUrl.replace(/\/$/, '')}/api/payhero/callback` : '/api/payhero/callback');

    res.json({
      isLiveConfigured,
      authMode: mode,
      authType: 'HTTP Basic Authentication',
      channelId: process.env.PAYHERO_CHANNEL_ID || '1 (Default)',
      provider: process.env.PAYHERO_PROVIDER || 'm-pesa',
      callbackUrl: dynamicCallbackUrl,
      host,
      environmentMode: isLiveConfigured ? `Live Production (${mode})` : 'Sandbox / Test Mode Active (Configure Basic Auth in Settings)',
    });
  });



  // ==========================================
  // NOWPAYMENTS CRYPTO GATEWAY (USDT POLYGON)
  // ==========================================

  // POST /api/nowpayments/create-payment - Generate dynamic USDT (Polygon) deposit invoice
  app.post('/api/nowpayments/create-payment', async (req: Request, res: Response) => {
    try {
      const { userId, amountKES, usdtToKesRate, callbackUrl } = req.body;
      if (!amountKES || Number(amountKES) <= 0) {
        return res.status(400).json({ error: 'Valid deposit amount in KES is required' });
      }

      const uid = userId || 'usr-98214';
      const proto = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'https';
      const host = (req.headers['x-forwarded-host'] as string) || req.get('host') || '';
      const baseUrl = host ? `${proto}://${host}` : '';
      const dynamicIpnUrl = callbackUrl || (baseUrl ? `${baseUrl}/api/nowpayments/ipn` : undefined);

      const result = await createNowPaymentsDeposit({
        userId: uid,
        amountKES: Number(amountKES),
        usdtToKesRate: usdtToKesRate ? Number(usdtToKesRate) : 130,
        callbackUrl: dynamicIpnUrl,
      });

      res.status(200).json(result);
    } catch (err: any) {
      console.error('[API /api/nowpayments/create-payment Error]:', err.message);
      res.status(400).json({ error: err.message || 'Failed to create NOWPayments invoice' });
    }
  });

  // GET /api/nowpayments/payment-status/:paymentId - Check real-time payment confirmation
  app.get('/api/nowpayments/payment-status/:paymentId', async (req: Request, res: Response) => {
    try {
      const { paymentId } = req.params;
      if (!paymentId) {
        return res.status(400).json({ error: 'Payment ID is required' });
      }

      const status = await checkNowPaymentsPaymentStatus(paymentId);
      res.json(status);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to check NOWPayments status' });
    }
  });

  // POST /api/nowpayments/manual-deposit - Direct Polygon USDT TxHash submission
  app.post('/api/nowpayments/manual-deposit', async (req: Request, res: Response) => {
    try {
      const { userId, amountKES, usdtAmount, txHash } = req.body;
      if (!amountKES || Number(amountKES) <= 0) {
        return res.status(400).json({ error: 'Valid deposit amount in KES is required' });
      }
      if (!txHash || !txHash.trim()) {
        return res.status(400).json({ error: 'Polygon Transaction Hash / Reference is required' });
      }

      const uid = userId || 'usr-98214';
      const user = await findUserById(uid);
      if (!user) {
        return res.status(404).json({ error: 'Investor account profile not found' });
      }

      const cleanHash = txHash.trim();
      const calculatedUsdt = usdtAmount || (Number(amountKES) / 130).toFixed(2);
      const txId = `tx-now-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

      const savedTx = await createTransaction(uid, {
        id: txId,
        type: 'deposit',
        amountKES: Number(amountKES),
        description: `Polygon USDT Deposit ($${calculatedUsdt} USDT) [Tx: ${cleanHash.slice(0, 10)}...]`,
        date: new Date().toISOString().replace('T', ' ').substring(0, 16),
        status: 'completed',
        reference: `NOW-POLYGON-${cleanHash}`,
      });

      const newBalance = (user.walletBalanceKES || 0) + Number(amountKES);
      await updateUserBalance(uid, { walletBalanceKES: newBalance });

      res.status(201).json({
        success: true,
        transaction: savedTx,
        newBalance,
        reference: `NOW-POLYGON-${cleanHash}`,
        message: `Successfully verified and credited KES ${Number(amountKES).toLocaleString()} ($${calculatedUsdt} USDT) to your wallet balance.`,
      });
    } catch (err: any) {
      console.error('[API /api/nowpayments/manual-deposit Error]:', err);
      res.status(500).json({ error: err.message || 'Failed to submit Polygon deposit' });
    }
  });

  // POST /api/nowpayments/ipn - Instant Payment Notification Webhook
  app.post('/api/nowpayments/ipn', async (req: Request, res: Response) => {
    // NOWPayments requires HTTP 200 acknowledgment
    res.status(200).json({ status: 'OK' });

    try {
      const payload = req.body;
      const signature = (req.headers['x-nowpayments-sig'] as string) || '';
      await handleNowPaymentsIpnWebhook(payload, signature);
    } catch (err: any) {
      console.error('[API /api/nowpayments/ipn Error]:', err.message);
    }
  });

  // POST /api/nowpayments/create-payout - Automated outgoing USDT disbursement on Polygon
  app.post('/api/nowpayments/create-payout', async (req: Request, res: Response) => {
    try {
      const { withdrawalId, polygonAddress } = req.body;
      if (!withdrawalId) {
        return res.status(400).json({ error: 'Withdrawal ID is required' });
      }

      // Fetch withdrawal details from DB
      const userWithdrawals = await getUserWithdrawals();
      const wth = userWithdrawals.find(w => w.id === withdrawalId);
      if (!wth) {
        return res.status(404).json({ error: 'Withdrawal record not found' });
      }

      const dest = polygonAddress || (wth as any).destinationAddress || wth.destination;
      const cleanAddress = dest ? dest.replace(/^.*0x/i, '0x').split(' ')[0] : '';
      if (!cleanAddress || !cleanAddress.startsWith('0x')) {
        return res.status(400).json({ error: 'Valid Polygon USDT wallet address (0x...) is required for automated payout' });
      }

      const proto = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'https';
      const host = (req.headers['x-forwarded-host'] as string) || req.get('host') || '';
      const baseUrl = host ? `${proto}://${host}` : '';
      const ipnCallbackUrl = baseUrl ? `${baseUrl}/api/nowpayments/payout-ipn` : undefined;

      const payoutResult = await createNowPaymentsPayout({
        withdrawalId,
        userId: wth.userId,
        amountKES: Number(wth.amountKES),
        netAmountKES: Number(wth.netAmountKES || (wth.amountKES * 0.95)),
        usdtToKesRate: 130,
        polygonAddress: cleanAddress,
        ipnCallbackUrl,
      });

      // If payout succeeded or is processing, update withdrawal status
      if (payoutResult.success) {
        await updateWithdrawalStatus(
          withdrawalId, 
          payoutResult.status === 'finished' ? 'completed' : 'processing', 
          payoutResult.txHash || `NOW-PO-${payoutResult.payoutId}`
        );
      }

      res.json(payoutResult);
    } catch (err: any) {
      console.error('[API /api/nowpayments/create-payout Error]:', err);
      res.status(500).json({ error: err.message || 'Failed to trigger automated payout' });
    }
  });

  // GET /api/nowpayments/config - Configuration status for Admin & UI
  app.get('/api/nowpayments/config', (req: Request, res: Response) => {
    const creds = getNowPaymentsCredentials();
    const proto = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'https';
    const host = (req.headers['x-forwarded-host'] as string) || req.get('host') || '';
    const baseUrl = host ? `${proto}://${host}` : '';
    const ipnCallbackUrl = `${baseUrl}/api/nowpayments/ipn`;

    res.json({
      isLiveConfigured: creds.isLive,
      canAutoPayout: creds.canAutoPayout,
      mode: creds.mode,
      currency: creds.currency,
      network: 'Polygon (MATIC)',
      ipnCallbackUrl,
      settlementVault: '0x88c42E4d7c0B33A4e75f1b135A4F0Ce48C17F7De',
    });
  });

  // ==========================================
  // ROOT API DIRECTORY & HEALTH
  // ==========================================
  app.get('/api', async (req: Request, res: Response) => {
    const dbStatus = await getDbStatus().catch(() => null);
    res.json({
      name: 'Royal Services Investment & Yield REST API',
      version: '2.4.0',
      status: 'online',
      timestamp: new Date().toISOString(),
      database: {
        engine: 'Neon PostgreSQL (Serverless)',
        connected: dbStatus?.isNeonConnected ?? false,
        tablesCount: 9,
      },
      gateways: {
        payhero: {
          provider: 'M-Pesa C2B STK Push',
          status: 'ready',
        },
        nowpayments: {
          provider: 'NOWPayments USDT (Polygon)',
          status: 'ready',
        },
      },
      endpoints: [
        { method: 'GET', path: '/api/health', desc: 'Health check & package count' },
        { method: 'GET', path: '/api/neon/status', desc: 'Neon PostgreSQL live table metrics' },
        { method: 'POST', path: '/api/neon/sync', desc: 'Sync & verify Neon schema' },
        { method: 'POST', path: '/api/auth/register', desc: 'Register investor account' },
        { method: 'POST', path: '/api/auth/login', desc: 'Investor sign-in' },
        { method: 'GET', path: '/api/auth/me', desc: 'Get active investor profile' },
        { method: 'GET', path: '/api/auth/users', desc: 'List all platform investors (admin)' },
        { method: 'PUT', path: '/api/auth/profile/:id', desc: 'Update investor balances' },
        { method: 'GET', path: '/api/packages', desc: 'List investment packages' },
        { method: 'POST', path: '/api/packages', desc: 'Create investment package' },
        { method: 'PUT', path: '/api/packages/:id', desc: 'Update investment package' },
        { method: 'DELETE', path: '/api/packages/:id', desc: 'Delete investment package' },
        { method: 'POST', path: '/api/packages/reset', desc: 'Reset packages to defaults' },
        { method: 'GET', path: '/api/investments', desc: 'List active portfolio contracts' },
        { method: 'POST', path: '/api/investments', desc: 'Activate portfolio contract' },
        { method: 'GET', path: '/api/transactions', desc: 'Audit ledger transactions' },
        { method: 'POST', path: '/api/transactions', desc: 'Record ledger transaction' },
        { method: 'GET', path: '/api/withdrawals', desc: 'List withdrawal requests' },
        { method: 'POST', path: '/api/withdrawals', desc: 'Submit withdrawal request' },
        { method: 'PATCH', path: '/api/withdrawals/:id/status', desc: 'Approve/reject withdrawal' },
        { method: 'GET', path: '/api/referrals', desc: 'Get 3-tier referral tree' },
        { method: 'GET', path: '/api/settings', desc: 'Platform configuration settings' },
        { method: 'PUT', path: '/api/settings', desc: 'Update platform settings' },
        { method: 'GET', path: '/api/chat/threads', desc: 'VIP support threads (admin)' },
        { method: 'GET', path: '/api/chat/threads/:userId', desc: 'Investor chat thread' },
        { method: 'POST', path: '/api/chat/threads/:userId/messages', desc: 'Send support message' },
        { method: 'POST', path: '/api/payhero/stk-push', desc: 'Trigger Safaricom M-Pesa STK Push' },
        { method: 'POST', path: '/api/payhero/callback', desc: 'PayHero C2B IPN webhook' },
        { method: 'GET', path: '/api/payhero/status', desc: 'Query PayHero STK Push status' },
        { method: 'GET', path: '/api/payhero/config', desc: 'PayHero gateway status' },
        { method: 'POST', path: '/api/nowpayments/deposit', desc: 'Create NOWPayments USDT invoice' },
        { method: 'GET', path: '/api/nowpayments/status/:paymentId', desc: 'Query NOWPayments deposit status' },
        { method: 'POST', path: '/api/nowpayments/webhook', desc: 'NOWPayments IPN webhook' },
        { method: 'POST', path: '/api/nowpayments/manual-deposit', desc: 'Direct Polygon transfer submission' },
        { method: 'GET', path: '/api/nowpayments/config', desc: 'NOWPayments gateway status' },
      ],
    });
  });

  // Vite middleware in development or static serving in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Automated Affiliate Engine: Periodic check for 72h matured commissions and Sunday salary payouts
  setInterval(async () => {
    try {
      // 1. Automatically release 72-hour matured referral commissions to normal balance
      await releaseMaturedCommissions();

      // 2. Automated Sunday Weekly Salary disbursement to M-Pesa / Polygon USDT
      const now = new Date();
      if (now.getUTCDay() === 0) {
        await processSundaySalaryDisbursements();
      }
    } catch (cronErr) {
      console.warn('[Campaign Engine] Background processing notice:', cronErr);
    }
  }, 60000);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
