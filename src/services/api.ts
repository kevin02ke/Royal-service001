import { 
  InvestmentPackage, 
  PlatformSettings, 
  ActiveInvestment, 
  Transaction, 
  WithdrawalRequest, 
  ReferralMember, 
  UserProfile 
} from '../types';

export interface NeonDbStatus {
  connected: boolean;
  database?: string;
  status?: string;
  error?: string;
  fallbackMode?: boolean;
  projectId?: string;
  isNeonConnected?: boolean;
  counts: {
    users: number;
    packages: number;
    investments: number;
    transactions: number;
    withdrawals: number;
    referrals: number;
    chatThreads?: number;
    chatMessages?: number;
    chat_threads?: number;
    antifraud_events?: number;
  };
}

export const neonApi = {
  getStatus: async (): Promise<NeonDbStatus> => {
    const res = await fetch('/api/neon/status');
    if (!res.ok) throw new Error('Failed to fetch Neon DB status');
    const data = await res.json();
    const chatCount = data.tables?.chat_threads ?? 0;
    return {
      connected: Boolean(data.connected),
      isNeonConnected: Boolean(data.connected),
      database: data.database || 'ep-little-hall-b5o6vcsm',
      projectId: data.database || 'ep-little-hall-b5o6vcsm',
      status: data.status || 'healthy',
      counts: {
        users: data.tables?.users ?? 0,
        packages: data.tables?.packages ?? 0,
        investments: data.tables?.investments ?? 0,
        transactions: data.tables?.transactions ?? 0,
        withdrawals: data.tables?.withdrawals ?? 0,
        referrals: data.tables?.referrals ?? 0,
        chatThreads: chatCount,
        chatMessages: chatCount * 2,
        chat_threads: chatCount,
        antifraud_events: data.tables?.antifraud_events ?? 0,
      }
    };
  },
  sync: async (): Promise<{ success: boolean; status: NeonDbStatus }> => {
    const res = await fetch('/api/neon/sync', { method: 'POST' });
    if (!res.ok) throw new Error('Failed to sync Neon DB schema');
    const status = await neonApi.getStatus();
    return { success: true, status };
  },
};

export const packagesApi = {
  getAll: async (): Promise<InvestmentPackage[]> => {
    const res = await fetch('/api/packages');
    if (!res.ok) throw new Error('Failed to fetch packages');
    return res.json();
  },
  create: async (pkg: InvestmentPackage): Promise<InvestmentPackage> => {
    const res = await fetch('/api/packages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pkg),
    });
    if (!res.ok) throw new Error('Failed to create package');
    return res.json();
  },
  update: async (idOrPkg: string | InvestmentPackage, maybePkg?: InvestmentPackage): Promise<InvestmentPackage> => {
    const pkg = maybePkg || (idOrPkg as InvestmentPackage);
    const id = typeof idOrPkg === 'string' ? idOrPkg : pkg.id;
    const res = await fetch(`/api/packages/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pkg),
    });
    if (!res.ok) throw new Error('Failed to update package');
    return res.json();
  },
  delete: async (id: string): Promise<boolean> => {
    const res = await fetch(`/api/packages/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete package');
    return true;
  },
  reset: async (): Promise<InvestmentPackage[]> => {
    const res = await fetch('/api/packages/reset', { method: 'POST' });
    if (!res.ok) throw new Error('Failed to reset packages');
    return res.json();
  },
};

export const investmentsApi = {
  getAll: async (userId?: string): Promise<ActiveInvestment[]> => {
    const url = userId ? `/api/investments?userId=${userId}` : '/api/investments';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch investments');
    return res.json();
  },
  getUserInvestments: async (userId: string): Promise<ActiveInvestment[]> => {
    return investmentsApi.getAll(userId);
  },
  create: async (userId: string, investment: ActiveInvestment, userUpdates?: Partial<UserProfile>): Promise<ActiveInvestment> => {
    const res = await fetch('/api/investments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, investment, userUpdates }),
    });
    if (!res.ok) throw new Error('Failed to activate investment');
    const data = await res.json();
    return data.investment || data;
  },
  activate: async (params: {
    userId: string;
    investment: ActiveInvestment;
    transaction?: Transaction;
    userUpdates?: Partial<UserProfile>;
  }): Promise<ActiveInvestment> => {
    return investmentsApi.create(params.userId, params.investment, params.userUpdates);
  },
};

export const transactionsApi = {
  getAll: async (userId?: string): Promise<Transaction[]> => {
    const url = userId ? `/api/transactions?userId=${userId}` : '/api/transactions';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch transactions');
    return res.json();
  },
  getUserTransactions: async (userId: string): Promise<Transaction[]> => {
    return transactionsApi.getAll(userId);
  },
  create: async (userId: string, transaction: Transaction, userUpdates?: Partial<UserProfile>): Promise<Transaction> => {
    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, transaction, userUpdates }),
    });
    if (!res.ok) throw new Error('Failed to record transaction');
    const data = await res.json();
    return data.transaction || data;
  },
  record: async (params: { userId: string; transaction: Transaction; userUpdates?: Partial<UserProfile> }): Promise<Transaction> => {
    return transactionsApi.create(params.userId, params.transaction, params.userUpdates);
  },
};

export const withdrawalsApi = {
  getAll: async (userId?: string): Promise<WithdrawalRequest[]> => {
    const url = userId ? `/api/withdrawals?userId=${userId}` : '/api/withdrawals';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch withdrawals');
    return res.json();
  },
  create: async (params: {
    withdrawal: WithdrawalRequest;
    transaction?: Transaction;
    userUpdates?: Partial<UserProfile>;
  }): Promise<{ success: boolean; withdrawal: WithdrawalRequest }> => {
    return withdrawalsApi.request(params.withdrawal, params.transaction);
  },
  request: async (withdrawal: WithdrawalRequest, transaction?: Transaction): Promise<{ success: boolean; withdrawal: WithdrawalRequest }> => {
    const res = await fetch('/api/withdrawals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ withdrawal, transaction }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to submit withdrawal');
    }
    return res.json();
  },
  updateStatus: async (
    id: string, 
    status: 'approved' | 'rejected' | 'processing' | 'completed', 
    txHashOrDetails?: string | { txHash?: string; rejectionReason?: string },
    rejectionReason?: string
  ): Promise<void> => {
    let body: any = { status };
    if (typeof txHashOrDetails === 'string') {
      body.txHash = txHashOrDetails;
    } else if (txHashOrDetails && typeof txHashOrDetails === 'object') {
      body = { ...body, ...txHashOrDetails };
    }
    if (rejectionReason) {
      body.rejectionReason = rejectionReason;
    }

    const res = await fetch(`/api/withdrawals/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error('Failed to update withdrawal status');
  },
};

export const referralsApi = {
  getAll: async (userId?: string): Promise<ReferralMember[]> => {
    const url = userId ? `/api/referrals?userId=${userId}` : '/api/referrals';
    const res = await fetch(url);
    if (!res.ok) return [];
    return res.json();
  },
  getUserReferrals: async (userId: string): Promise<ReferralMember[]> => {
    return referralsApi.getAll(userId);
  },
  getCampaignOverview: async (userId: string): Promise<any> => {
    const res = await fetch(`/api/referrals/campaign?userId=${userId}`);
    if (!res.ok) throw new Error('Failed to fetch campaign overview');
    return res.json();
  },
  saveSalaryConfig: async (params: { 
    userId: string; 
    method: 'mpesa' | 'crypto'; 
    destination: string; 
    accountName?: string 
  }): Promise<any> => {
    const res = await fetch('/api/referrals/salary-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to save salary configuration');
    }
    return res.json();
  },
  recordReminder: async (memberId: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/referrals/remind', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId }),
      });
      return res.ok;
    } catch {
      return false;
    }
  },
  processMaturedCommissions: async (): Promise<any> => {
    const res = await fetch('/api/referrals/process-matured', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error('Failed to release matured commissions');
    return res.json();
  },
  processSundaySalaries: async (force = false): Promise<any> => {
    const res = await fetch('/api/referrals/process-sunday-salaries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ force }),
    });
    if (!res.ok) throw new Error('Failed to run Sunday salary disbursements');
    return res.json();
  },
  getPendingCommissions: async (userId?: string): Promise<any[]> => {
    const url = userId ? `/api/referrals/pending-commissions?userId=${userId}` : '/api/referrals/pending-commissions';
    const res = await fetch(url);
    if (!res.ok) return [];
    return res.json();
  },
  getWeeklySalaryPayouts: async (userId?: string): Promise<any[]> => {
    const url = userId ? `/api/referrals/salary-payouts?userId=${userId}` : '/api/referrals/salary-payouts';
    const res = await fetch(url);
    if (!res.ok) return [];
    return res.json();
  },
};

export const settingsApi = {
  get: async (): Promise<PlatformSettings> => {
    const res = await fetch('/api/settings');
    if (!res.ok) throw new Error('Failed to fetch platform settings');
    return res.json();
  },
  update: async (settings: Partial<PlatformSettings>): Promise<PlatformSettings> => {
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    if (!res.ok) throw new Error('Failed to update platform settings');
    const data = await res.json();
    return data.settings || data;
  },
};
