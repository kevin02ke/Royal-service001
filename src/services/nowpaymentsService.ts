import crypto from 'crypto';
import { sql, findUserById, updateUserBalance, createTransaction, processReferralDepositReward } from './neonDb.ts';

export interface NowPaymentsDepositParams {
  userId: string;
  amountKES: number;
  usdtToKesRate?: number;
  callbackUrl?: string;
}

export interface NowPaymentsDepositResponse {
  success: boolean;
  paymentId: string;
  payAddress: string;
  payAmountUSDT: number;
  amountKES: number;
  payCurrency: string;
  network: string;
  paymentStatus: string;
  orderId: string;
  expirationEstimate?: string;
  isLive: boolean;
  message?: string;
}

export interface NowPaymentsPayoutParams {
  withdrawalId: string;
  userId: string;
  amountKES: number;
  netAmountKES: number;
  usdtToKesRate?: number;
  polygonAddress: string;
  ipnCallbackUrl?: string;
}

export interface NowPaymentsPayoutResponse {
  success: boolean;
  payoutId: string;
  withdrawalId: string;
  amountUSDT: number;
  polygonAddress: string;
  currency: string;
  network: string;
  status: 'waiting' | 'processing' | 'sending' | 'finished' | 'failed' | 'rejected' | 'pending';
  txHash?: string;
  message: string;
  isLive: boolean;
  requires2Fa?: boolean;
}

// In-memory cache for NOWPayments auth JWT token (valid for 5 mins)
let cachedAuthToken: { token: string; expiresAt: number } | null = null;

/**
 * Resolves NOWPayments credentials and environment configuration
 */
export function getNowPaymentsCredentials() {
  const apiKey = (process.env.NOWPAYMENTS_API_KEY || '').replace(/^['"`]+|['"`]+$/g, '').replace(/\s+/g, '');
  const ipnSecret = (process.env.NOWPAYMENTS_IPN_SECRET || '').replace(/^['"`]+|['"`]+$/g, '').replace(/\s+/g, '');
  const email = (process.env.NOWPAYMENTS_EMAIL || '').replace(/^['"`]+|['"`]+$/g, '').trim();
  const password = (process.env.NOWPAYMENTS_PASSWORD || '').replace(/^['"`]+|['"`]+$/g, '').trim();

  // Resolve pay_currency: NOWPayments requires crypto tickers (e.g. 'usdtmatic', 'usdttrc20').
  // If user entered fiat (e.g. 'usd', 'eur', 'kes') or generic 'usdt' / 'polygon', map to 'usdtmatic' (USDT on Polygon)
  let rawCurrency = (process.env.NOWPAYMENTS_CURRENCY || 'usdtmatic').replace(/^['"`]+|['"`]+$/g, '').replace(/\s+/g, '').toLowerCase();
  const fiatOrGeneric = new Set(['usd', 'eur', 'gbp', 'kes', 'usdt', 'matic', 'polygon', 'crypto', 'fiat']);
  if (fiatOrGeneric.has(rawCurrency) || !rawCurrency) {
    rawCurrency = 'usdtmatic';
  }

  const currency = rawCurrency;
  const isLive = Boolean(apiKey);
  const canAutoPayout = Boolean(apiKey && email && password);

  return {
    apiKey,
    ipnSecret,
    email,
    password,
    currency,
    isLive,
    canAutoPayout,
    mode: isLive ? 'Live Production' : 'Not Configured (Missing NOWPAYMENTS_API_KEY)',
  };
}

/**
 * Generates an HMAC-SHA512 signature to verify NOWPayments IPN callbacks.
 * Rules per NOWPayments Docs:
 * Sort JSON keys alphabetically, stringify, compute HMAC-SHA512 with IPN Secret.
 */
export function verifyNowPaymentsIpnSignature(
  payload: Record<string, any>,
  receivedSignature: string,
  ipnSecret: string
): boolean {
  if (!receivedSignature || !ipnSecret) return false;

  try {
    const sortedKeys = Object.keys(payload).sort();
    const sortedObj: Record<string, any> = {};
    for (const key of sortedKeys) {
      sortedObj[key] = payload[key];
    }
    const jsonString = JSON.stringify(sortedObj);
    const computedSig = crypto.createHmac('sha512', ipnSecret).update(jsonString).digest('hex');

    return computedSig.toLowerCase() === receivedSignature.toLowerCase();
  } catch (err) {
    console.error('[NOWPayments] Signature verification error:', err);
    return false;
  }
}

/**
 * Authenticates with NOWPayments API to obtain a JWT Bearer token for Payouts
 * (Short-lived, valid for 5 minutes).
 */
export async function getNowPaymentsAuthToken(): Promise<string | null> {
  const { email, password } = getNowPaymentsCredentials();
  if (!email || !password) {
    return null;
  }

  // Return cached token if valid for at least 30 more seconds
  if (cachedAuthToken && cachedAuthToken.expiresAt > Date.now() + 30000) {
    return cachedAuthToken.token;
  }

  try {
    const res = await fetch('https://api.nowpayments.io/v1/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      console.warn('[NOWPayments] Payout auth error:', errData.message || res.statusText);
      return null;
    }

    const data = await res.json();
    if (data.token) {
      // Tokens expire in 5 minutes (300 seconds)
      cachedAuthToken = {
        token: data.token,
        expiresAt: Date.now() + 4.5 * 60 * 1000,
      };
      return data.token;
    }
  } catch (err: any) {
    console.warn('[NOWPayments] Auth exception:', err.message);
  }

  return null;
}

/**
 * Creates an incoming payment/deposit invoice using NOWPayments API
 * Default Currency: USDT on Polygon (ticker: 'usdtmatic')
 */
export async function createNowPaymentsDeposit(
  params: NowPaymentsDepositParams
): Promise<NowPaymentsDepositResponse> {
  const { userId, amountKES, usdtToKesRate = 130, callbackUrl } = params;
  const usdtAmount = Number((amountKES / usdtToKesRate).toFixed(2));
  const orderId = `NOW-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  const { apiKey, currency, isLive } = getNowPaymentsCredentials();

  // Production requirement: require NOWPAYMENTS_API_KEY
  if (!apiKey) {
    console.error('[NOWPayments Production] NOWPAYMENTS_API_KEY not configured in environment secrets.');
    throw new Error('NOWPayments credentials not configured. Please set NOWPAYMENTS_API_KEY in your environment variables (AI Studio Settings -> Secrets).');
  }

  console.log(`[NOWPayments] Initiating Live Deposit for ${userId}: KES ${amountKES} (~$${usdtAmount} USDT on Polygon, currency: ${currency})`);

  // 1. Initial pending transaction in Neon PostgreSQL
  try {
    await createTransaction(userId, {
      id: `tx-now-${Date.now()}`,
      type: 'deposit',
      amountKES,
      description: `NOWPayments USDT (Polygon) Deposit ($${usdtAmount} USDT)`,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'pending',
      reference: orderId,
    });
  } catch (dbErr) {
    console.warn('[NOWPayments] Failed to record initial transaction in DB:', dbErr);
  }

  // 2. Call official NOWPayments API
  try {
    const reqBody: Record<string, any> = {
      price_amount: usdtAmount,
      price_currency: 'usd',
      pay_currency: currency, // 'usdtmatic'
      order_id: orderId,
      order_description: `Deposit KES ${amountKES.toLocaleString()} (~$${usdtAmount} USDT Polygon) for User ${userId}`,
      is_fee_paid_by_user: false,
    };

    if (callbackUrl) {
      reqBody.ipn_callback_url = callbackUrl;
    }

    const response = await fetch('https://api.nowpayments.io/v1/payment', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reqBody),
    });

    const data = await response.json().catch(() => ({}));

    if (response.ok && data.payment_id && data.pay_address) {
      console.log(`[NOWPayments] Live Payment Created: ID ${data.payment_id}, Address: ${data.pay_address}`);
      return {
        success: true,
        paymentId: String(data.payment_id),
        payAddress: data.pay_address,
        payAmountUSDT: Number(data.pay_amount || usdtAmount),
        amountKES,
        payCurrency: (data.pay_currency || currency).toUpperCase(),
        network: 'Polygon (MATIC)',
        paymentStatus: data.payment_status || 'waiting',
        orderId,
        expirationEstimate: '30 Minutes',
        isLive: true,
        message: 'NOWPayments live deposit invoice active. Send exact USDT amount on Polygon network.',
      };
    }

    // Parse exact error from NOWPayments gateway
    const errorMsg = data.message || data.error || (data.status === false ? data.description : null) || `NOWPayments API HTTP ${response.status}: ${response.statusText}`;
    console.error('[NOWPayments API Error]:', errorMsg, data);
    throw new Error(`NOWPayments Gateway Error: ${errorMsg}`);
  } catch (err: any) {
    console.error('[NOWPayments] Live Payment API error:', err.message);
    throw err;
  }
}

/**
 * Checks payment status directly with NOWPayments API
 */
export async function checkNowPaymentsPaymentStatus(paymentId: string): Promise<{
  status: 'pending' | 'completed' | 'failed' | 'waiting' | 'confirming';
  paymentStatus: string;
  payAddress?: string;
  actuallyPaid?: number;
  orderId?: string;
  isConfirmed: boolean;
}> {
  const { apiKey } = getNowPaymentsCredentials();

  if (!apiKey) {
    return {
      status: 'waiting',
      paymentStatus: 'not_configured',
      isConfirmed: false,
    };
  }

  try {
    const response = await fetch(`https://api.nowpayments.io/v1/payment/${paymentId}`, {
      method: 'GET',
      headers: { 'x-api-key': apiKey },
    });

    if (response.ok) {
      const data = await response.json();
      const pStatus = (data.payment_status || '').toLowerCase();
      const isConfirmed = pStatus === 'confirmed' || pStatus === 'finished' || pStatus === 'sending';

      return {
        status: isConfirmed ? 'completed' : (pStatus === 'failed' || pStatus === 'expired' ? 'failed' : 'waiting'),
        paymentStatus: pStatus,
        payAddress: data.pay_address,
        actuallyPaid: Number(data.actually_paid || 0),
        orderId: data.order_id,
        isConfirmed,
      };
    }
  } catch (err: any) {
    console.warn('[NOWPayments] Check status error:', err.message);
  }

  return {
    status: 'waiting',
    paymentStatus: 'waiting',
    isConfirmed: false,
  };
}

/**
 * Handles incoming IPN Webhook callback from NOWPayments
 */
export async function handleNowPaymentsIpnWebhook(
  payload: Record<string, any>,
  receivedSignature?: string
): Promise<{ success: boolean; message: string; orderId?: string }> {
  console.log('[NOWPayments IPN] Received callback:', JSON.stringify(payload));

  const { ipnSecret } = getNowPaymentsCredentials();

  // 1. Verify IPN signature if secret is configured
  if (ipnSecret && receivedSignature) {
    const isValid = verifyNowPaymentsIpnSignature(payload, receivedSignature, ipnSecret);
    if (!isValid) {
      console.warn('[NOWPayments IPN] Invalid HMAC signature rejection!');
      return { success: false, message: 'Invalid IPN HMAC signature' };
    }
  }

  const paymentStatus = (payload.payment_status || '').toLowerCase();
  const orderId = payload.order_id || payload.payment_id;
  const payAmountUSDT = Number(payload.pay_amount || payload.price_amount || 0);

  // 2. Check if payment is successfully completed/finished
  if (paymentStatus === 'finished' || paymentStatus === 'confirmed') {
    console.log(`[NOWPayments IPN] Payment ${orderId} is ${paymentStatus.toUpperCase()}! Processing wallet credit.`);

    try {
      // Find transaction by reference in Neon DB
      const txRows = await sql`
        SELECT * FROM transactions WHERE reference = ${orderId} OR reference LIKE ${`%${orderId}%`} LIMIT 1
      `;

      if (txRows.length > 0) {
        const tx = txRows[0];
        if (tx.status !== 'completed') {
          // Update transaction to completed
          await sql`
            UPDATE transactions 
            SET status = 'completed', 
                description = ${tx.description + ` (Settled via NOWPayments IPN: ${payload.payment_id})`}
            WHERE id = ${tx.id}
          `;

          // Credit user's wallet in Neon DB
          const user = await findUserById(tx.user_id);
          if (user) {
            const newBal = (user.walletBalanceKES || 0) + Number(tx.amount_kes || 0);
            await updateUserBalance(tx.user_id, { walletBalanceKES: newBal });
            console.log(`[NOWPayments IPN] Credited KES ${tx.amount_kes} to user ${user.id} (${user.name}). New Balance: ${newBal}`);

            // Referral Campaign: Trigger 10% reward with 72h anti-fraud vesting shield
            try {
              await processReferralDepositReward(tx.user_id, Number(tx.amount_kes || 0), undefined, payload.payment_id);
            } catch (refErr) {
              console.warn('[NOWPayments Referral Campaign]:', refErr);
            }
          }
        }
      } else {
        console.warn(`[NOWPayments IPN] No pending transaction found matching reference ${orderId}`);
      }
    } catch (dbErr: any) {
      console.error('[NOWPayments IPN] Neon DB settlement error:', dbErr);
    }

    return { success: true, message: `Payment ${orderId} confirmed and ledger settled`, orderId };
  }

  return { success: true, message: `Status ${paymentStatus} acknowledged`, orderId };
}

/**
 * Automated Outgoing Payout via NOWPayments Payouts API
 * Disburses USDT directly to recipient's Polygon wallet address
 */
export async function createNowPaymentsPayout(
  params: NowPaymentsPayoutParams
): Promise<NowPaymentsPayoutResponse> {
  const { withdrawalId, userId, amountKES, netAmountKES, usdtToKesRate = 130, polygonAddress, ipnCallbackUrl } = params;
  const usdtNet = Number((netAmountKES / usdtToKesRate).toFixed(2));

  const { apiKey, currency, isLive, canAutoPayout } = getNowPaymentsCredentials();

  console.log(`[NOWPayments Payout] Initiating payout for withdrawal ${withdrawalId}: $${usdtNet} USDT to ${polygonAddress} on Polygon.`);

  if (!canAutoPayout) {
    return {
      success: false,
      payoutId: '',
      withdrawalId,
      amountUSDT: usdtNet,
      polygonAddress,
      currency: 'USDT',
      network: 'Polygon (MATIC)',
      status: 'failed',
      message: 'Automated USDT payouts require NOWPAYMENTS_API_KEY, NOWPAYMENTS_EMAIL, and NOWPAYMENTS_PASSWORD in environment secrets.',
      isLive: false,
    };
  }

  try {
    const token = await getNowPaymentsAuthToken();
    if (!token) {
      return {
        success: false,
        payoutId: '',
        withdrawalId,
        amountUSDT: usdtNet,
        polygonAddress,
        currency: 'USDT',
        network: 'Polygon (MATIC)',
        status: 'failed',
        message: 'Authentication with NOWPayments API failed. Check NOWPAYMENTS_EMAIL and NOWPAYMENTS_PASSWORD.',
        isLive: true,
      };
    }

    const payload = {
      withdrawals: [
        {
          address: polygonAddress,
          currency, // 'usdtmatic'
          amount: usdtNet,
          ipn_callback_url: ipnCallbackUrl,
          unique_external_id: withdrawalId,
        },
      ],
    };

    const res = await fetch('https://api.nowpayments.io/v1/payout', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));
    console.log('[NOWPayments Payout] API Response:', data);

    if (res.ok && (data.id || (data.withdrawals && data.withdrawals.length > 0))) {
      const payoutObj = data.withdrawals?.[0] || data;
      return {
        success: true,
        payoutId: String(payoutObj.id || data.id),
        withdrawalId,
        amountUSDT: usdtNet,
        polygonAddress,
        currency: 'USDT',
        network: 'Polygon (MATIC)',
        status: payoutObj.status || 'processing',
        txHash: payoutObj.hash || undefined,
        message: 'NOWPayments automated payout broadcasted to Polygon blockchain.',
        isLive: true,
      };
    } else {
      console.warn('[NOWPayments Payout] Payout returned error/notice:', data);
      return {
        success: false,
        payoutId: '',
        withdrawalId,
        amountUSDT: usdtNet,
        polygonAddress,
        currency: 'USDT',
        network: 'Polygon (MATIC)',
        status: 'failed',
        message: data.message || data.error || 'Payout requires 2FA confirmation or whitelisted IP address in NOWPayments Dashboard.',
        isLive: true,
        requires2Fa: Boolean(data.code === '2FA_REQUIRED' || /2fa|whitelist/i.test(data.message || '')),
      };
    }
  } catch (err: any) {
    console.error('[NOWPayments Payout] Automated payout exception:', err.message);
    return {
      success: false,
      payoutId: '',
      withdrawalId,
      amountUSDT: usdtNet,
      polygonAddress,
      currency: 'USDT',
      network: 'Polygon (MATIC)',
      status: 'failed',
      message: `NOWPayments Payout Network Error: ${err.message}`,
      isLive: true,
    };
  }
}
