import { AntiFraudEvent, AntiFraudMetrics, PlatformSettings, UserProfile } from '../types';

export async function fetchAntiFraudMetrics(): Promise<AntiFraudMetrics> {
  const res = await fetch('/api/antifraud/metrics');
  if (!res.ok) throw new Error('Failed to fetch anti-fraud metrics');
  const data = await res.json();
  return data.metrics;
}

export async function fetchAntiFraudEvents(limit: number = 50): Promise<AntiFraudEvent[]> {
  const res = await fetch(`/api/antifraud/events?limit=${limit}`);
  if (!res.ok) throw new Error('Failed to fetch anti-fraud events');
  const data = await res.json();
  return data.events || [];
}

export async function fetchFlaggedUsers(): Promise<UserProfile[]> {
  const res = await fetch('/api/antifraud/flagged-users');
  if (!res.ok) throw new Error('Failed to fetch flagged users');
  const data = await res.json();
  return data.users || [];
}

export async function freezeAccountApi(userId: string, reason?: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`/api/antifraud/user/${userId}/freeze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  });
  if (!res.ok) throw new Error('Failed to freeze account');
  return res.json();
}

export async function unfreezeAccountApi(userId: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`/api/antifraud/user/${userId}/unfreeze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error('Failed to unfreeze account');
  return res.json();
}

export async function updateAntiFraudSettingsApi(settings: Partial<PlatformSettings>): Promise<{ success: boolean; settings: PlatformSettings }> {
  const res = await fetch('/api/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });
  if (!res.ok) throw new Error('Failed to update platform settings');
  const data = await res.json();
  return {
    success: true,
    settings: data.settings || data,
  };
}

export async function toggleUserKycApi(userId: string, force: boolean, reason?: string): Promise<any> {
  const res = await fetch(`/api/antifraud/user/${userId}/kyc-toggle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ force, reason }),
  });
  if (!res.ok) throw new Error('Failed to toggle KYC');
  return res.json();
}

export async function approveUserKycApi(userId: string, adminNotes?: string): Promise<any> {
  const res = await fetch('/api/kyc/approve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, adminNotes }),
  });
  if (!res.ok) throw new Error('Failed to approve KYC');
  return res.json();
}

export async function rejectUserKycApi(userId: string, reason: string): Promise<any> {
  const res = await fetch('/api/kyc/reject', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, reason }),
  });
  if (!res.ok) throw new Error('Failed to reject KYC');
  return res.json();
}
