import { NowPaymentsDepositResponse, NowPaymentsPayoutResponse } from './nowpaymentsService.ts';

export const nowpaymentsApi = {
  /**
   * Initiates a dynamic NOWPayments USDT (Polygon) deposit invoice
   */
  createDeposit: async (params: {
    userId: string;
    amountKES: number;
    usdtToKesRate?: number;
    callbackUrl?: string;
  }): Promise<NowPaymentsDepositResponse> => {
    const res = await fetch('/api/nowpayments/create-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || err.message || 'Failed to create NOWPayments deposit invoice');
    }

    return res.json();
  },

  /**
   * Checks real-time confirmation status of a NOWPayments deposit
   */
  checkPaymentStatus: async (paymentId: string): Promise<{
    status: 'pending' | 'completed' | 'failed' | 'waiting' | 'confirming';
    paymentStatus: string;
    payAddress?: string;
    actuallyPaid?: number;
    isConfirmed: boolean;
  }> => {
    const res = await fetch(`/api/nowpayments/payment-status/${encodeURIComponent(paymentId)}`);
    if (!res.ok) {
      return {
        status: 'waiting',
        paymentStatus: 'waiting',
        isConfirmed: false,
      };
    }
    return res.json();
  },

  /**
   * Submits a manual transaction hash / reference if paid externally
   */
  manualDepositSubmit: async (params: {
    userId: string;
    amountKES: number;
    usdtAmount: number;
    txHash: string;
  }): Promise<{
    success: boolean;
    reference: string;
    newBalance: number;
    message: string;
  }> => {
    const res = await fetch('/api/nowpayments/manual-deposit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || err.message || 'Failed to submit Polygon USDT deposit transaction');
    }

    return res.json();
  },

  /**
   * Automated payout disbursement to user's Polygon USDT wallet
   */
  disbursePayout: async (params: {
    withdrawalId: string;
    polygonAddress?: string;
  }): Promise<NowPaymentsPayoutResponse> => {
    const res = await fetch('/api/nowpayments/create-payout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || err.message || 'Failed to execute automated payout via NOWPayments');
    }

    return res.json();
  },

  /**
   * Fetches gateway configuration status for Admin & user
   */
  getConfig: async (): Promise<{
    isLiveConfigured: boolean;
    canAutoPayout: boolean;
    mode: string;
    currency: string;
    network: string;
    ipnCallbackUrl: string;
  }> => {
    const res = await fetch('/api/nowpayments/config');
    if (!res.ok) throw new Error('Failed to fetch NOWPayments configuration');
    return res.json();
  },
};
