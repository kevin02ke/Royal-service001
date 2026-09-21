import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Terminal, 
  Play, 
  Copy, 
  Check, 
  Server, 
  Database, 
  Zap, 
  ShieldCheck, 
  RefreshCw, 
  ExternalLink,
  Code2,
  Layers,
  ArrowRight,
  Sparkles,
  Smartphone,
  CreditCard,
  MessageSquare,
  Users,
  Clock,
  Settings2,
  Search,
  Filter
} from 'lucide-react';

interface EndpointDef {
  id: string;
  category: 'system' | 'auth' | 'packages' | 'investments' | 'ledger' | 'withdrawals' | 'referrals' | 'settings' | 'chat' | 'payhero' | 'binance';
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  title: string;
  description: string;
  sampleBody?: any;
  queryParams?: Record<string, string>;
}

const ENDPOINTS: EndpointDef[] = [
  // System / Health
  {
    id: 'api-root',
    category: 'system',
    method: 'GET',
    path: '/api',
    title: 'API Service Directory',
    description: 'Returns metadata, active database engine status, and comprehensive endpoint catalog.',
  },
  {
    id: 'api-health',
    category: 'system',
    method: 'GET',
    path: '/api/health',
    title: 'Health Check',
    description: 'System liveness, timestamp, and active investment package counts.',
  },
  {
    id: 'api-neon-status',
    category: 'system',
    method: 'GET',
    path: '/api/neon/status',
    title: 'Neon PostgreSQL Status',
    description: 'Connection status and real-time row counts across all 9 database tables.',
  },
  {
    id: 'api-neon-sync',
    category: 'system',
    method: 'POST',
    path: '/api/neon/sync',
    title: 'Neon Schema Synchronizer',
    description: 'Verifies and bootstraps tables in the connected Neon PostgreSQL database.',
  },

  // Auth & Users
  {
    id: 'auth-users',
    category: 'auth',
    method: 'GET',
    path: '/api/auth/users',
    title: 'List Investors',
    description: 'Fetch all registered investor profiles with balances and referral codes (Admin).',
  },
  {
    id: 'auth-me',
    category: 'auth',
    method: 'GET',
    path: '/api/auth/me?userId=usr-98214',
    title: 'Get User Profile',
    description: 'Fetch current investor account state and wallet balances.',
  },
  {
    id: 'auth-login',
    category: 'auth',
    method: 'POST',
    path: '/api/auth/login',
    title: 'Investor Login',
    description: 'Authenticate an investor account with email/phone and password.',
    sampleBody: {
      identifier: 'vip.investor@royalservice.ke',
      password: 'password123',
    },
  },

  // Packages
  {
    id: 'packages-list',
    category: 'packages',
    method: 'GET',
    path: '/api/packages',
    title: 'Get Investment Packages',
    description: 'Fetch all available investment packages with ROI % and duration terms.',
  },
  {
    id: 'packages-reset',
    category: 'packages',
    method: 'POST',
    path: '/api/packages/reset',
    title: 'Reset Packages to Defaults',
    description: 'Restores the 5 standard investment tiers (Starter, Bronze, Silver, Gold, Platinum).',
  },

  // Investments
  {
    id: 'investments-list',
    category: 'investments',
    method: 'GET',
    path: '/api/investments?userId=usr-98214',
    title: 'List Active Portfolios',
    description: 'Retrieve user active investment contracts, daily yield earned, and maturity dates.',
  },

  // Ledger / Transactions
  {
    id: 'transactions-list',
    category: 'ledger',
    method: 'GET',
    path: '/api/transactions?userId=usr-98214',
    title: 'Audit Ledger Transactions',
    description: 'Immutable ledger of deposits, daily yield credits, referral bonuses, and withdrawals.',
  },

  // Withdrawals
  {
    id: 'withdrawals-list',
    category: 'withdrawals',
    method: 'GET',
    path: '/api/withdrawals',
    title: 'List Payout Requests',
    description: 'View withdrawal queue for M-Pesa and Binance Pay channels.',
  },

  // Referrals
  {
    id: 'referrals-list',
    category: 'referrals',
    method: 'GET',
    path: '/api/referrals?referrerId=usr-98214',
    title: '3-Tier Referral Network',
    description: 'View direct Tier 1 (7%), Tier 2 (3%), and Tier 3 (1%) affiliate network downlines.',
  },

  // Settings
  {
    id: 'settings-get',
    category: 'settings',
    method: 'GET',
    path: '/api/settings',
    title: 'Platform Configuration',
    description: 'Retrieve minimum deposits, withdrawal fees, exchange rates, and limits.',
  },

  // Chat / Support
  {
    id: 'chat-threads',
    category: 'chat',
    method: 'GET',
    path: '/api/chat/threads',
    title: 'VIP Support Threads',
    description: 'List all open investor inquiries and live voice message threads.',
  },

  // PayHero Gateway
  {
    id: 'payhero-config',
    category: 'payhero',
    method: 'GET',
    path: '/api/payhero/config',
    title: 'PayHero Gateway Status',
    description: 'Inspect M-Pesa C2B credentials, channel ID, and dynamic callback webhook URI.',
  },
  {
    id: 'payhero-stk',
    category: 'payhero',
    method: 'POST',
    path: '/api/payhero/stk-push',
    title: 'Initiate M-Pesa STK Push',
    description: 'Triggers instant Safaricom M-Pesa PIN prompt on Kenyan investor phone.',
    sampleBody: {
      amount: 100,
      phoneNumber: '254712345678',
      userId: 'usr-98214',
    },
  },

  // Binance Pay Gateway
  {
    id: 'binance-config',
    category: 'binance',
    method: 'GET',
    path: '/api/binance/config',
    title: 'Binance Pay Gateway Status',
    description: 'Check Binance merchant ID, credentials state, and webhook callback URL.',
  },
  {
    id: 'binance-create-order',
    category: 'binance',
    method: 'POST',
    path: '/api/binance/create-order',
    title: 'Create Binance Pay Order',
    description: 'Generates Binance Pay prepayId, QR code, and crypto checkout link for USDT deposits.',
    sampleBody: {
      amountKES: 1300,
      userId: 'usr-98214',
      usdtToKesRate: 130,
    },
  },
];

export const ApiExplorerView: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeEndpointId, setActiveEndpointId] = useState<string>('api-root');
  const [requestBodyInput, setRequestBodyInput] = useState<string>('');
  
  // Execution state
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseHeaders, setResponseHeaders] = useState<Record<string, string>>({});
  const [responseData, setResponseData] = useState<any>(null);
  const [responseTimeMs, setResponseTimeMs] = useState<number | null>(null);
  const [hasCopied, setHasCopied] = useState<boolean>(false);
  const [copiedCurl, setCopiedCurl] = useState<boolean>(false);

  // Overall system health
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [isPinging, setIsPinging] = useState<boolean>(false);

  const activeEndpoint = ENDPOINTS.find(e => e.id === activeEndpointId) || ENDPOINTS[0];

  // Set default body when switching endpoints
  useEffect(() => {
    if (activeEndpoint.sampleBody) {
      setRequestBodyInput(JSON.stringify(activeEndpoint.sampleBody, null, 2));
    } else {
      setRequestBodyInput('');
    }
  }, [activeEndpointId]);

  // Ping health on mount
  const checkHealth = async () => {
    setIsPinging(true);
    const start = performance.now();
    try {
      const res = await fetch('/api');
      const data = await res.json();
      const end = performance.now();
      setHealthStatus({ ...data, pingMs: Math.round(end - start) });
    } catch (err: any) {
      setHealthStatus({ status: 'offline', error: err.message });
    } finally {
      setIsPinging(false);
    }
  };

  useEffect(() => {
    checkHealth();
    // Auto-execute default endpoint
    handleRunEndpoint(activeEndpoint);
  }, []);

  const handleRunEndpoint = async (ep: EndpointDef) => {
    setIsExecuting(true);
    setResponseStatus(null);
    setResponseData(null);
    const start = performance.now();

    try {
      const options: RequestInit = {
        method: ep.method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      };

      if (ep.method !== 'GET' && requestBodyInput.trim()) {
        options.body = requestBodyInput.trim();
      }

      const res = await fetch(ep.path, options);
      const end = performance.now();
      setResponseTimeMs(Math.round(end - start));
      setResponseStatus(res.status);

      const json = await res.json().catch(() => ({ message: 'No JSON payload in response' }));
      setResponseData(json);
    } catch (err: any) {
      const end = performance.now();
      setResponseTimeMs(Math.round(end - start));
      setResponseStatus(500);
      setResponseData({ error: err.message || 'Request failed' });
    } finally {
      setIsExecuting(false);
    }
  };

  const copyResponse = () => {
    if (!responseData) return;
    navigator.clipboard.writeText(JSON.stringify(responseData, null, 2));
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  const copyCurlCommand = () => {
    const origin = window.location.origin;
    const fullUrl = `${origin}${activeEndpoint.path}`;
    let curl = `curl -X ${activeEndpoint.method} "${fullUrl}"`;
    curl += ` \\\n  -H "Content-Type: application/json"`;
    if (activeEndpoint.method !== 'GET' && requestBodyInput.trim()) {
      curl += ` \\\n  -d '${requestBodyInput.trim()}'`;
    }
    navigator.clipboard.writeText(curl);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  // Filter endpoints
  const filteredEndpoints = ENDPOINTS.filter(ep => {
    const matchesCategory = selectedCategory === 'all' || ep.category === selectedCategory;
    const matchesSearch = ep.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          ep.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          ep.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getMethodBadge = (method: string) => {
    switch (method) {
      case 'GET':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'POST':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'PUT':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'PATCH':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'DELETE':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      default:
        return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-[#0c1222] via-[#090d16] to-[#0d1629] border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/30">
              <Terminal className="w-3.5 h-3.5" />
              <span>Royal Services Core REST API v2.4.0</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
              <span>Interactive API Console & Documentation</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Explore and test live endpoints connecting investment portfolios, ledger audit trails, Neon PostgreSQL serverless pooling, Safaricom M-Pesa (PayHero), and Binance Pay USDT settlements.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={checkHealth}
              disabled={isPinging}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin text-emerald-400' : ''}`} />
              <span>{isPinging ? 'Pinging API...' : 'Ping API Status'}</span>
            </button>
            <a
              href="/api"
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <span>Raw JSON Index</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Live Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5 pt-4 border-t border-slate-800/80">
          <div className="p-2.5 bg-[#0a0f1d] rounded-xl border border-slate-800/60 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400">API Status</div>
              <div className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Online (200 OK)
              </div>
            </div>
          </div>

          <div className="p-2.5 bg-[#0a0f1d] rounded-xl border border-slate-800/60 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400">Database</div>
              <div className="text-xs font-bold text-white">Neon PostgreSQL</div>
            </div>
          </div>

          <div className="p-2.5 bg-[#0a0f1d] rounded-xl border border-slate-800/60 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400">Mobile Gateway</div>
              <div className="text-xs font-bold text-slate-200">PayHero M-Pesa C2B</div>
            </div>
          </div>

          <div className="p-2.5 bg-[#0a0f1d] rounded-xl border border-slate-800/60 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center">
              <Zap className="w-4 h-4 fill-amber-400" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400">Crypto Gateway</div>
              <div className="text-xs font-bold text-amber-300">Binance Pay USDT</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Console Layout: Two columns (Endpoints List + Interactive Test Panel) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Endpoints Directory (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          
          {/* Search and Category Filter Bar */}
          <div className="p-3 bg-[#0a0f1c] border border-slate-800 rounded-2xl space-y-2.5">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search endpoints (/api/packages, payhero...)"
                className="w-full pl-9 pr-3 py-1.5 bg-[#060a12] border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition font-mono"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-1.5 text-[10px]">
              {[
                { id: 'all', label: 'All (18)' },
                { id: 'system', label: 'System' },
                { id: 'auth', label: 'Auth & Users' },
                { id: 'packages', label: 'Packages' },
                { id: 'payhero', label: 'PayHero' },
                { id: 'binance', label: 'Binance Pay' },
                { id: 'ledger', label: 'Ledger' },
                { id: 'withdrawals', label: 'Withdrawals' },
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                      : 'bg-slate-800/40 text-slate-400 hover:text-white hover:bg-slate-800/80 border border-slate-800'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Endpoints List */}
          <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
            {filteredEndpoints.map((ep) => {
              const isSelected = ep.id === activeEndpointId;
              return (
                <motion.div
                  whileHover={{ x: 2 }}
                  key={ep.id}
                  onClick={() => setActiveEndpointId(ep.id)}
                  className={`p-3 rounded-xl border transition cursor-pointer ${
                    isSelected
                      ? 'bg-[#0f172a] border-emerald-500/50 shadow-md ring-1 ring-emerald-500/20'
                      : 'bg-[#0a0f1d]/70 hover:bg-[#0e1526] border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-black border ${getMethodBadge(ep.method)}`}>
                      {ep.method}
                    </span>
                    <span className="text-[11px] font-bold text-white truncate text-right">{ep.title}</span>
                  </div>
                  <div className="font-mono text-xs text-slate-300 truncate font-semibold">
                    {ep.path}
                  </div>
                  <div className="text-[11px] text-slate-400 line-clamp-1 mt-1">
                    {ep.description}
                  </div>
                </motion.div>
              );
            })}

            {filteredEndpoints.length === 0 && (
              <div className="p-8 text-center bg-[#0a0f1c] rounded-xl border border-slate-800 text-xs text-slate-400">
                No matching endpoints found for "{searchQuery}".
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live Endpoint Tester & Inspector (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-[#0a0f1c] border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            
            {/* Active Endpoint Info Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-md text-xs font-mono font-black border ${getMethodBadge(activeEndpoint.method)}`}>
                    {activeEndpoint.method}
                  </span>
                  <span className="text-sm font-bold text-white font-mono">{activeEndpoint.path}</span>
                </div>
                <p className="text-xs text-slate-400">{activeEndpoint.description}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={copyCurlCommand}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  {copiedCurl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCurl ? 'Copied cURL' : 'cURL'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleRunEndpoint(activeEndpoint)}
                  disabled={isExecuting}
                  className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:opacity-50"
                >
                  {isExecuting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-slate-950" />}
                  <span>{isExecuting ? 'Sending...' : 'Send Request'}</span>
                </button>
              </div>
            </div>

            {/* Request Body Editor (For POST, PUT, PATCH) */}
            {activeEndpoint.method !== 'GET' && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300">Request Body (JSON)</span>
                  <span className="text-[11px] text-slate-500 font-mono">application/json</span>
                </div>
                <textarea
                  rows={5}
                  value={requestBodyInput}
                  onChange={(e) => setRequestBodyInput(e.target.value)}
                  className="w-full p-3 bg-[#060a12] border border-slate-800 rounded-xl text-xs font-mono text-emerald-300 focus:outline-none focus:border-emerald-500 transition leading-relaxed"
                  placeholder="{}"
                />
              </div>
            )}

            {/* Response Viewer */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-300">Response Payload</span>
                  {responseStatus !== null && (
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      responseStatus >= 200 && responseStatus < 300
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    }`}>
                      {responseStatus} {responseStatus === 200 ? 'OK' : responseStatus === 201 ? 'Created' : 'Notice'}
                    </span>
                  )}
                  {responseTimeMs !== null && (
                    <span className="text-[11px] font-mono text-slate-400">
                      ⚡ {responseTimeMs} ms
                    </span>
                  )}
                </div>

                {responseData && (
                  <button
                    type="button"
                    onClick={copyResponse}
                    className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition cursor-pointer"
                  >
                    {hasCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{hasCopied ? 'Copied' : 'Copy JSON'}</span>
                  </button>
                )}
              </div>

              {/* JSON Pre block */}
              <div className="p-3.5 bg-[#060a12] rounded-xl border border-slate-800 font-mono text-xs overflow-x-auto max-h-[380px]">
                {isExecuting ? (
                  <div className="py-8 text-center text-slate-400 flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                    <span>Awaiting server response...</span>
                  </div>
                ) : responseData ? (
                  <pre className="text-emerald-400 whitespace-pre-wrap leading-relaxed">
                    {JSON.stringify(responseData, null, 2)}
                  </pre>
                ) : (
                  <div className="py-8 text-center text-slate-500">
                    Click "Send Request" to test this endpoint live.
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Quick Integration Reference Box */}
          <div className="p-4 bg-[#0a0f1c] border border-slate-800 rounded-2xl space-y-2">
            <h4 className="text-xs font-bold text-white flex items-center gap-2">
              <Code2 className="w-4 h-4 text-emerald-400" />
              <span>Developer Integration Quickstart</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px]">
              <div className="p-2.5 bg-[#060a12] rounded-xl border border-slate-800/80">
                <div className="font-bold text-slate-200 mb-0.5">M-Pesa Gateway</div>
                <div className="text-slate-400">Basic Auth credentials configured via Settings panel. STK push triggers in &lt; 2s.</div>
              </div>
              <div className="p-2.5 bg-[#060a12] rounded-xl border border-slate-800/80">
                <div className="font-bold text-slate-200 mb-0.5">Binance Pay</div>
                <div className="text-slate-400">HMAC-SHA512 open api signing with instant blockchain IPN webhook callbacks.</div>
              </div>
              <div className="p-2.5 bg-[#060a12] rounded-xl border border-slate-800/80">
                <div className="font-bold text-slate-200 mb-0.5">Neon PostgreSQL</div>
                <div className="text-slate-400">Serverless connection pooling via Neon driver across 9 structured relation tables.</div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
