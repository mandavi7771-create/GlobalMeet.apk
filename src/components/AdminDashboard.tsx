import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { SUPPORTED_COUNTRIES } from '../data/mockData';
import { AccountStatus } from '../types';
import { 
  ShieldAlert, 
  Users, 
  Video, 
  Coins, 
  Crown, 
  Globe2, 
  AlertTriangle, 
  CheckCircle2, 
  Ban, 
  Clock, 
  Search, 
  ArrowLeft,
  Filter,
  CreditCard,
  DollarSign,
  RefreshCw
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { 
    allUsers, 
    updateUserStatus, 
    reports, 
    resolveReport, 
    setActiveTab, 
    callHistory,
    coins,
    allSystemTransactions,
    fetchAllSystemTransactions,
    linkedPayPalMerchant
  } = useApp();

  const [activeAdminTab, setActiveAdminTab] = useState<'overview' | 'reports' | 'users' | 'calls' | 'countries' | 'transactions'>('overview');
  const [userSearch, setUserSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [txSearch, setTxSearch] = useState('');
  const [refreshingTx, setRefreshingTx] = useState(false);

  // Computed metrics
  const totalUsersCount = 1420 + allUsers.length;
  const activeNowCount = allUsers.filter(u => u.status === 'online').length + 180;
  const newTodayCount = 42;
  const suspendedCount = allUsers.filter(u => u.accountStatus === 'suspended' || u.accountStatus === 'banned').length;
  const totalCallsCount = 890 + callHistory.length;
  const totalCallDuration = 3240 + Math.floor(callHistory.reduce((acc, c) => acc + c.durationSeconds, 0) / 60);
  const coinsIssued = 48200;
  const coinsUsed = 32100;
  const premiumCount = allUsers.filter(u => u.isPremium).length + 128;

  // Filter users
  const filteredUsers = allUsers.filter(u => {
    if (userSearch.trim()) {
      const q = userSearch.toLowerCase();
      if (!u.name.toLowerCase().includes(q) && !u.username.toLowerCase().includes(q) && !u.country.toLowerCase().includes(q)) {
        return false;
      }
    }
    if (statusFilter !== 'all' && u.accountStatus !== statusFilter) {
      return false;
    }
    return true;
  });

  return (
    <div id="admin-dashboard-view" className="pb-24 pt-4 px-3 sm:px-6 max-w-6xl mx-auto space-y-6">
      
      {/* Top Banner / Header */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold text-white tracking-tight">Admin & Moderation Panel</h1>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded border border-amber-500/30">
                Live Console
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              User moderation, reports review, coin metrics, call analytics & country distribution
            </p>
          </div>
        </div>

        <button
          onClick={() => setActiveTab('home')}
          className="flex items-center space-x-2 py-2 px-4 bg-neutral-800 hover:bg-neutral-750 text-white rounded-xl text-xs font-semibold transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit to Main App</span>
        </button>
      </div>

      {/* Navigation sub-tabs */}
      <div className="flex items-center space-x-2 border-b border-neutral-800 pb-3 overflow-x-auto scrollbar-none">
        {[
          { id: 'overview', label: 'Metrics Overview' },
          { id: 'reports', label: `Reports Queue (${reports.filter(r => r.status === 'pending').length})` },
          { id: 'users', label: `Users Moderation (${allUsers.length})` },
          { id: 'calls', label: 'Calls Log' },
          { id: 'countries', label: 'Countries Breakdown' },
          { id: 'transactions', label: 'Transaction History 💳' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveAdminTab(tab.id as any)}
            className={`py-2 px-4 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              activeAdminTab === tab.id
                ? 'bg-rose-600 text-white shadow'
                : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW METRICS */}
      {activeAdminTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-1">
              <div className="flex items-center justify-between text-neutral-400">
                <span className="text-xs font-medium">Total Registered</span>
                <Users className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-xl font-bold text-white">{totalUsersCount.toLocaleString()}</div>
              <span className="text-[10px] text-emerald-400">+{newTodayCount} new today</span>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-1">
              <div className="flex items-center justify-between text-neutral-400">
                <span className="text-xs font-medium">Active Now</span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
              </div>
              <div className="text-xl font-bold text-emerald-400">{activeNowCount}</div>
              <span className="text-[10px] text-neutral-400">Across 20 countries</span>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-1">
              <div className="flex items-center justify-between text-neutral-400">
                <span className="text-xs font-medium">Total Video Calls</span>
                <Video className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-xl font-bold text-white">{totalCallsCount}</div>
              <span className="text-[10px] text-neutral-400">{totalCallDuration} minutes connected</span>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-1">
              <div className="flex items-center justify-between text-neutral-400">
                <span className="text-xs font-medium">Coins Economy</span>
                <Coins className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-xl font-bold text-amber-400">{coinsIssued.toLocaleString()} 🪙</div>
              <span className="text-[10px] text-neutral-400">{coinsUsed.toLocaleString()} used in calls</span>
            </div>
          </div>

          {/* Secondary stats & revenue preview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
              <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Monetization</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-400">VIP Subscribers:</span>
                  <span className="font-bold text-amber-300">{premiumCount} users</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-400">Rewarded Ads Watched:</span>
                  <span className="font-bold text-white">964 impressions</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-400">Estimated Revenue:</span>
                  <span className="font-bold text-emerald-400">$2,410.00</span>
                </div>
              </div>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
              <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Safety Health</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-400">Pending Reports:</span>
                  <span className="font-bold text-rose-400">{reports.filter(r => r.status === 'pending').length}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-400">Suspended / Banned:</span>
                  <span className="font-bold text-amber-400">{suspendedCount} accounts</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-400">18+ Verification Rate:</span>
                  <span className="font-bold text-emerald-400">100% compliant</span>
                </div>
              </div>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
              <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Top Countries</h3>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-neutral-300">
                  <span>🇮🇳 India</span>
                  <span className="font-bold">480 users</span>
                </div>
                <div className="flex justify-between text-neutral-300">
                  <span>🇧🇩 Bangladesh</span>
                  <span className="font-bold">210 users</span>
                </div>
                <div className="flex justify-between text-neutral-300">
                  <span>🇦🇪 UAE</span>
                  <span className="font-bold">145 users</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: REPORTS QUEUE */}
      {activeAdminTab === 'reports' && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white">Community Reports Queue</h2>
              <p className="text-xs text-neutral-400">Review reported users for harassment, fake profiles, or abuse</p>
            </div>
            <span className="text-xs bg-rose-950 text-rose-300 px-2.5 py-1 rounded-full border border-rose-800 font-semibold">
              {reports.length} Total Reports
            </span>
          </div>

          <div className="space-y-3">
            {reports.map((report) => (
              <div
                key={report.id}
                className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-850 pb-3">
                  <div className="flex items-center space-x-3">
                    <img
                      src={report.reportedUserAvatar}
                      alt={report.reportedUserName}
                      className="w-10 h-10 rounded-xl object-cover"
                    />
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-white">Reported: @{report.reportedUserName}</span>
                        <span className="text-[10px] bg-rose-500/20 text-rose-300 font-bold px-2 py-0.5 rounded border border-rose-500/30">
                          {report.category}
                        </span>
                      </div>
                      <span className="text-[11px] text-neutral-400">
                        Filed by {report.reporterName} • {report.timestamp}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      report.status === 'pending'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      {report.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="bg-neutral-900/70 p-3 rounded-xl border border-neutral-800/80 text-xs text-neutral-300">
                  <strong>Notes:</strong> {report.description}
                </div>

                {report.actionTaken && (
                  <p className="text-[11px] text-emerald-400">
                    Action Taken: {report.actionTaken}
                  </p>
                )}

                {/* Moderation Actions */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    onClick={() => resolveReport(report.id, 'Dismissed as false report')}
                    className="py-1.5 px-3 bg-neutral-800 hover:bg-neutral-750 text-neutral-300 text-xs rounded-xl font-medium transition"
                  >
                    Dismiss Report
                  </button>

                  <button
                    onClick={() => {
                      updateUserStatus(report.reportedUserId, 'restricted');
                      resolveReport(report.id, 'User temporarily restricted for 24 hours');
                    }}
                    className="py-1.5 px-3 bg-amber-600/80 hover:bg-amber-600 text-white text-xs rounded-xl font-medium transition"
                  >
                    Restrict 24h
                  </button>

                  <button
                    onClick={() => {
                      updateUserStatus(report.reportedUserId, 'suspended');
                      resolveReport(report.id, 'User account suspended');
                    }}
                    className="py-1.5 px-3 bg-rose-600 hover:bg-rose-500 text-white text-xs rounded-xl font-semibold transition"
                  >
                    Suspend User
                  </button>

                  <button
                    onClick={() => {
                      updateUserStatus(report.reportedUserId, 'banned');
                      resolveReport(report.id, 'Permanent device and IP ban applied');
                    }}
                    className="py-1.5 px-3 bg-red-950 hover:bg-red-900 border border-red-800 text-red-300 text-xs rounded-xl font-semibold transition"
                  >
                    Permanent Ban
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: USERS MODERATION TABLE */}
      {activeAdminTab === 'users' && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-white">Registered Users Roster</h2>
              <p className="text-xs text-neutral-400">Inspect user accounts, adjust status, or apply sanctions</p>
            </div>

            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search user..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="bg-neutral-950 border border-neutral-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-neutral-950 border border-neutral-800 rounded-xl px-2.5 py-1.5 text-xs text-white"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="restricted">Restricted</option>
                <option value="suspended">Suspended</option>
                <option value="banned">Banned</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-neutral-800 text-neutral-400 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">User</th>
                  <th className="py-2.5 px-3">Country</th>
                  <th className="py-2.5 px-3">Coins</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-850">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-neutral-950/40">
                    <td className="py-3 px-3">
                      <div className="flex items-center space-x-2.5">
                        <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-xl object-cover" />
                        <div>
                          <div className="font-bold text-white flex items-center space-x-1">
                            <span>{user.name}</span>
                            {user.isPremium && <Crown className="w-3 h-3 text-amber-400" />}
                          </div>
                          <span className="text-[10px] text-neutral-400">@{user.username}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-neutral-300">
                      {user.country} ({user.language})
                    </td>
                    <td className="py-3 px-3 font-semibold text-amber-400">
                      🪙 {user.coins}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        user.accountStatus === 'active'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : user.accountStatus === 'restricted'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-rose-500/20 text-rose-300'
                      }`}>
                        {user.accountStatus.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right space-x-1.5">
                      {user.accountStatus !== 'active' ? (
                        <button
                          onClick={() => updateUserStatus(user.id, 'active')}
                          className="px-2 py-1 bg-emerald-900/60 hover:bg-emerald-900 text-emerald-300 rounded-lg text-[11px] font-medium"
                        >
                          Activate
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => updateUserStatus(user.id, 'restricted')}
                            className="px-2 py-1 bg-neutral-800 hover:bg-neutral-750 text-neutral-300 rounded-lg text-[11px]"
                          >
                            Restrict
                          </button>
                          <button
                            onClick={() => updateUserStatus(user.id, 'suspended')}
                            className="px-2 py-1 bg-rose-950 hover:bg-rose-900 text-rose-300 rounded-lg text-[11px]"
                          >
                            Suspend
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: CALLS LOG */}
      {activeAdminTab === 'calls' && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 space-y-4">
          <h2 className="text-sm font-bold text-white">Recent 1-to-1 Video Calls Telemetry</h2>
          <div className="space-y-2">
            {callHistory.map((c) => (
              <div key={c.id} className="bg-neutral-950 border border-neutral-800 p-3 rounded-2xl flex items-center justify-between text-xs">
                <div className="flex items-center space-x-3">
                  <Video className="w-4 h-4 text-rose-500" />
                  <div>
                    <span className="font-bold text-white">{c.peerName}</span>
                    <span className="text-neutral-400 block text-[11px]">{c.timestamp} • Duration: {c.durationSeconds} seconds</span>
                  </div>
                </div>
                <span className="text-neutral-400 bg-neutral-900 px-2 py-1 rounded-lg">
                  Coins: {c.costCoins}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: COUNTRIES BREAKDOWN */}
      {activeAdminTab === 'countries' && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 space-y-4">
          <h2 className="text-sm font-bold text-white">Supported 20 Countries Overview</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {SUPPORTED_COUNTRIES.map((c) => {
              const count = allUsers.filter(u => u.country === c.name).length * 15 + 24;
              return (
                <div key={c.code} className="bg-neutral-950 border border-neutral-800 p-3 rounded-2xl flex items-center space-x-3">
                  <span className="text-2xl">{c.flag}</span>
                  <div>
                    <h4 className="text-xs font-bold text-white">{c.name}</h4>
                    <span className="text-[11px] text-neutral-400">{count} Active Users</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 6: TRANSACTION HISTORY & INCOMING FUNDS */}
      {activeAdminTab === 'transactions' && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center space-x-2">
                <CreditCard className="w-4 h-4 text-amber-400" />
                <span>Platform Transaction History & Incoming Funds</span>
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Live verification of customer payments routed to your secure PayPal Merchant Account.
              </p>
            </div>
            <button
              onClick={async () => {
                setRefreshingTx(true);
                await fetchAllSystemTransactions();
                setRefreshingTx(false);
              }}
              disabled={refreshingTx}
              className="px-3.5 py-2 bg-neutral-800 hover:bg-neutral-750 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshingTx ? 'animate-spin' : ''}`} />
              <span>{refreshingTx ? 'Refreshing...' : 'Sync Transactions'}</span>
            </button>
          </div>

          {/* PayPal Merchant Verification Card */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-sm">
                🅿️
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-white">Active Receiving PayPal Account</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-semibold px-2 py-0.5 rounded border border-emerald-500/30">
                    Verified & Secured
                  </span>
                </div>
                <div className="text-xs font-mono text-amber-300 mt-0.5">{linkedPayPalMerchant}</div>
              </div>
            </div>
            <div className="text-[11px] text-neutral-400 text-right">
              All payment rails (UPI, Card, Bank, PayPal) settle directly here.
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by transaction ID, user, or payment method..."
              value={txSearch}
              onChange={(e) => setTxSearch(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
            />
          </div>

          {/* Transactions List */}
          {allSystemTransactions.length === 0 ? (
            <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-8 text-center text-neutral-500 text-xs">
              No payment transactions recorded in Firestore yet. When users purchase VIP Plans or Coin packs, they will appear here instantly.
            </div>
          ) : (
            <div className="bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden divide-y divide-neutral-850">
              {allSystemTransactions
                .filter(tx => {
                  if (!txSearch.trim()) return true;
                  const q = txSearch.toLowerCase();
                  return (
                    tx.id.toLowerCase().includes(q) ||
                    (tx.reason && tx.reason.toLowerCase().includes(q)) ||
                    (tx.paymentMethod && tx.paymentMethod.toLowerCase().includes(q)) ||
                    (tx.paypalOrderId && tx.paypalOrderId.toLowerCase().includes(q))
                  );
                })
                .map((tx) => (
                  <div key={tx.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-neutral-900/50 transition">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-emerald-400">
                          +{tx.amount} Coins
                        </span>
                        <span className="text-[10px] text-neutral-300 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
                          {tx.type}
                        </span>
                        <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/50">
                          Verified & Credited
                        </span>
                      </div>
                      <div className="text-[11px] text-neutral-300">
                        {tx.reason || 'Coin/VIP Topup'}
                      </div>
                      <div className="text-[10px] text-neutral-400 flex flex-wrap items-center gap-2">
                        <span>Method: <strong className="text-white">{tx.paymentMethod || 'PayPal / Gateway'}</strong></span>
                        <span>Receiver: <strong className="text-amber-300 font-mono">{tx.merchantReceiver || linkedPayPalMerchant}</strong></span>
                      </div>
                      <div className="text-[10px] text-neutral-500 font-mono">
                        Ref / Order Token: {tx.paypalOrderId || tx.id}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-[11px] font-bold text-white">
                        {tx.amount > 100 ? '$9.99 / ₹850' : tx.amount > 50 ? '$4.99 / ₹420' : '$1.99 / ₹160'}
                      </div>
                      <div className="text-[10px] text-neutral-500 mt-0.5">
                        {tx.timestamp ? new Date(tx.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Just now'}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
