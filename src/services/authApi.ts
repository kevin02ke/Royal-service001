import { UserProfile } from '../types';

export interface NeonStatusResponse {
  connected: boolean;
  database?: string;
  status?: string;
  projectId?: string;
  counts?: {
    users?: number;
    packages?: number;
    investments?: number;
    transactions?: number;
    withdrawals?: number;
    referrals?: number;
    chat_threads?: number;
    antifraud_events?: number;
  };
}

export const authApi = {
  getNeonStatus: async (): Promise<NeonStatusResponse> => {
    const res = await fetch('/api/neon/status');
    if (!res.ok) throw new Error('Failed to fetch Neon status');
    const data = await res.json();
    return {
      connected: data.connected,
      database: data.database,
      status: data.status,
      projectId: data.database,
      counts: data.tables || {},
    };
  },

  login: async (creds: { identifier: string; password: string }): Promise<{ success: boolean; user: UserProfile }> => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(creds),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to login');
    }
    return res.json();
  },

  register: async (params: {
    name: string;
    email: string;
    phone: string;
    password: string;
    referredByCode?: string;
  }): Promise<{ success: boolean; user: UserProfile }> => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to register');
    }
    return res.json();
  },

  getAllUsers: async (): Promise<UserProfile[]> => {
    const res = await fetch('/api/users');
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
  },
};
