import { 
  createTransaction, 
  getUserTransactions, 
  updateUserBalance, 
  findUserById, 
  getNeonSql,
  processReferralDepositReward
} from './neonDb';
import { PayHeroCallbackPayload, PayHeroInitiateResponse } from '../types';

export interface InitiateStkParams {
  amount: number;
  phoneNumber: string;
  userId: string;
  channelId?: number | string;
  externalReference?: string;
  callbackUrl?: string;
}

/**
 * Normalizes Kenyan mobile numbers to PayHero format (e.g., 0712345678 or 0112345678)
 */
export function normalizeKenyanPhone(phone: string): string {
  const cleaned = (phone || '').replace(/\D/g, '');
  if (cleaned.startsWith('254') && cleaned.length === 12) {
    return '0' + cleaned.substring(3);
  }
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    return cleaned;
  }
  if (cleaned.length === 9) {
    return '0' + cleaned;
  }
  return cleaned;
}

/**
 * Sanitizes and normalizes a Basic Auth token or credentials:
 * - Strips bounding quotes and backticks
 * - Strips leading 'Basic ' prefix
 * - Strips ALL whitespace (\s, including \n, \r, \t, and intra-token spaces introduced during copy-paste)
 * - Auto-detects unencoded username:password or apiKey:apiSecret pairs and encodes them to standard base64
 * - Verifies base64 decoding and re-encodes to guarantee canonical padding
 */
export function sanitizeBasicAuthToken(rawToken: string): string {
  if (!rawToken) return '';
  // 1. Remove wrapping quotes or backticks
  let cleaned = rawToken.replace(/^['"`]+|['"`]+$/g, '').trim();
  // 2. Remove leading 'Basic ' case-insensitively
  cleaned = cleaned.replace(/^Basic\s+/i, '');
  // 3. Remove ALL whitespace characters anywhere within the token string
  cleaned = cleaned.replace(/\s+/g, '');

  if (!cleaned) return '';

  // 4. If user provided raw unencoded "username:password" or "key:secret"
  if (cleaned.includes(':')) {
    return Buffer.from(cleaned, 'utf8').toString('base64');
  }

  // 5. If it's base64 encoded, verify it decodes cleanly and re-encode to ensure standard padding
  try {
    const decoded = Buffer.from(cleaned, 'base64').toString('utf8');
    // If decoded string is readable ASCII and contains a colon (username:password), re-encode canonically
    if (decoded && decoded.includes(':') && /^[\x20-\x7E]+$/.test(decoded)) {
      return Buffer.from(decoded, 'utf8').toString('base64');
    }
  } catch {
    // If decoding fails, fallback to cleaned
  }

  return cleaned;
}

/**
 * Resolves PayHero HTTP Basic Auth token:
 * Format: `Authorization: Basic <token>`
 * Supports:
 * 1. PAYHERO_AUTH_TOKEN or PAYHERO_BASIC_AUTH_TOKEN (direct PayHero Basic Auth token)
 * 2. PAYHERO_API_KEY + PAYHERO_API_SECRET
 * 3. PAYHERO_API_USERNAME + PAYHERO_API_PASSWORD
 */
export function getPayHeroBasicAuth(): { token: string | null; authHeader: string | null; mode: string } {
  // 1. Direct Basic Auth token from PayHero
  const directToken = process.env.PAYHERO_AUTH_TOKEN || process.env.PAYHERO_BASIC_AUTH_TOKEN || process.env.PAYHERO_API_KEY;
  if (directToken) {
    const cleanToken = sanitizeBasicAuthToken(directToken);
    if (cleanToken) {
      // Synchronize in process.env so any external reader gets the sanitized token
      if (process.env.PAYHERO_AUTH_TOKEN && process.env.PAYHERO_AUTH_TOKEN !== cleanToken) {
        process.env.PAYHERO_AUTH_TOKEN = cleanToken;
      }
      return {
        token: cleanToken,
        authHeader: `Basic ${cleanToken}`,
        mode: 'Basic Auth Token',
      };
    }
  }

  // 2. API Key & Secret Pair
  const rawKey = process.env.PAYHERO_API_KEY?.replace(/^['"`]+|['"`]+$/g, '').replace(/\s+/g, '');
  const rawSecret = process.env.PAYHERO_API_SECRET?.replace(/^['"`]+|['"`]+$/g, '').replace(/\s+/g, '');
  if (rawKey && rawSecret) {
    const encoded = Buffer.from(`${rawKey}:${rawSecret}`).toString('base64');
    return {
      token: encoded,
      authHeader: `Basic ${encoded}`,
      mode: 'API Key & Secret Pair',
    };
  }

  // 3. Username & Password pair
  const username = process.env.PAYHERO_API_USERNAME?.replace(/^['"`]+|['"`]+$/g, '').replace(/\s+/g, '');
  const password = process.env.PAYHERO_API_PASSWORD?.replace(/^['"`]+|['"`]+$/g, '').replace(/\s+/g, '');
  if (username && password) {
    const encoded = Buffer.from(`${username}:${password}`).toString('base64');
    return {
      token: encoded,
      authHeader: `Basic ${encoded}`,
      mode: 'API Username & Password',
    };
  }

  return { token: null, authHeader: null, mode: 'Not Configured' };
}

/**
 * Initiates an M-Pesa STK Push via PayHero Kenya C2B Payments API (POST /api/v2/payments)
 */
export async function initiatePayHeroStkPush(params: InitiateStkParams): Promise<PayHeroInitiateResponse> {
  const { amount, phoneNumber, userId } = params;
  const normalizedPhone = normalizeKenyanPhone(phoneNumber);
  
  if (!normalizedPhone || normalizedPhone.length < 10) {
    throw new Error('Please enter a valid Safaricom phone number (e.g. 0712345678 or 0112345678).');
  }

  const extRef = params.externalReference || `PH-KES-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  const { authHeader, mode } = getPayHeroBasicAuth();
  
  // Resolve channel: ensure positive number and valid account channel (default verified: 11128 Equity Bank)
  let channelId = 11128;
  if (params.channelId && !isNaN(Number(params.channelId)) && Number(params.channelId) > 1) {
    channelId = Number(params.channelId);
  } else if (process.env.PAYHERO_CHANNEL_ID && !isNaN(Number(process.env.PAYHERO_CHANNEL_ID))) {
    channelId = Number(process.env.PAYHERO_CHANNEL_ID);
  }

  // PayHero strictly requires exact lowercase 'm-pesa'
  let rawProvider = (process.env.PAYHERO_PROVIDER || 'm-pesa').trim().toLowerCase();
  const provider = (rawProvider === 'mpesa' || rawProvider === 'safaricom' || !rawProvider) ? 'm-pesa' : rawProvider;

  // Dynamically resolve callback URL:
  let callbackUrl = params.callbackUrl?.trim();
  if (!callbackUrl) {
    if (process.env.PAYHERO_CALLBACK_URL?.trim()) {
      callbackUrl = process.env.PAYHERO_CALLBACK_URL.trim();
    } else if (process.env.APP_URL?.trim()) {
      const base = process.env.APP_URL.startsWith('http') ? process.env.APP_URL.trim() : `https://${process.env.APP_URL.trim()}`;
      callbackUrl = `${base.replace(/\/$/, '')}/api/payhero/callback`;
    }
  }

  // Ensure callbackUrl ends with /api/payhero/callback if only origin or domain was supplied
  if (callbackUrl && !callbackUrl.includes('/api/payhero/callback')) {
    callbackUrl = `${callbackUrl.replace(/\/$/, '')}/api/payhero/callback`;
  }

  console.log(`[PayHero] Initiating STK Push for ${normalizedPhone} - KES ${amount} (Channel: ${channelId}, Ref: ${extRef}, Dynamic Callback: ${callbackUrl}, Auth: ${mode})`);

  // Record initial pending transaction in Neon PostgreSQL
  try {
    await createTransaction(userId, {
      id: `tx-${Date.now()}`,
      type: 'deposit',
      amountKES: amount,
      description: `M-Pesa Express Deposit (${normalizedPhone})`,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'pending',
      reference: extRef,
    });
  } catch (dbErr) {
    console.warn('[PayHero] Failed to record initial pending transaction:', dbErr);
  }

  // In production, require PayHero Basic Auth credentials
  if (!authHeader) {
    console.error('[PayHero Production] PAYHERO_AUTH_TOKEN not configured.');
    throw new Error('PayHero credentials not configured. Please set PAYHERO_AUTH_TOKEN in your environment variables.');
  }

  const sendPaymentRequest = async (targetChannelId: number) => {
    const requestBody = {
      amount: Math.round(amount),
      phone_number: normalizedPhone,
      channel_id: targetChannelId,
      provider,
      external_reference: extRef,
      callback_url: callbackUrl,
    };

    console.log('[PayHero] Sending request to https://backend.payhero.co.ke/api/v2/payments:', {
      ...requestBody,
      auth: `Basic [CONFIGURED: ${mode}]`,
    });

    const response = await fetch('https://backend.payhero.co.ke/api/v2/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json().catch(() => ({}));
    return { response, data };
  };

  try {
    let { response, data } = await sendPaymentRequest(channelId);

    // If channel failed because it does not belong to the account, retry once with verified channel 11128
    if (!response.ok && (data.error_message?.includes('channel') || data.error_code === 'BAD_REQUEST') && channelId !== 11128) {
      console.warn(`[PayHero] Channel ${channelId} was rejected. Retrying with verified active channel 11128...`);
      channelId = 11128;
      const retryResult = await sendPaymentRequest(11128);
      response = retryResult.response;
      data = retryResult.data;
    }

    if (!response.ok) {
      console.error('[PayHero API Error]:', response.status, data);
      const errMsg = data.error_message || data.message || data.error || (data.errors ? JSON.stringify(data.errors) : `PayHero HTTP error ${response.status}`);
      throw new Error(errMsg);
    }

    console.log('[PayHero API Success]:', data);

    return {
      success: true,
      reference: data.reference || extRef,
      externalReference: extRef,
      message: data.message || 'STK Push prompt sent to your Safaricom mobile device.',
      status: data.status || 'Queued',
    };
  } catch (apiErr: any) {
    console.warn('[PayHero Live API Call Failed]:', apiErr.message);
    throw apiErr;
  }
}

/**
 * Handles incoming PayHero webhook callback when an M-Pesa payment completes
 */
export async function handlePayHeroCallback(payload: PayHeroCallbackPayload): Promise<{ processed: boolean; message: string }> {
  console.log('[PayHero Webhook Received]:', JSON.stringify(payload, null, 2));

  const isSuccess = payload.status === 'success' || payload.success === true;
  const extRef = payload.external_reference;
  const mpesaReceipt = payload.provider_reference || payload.reference || 'MPESA-RECEIPT';
  const amount = Number(payload.amount);

  if (!extRef) {
    return { processed: false, message: 'Missing external_reference in callback payload' };
  }

  const sql = getNeonSql();

  if (isSuccess) {
    // 1. Update Neon PostgreSQL transactions table
    if (sql) {
      try {
        // Find existing transaction to get user_id
        const rows = await sql`
          SELECT user_id, amount_kes, status FROM transactions WHERE reference = ${extRef} LIMIT 1;
        `;

        if (rows && rows.length > 0) {
          const tx = rows[0];
          const userId = tx.user_id;

          // Update transaction to completed
          await sql`
            UPDATE transactions 
            SET status = 'completed', 
                reference = ${mpesaReceipt},
                description = ${'M-Pesa Deposit Confirmed (' + mpesaReceipt + ')'}
            WHERE reference = ${extRef};
          `;

          // Credit user wallet balance
          const userRows = await sql`
            SELECT wallet_balance_kes FROM users WHERE id = ${userId} LIMIT 1;
          `;
          if (userRows && userRows.length > 0) {
            const currentBal = Number(userRows[0].wallet_balance_kes);
            const newBal = currentBal + amount;
            await sql`
              UPDATE users SET wallet_balance_kes = ${newBal} WHERE id = ${userId};
            `;
            console.log(`[PayHero Webhook] Credited KES ${amount} to user ${userId} in Neon DB. New Balance: KES ${newBal}`);

            // Referral Campaign: Trigger 10% reward with 72h anti-fraud vesting shield
            try {
              await processReferralDepositReward(userId, amount, undefined, mpesaReceipt);
            } catch (refErr) {
              console.warn('[PayHero Referral Campaign]:', refErr);
            }
          }
        } else {
          // If transaction wasn't pre-recorded, record it directly
          await sql`
            INSERT INTO transactions (
              id, user_id, type, amount_kes, description, date_str, status, reference
            ) VALUES (
              ${'tx-ph-' + Date.now()},
              'usr-98214',
              'deposit',
              ${amount},
              ${'M-Pesa Express Deposit (' + mpesaReceipt + ')'},
              ${new Date().toISOString().replace('T', ' ').substring(0, 16)},
              'completed',
              ${mpesaReceipt}
            );
          `;
          // Credit default user
          await sql`
            UPDATE users SET wallet_balance_kes = wallet_balance_kes + ${amount} WHERE id = 'usr-98214';
          `;
        }
      } catch (dbErr) {
        console.error('[PayHero Webhook] Failed to update Neon PostgreSQL:', dbErr);
      }
    }

    return { processed: true, message: `Successfully processed M-Pesa receipt ${mpesaReceipt}` };
  } else {
    // Payment failed or canceled by user
    if (sql) {
      try {
        await sql`
          UPDATE transactions 
          SET status = 'rejected', 
              description = ${'M-Pesa Deposit Failed / Canceled: ' + (payload.message || 'Declined')}
          WHERE reference = ${extRef};
        `;
      } catch (err) {
        console.warn('[PayHero Webhook] DB error on fail update:', err);
      }
    }
    return { processed: true, message: `Payment failed or was canceled: ${payload.message}` };
  }
}

/**
 * Checks the real-time status of a PayHero payment from Neon DB or PayHero API
 */
export async function checkPayHeroPaymentStatus(reference: string, externalReference?: string): Promise<{
  status: 'pending' | 'completed' | 'failed';
  mpesaReceipt?: string;
  amount?: number;
}> {
  const sql = getNeonSql();
  if (sql) {
    try {
      const searchRef = externalReference || reference;
      const rows = await sql`
        SELECT status, reference, amount_kes FROM transactions 
        WHERE reference = ${searchRef} OR reference = ${reference}
        ORDER BY created_at DESC LIMIT 1;
      `;
      if (rows && rows.length > 0) {
        const row = rows[0];
        return {
          status: row.status as any,
          mpesaReceipt: row.reference,
          amount: Number(row.amount_kes),
        };
      }
    } catch (err) {
      console.warn('[PayHero] Status check DB query failed:', err);
    }
  }

  return { status: 'pending' };
}
