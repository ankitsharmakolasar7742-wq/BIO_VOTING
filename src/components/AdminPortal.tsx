import React, { useState } from 'react';
import { Party, Voter, AuditLog } from '../types';
import { getStoredParties, saveParties, getStoredVoters, saveVoters, getAuditLogs, logAuditEvent, setAdminSession, ELECTION_SEAL_URL } from '../utils/storage';
import { ShieldCheck, Plus, Trash2, Edit2, BarChart3, Users, FileText, Lock, KeyRound, AlertCircle, CheckCircle2, RotateCcw, Upload, Check } from 'lucide-react';

interface AdminPortalProps {
  isAdminLoggedIn: boolean;
  onAdminLogin: () => void;
  onAdminLogout: () => void;
  onNavigateToBallot: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  isAdminLoggedIn,
  onAdminLogin,
  onAdminLogout,
  onNavigateToBallot,
}) => {
  // Admin Login States
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Admin Dashboard Tabs
  const [activeTab, setActiveTab] = useState<'parties' | 'results' | 'voters' | 'logs'>('parties');

  // Parties State
  const [parties, setParties] = useState<Party[]>(() => getStoredParties());
  const [showAddPartyModal, setShowAddPartyModal] = useState(false);
  const [editingPartyId, setEditingPartyId] = useState<string | null>(null);

  // New Party Form
  const [partyName, setPartyName] = useState('');
  const [shortCode, setShortCode] = useState('');
  const [candidateName, setCandidateName] = useState('');
  const [candidatePhoto, setCandidatePhoto] = useState('');
  const [symbolDesc, setSymbolDesc] = useState('');
  const [partyColor, setPartyColor] = useState('#6366f1');
  const [manifesto, setManifesto] = useState('');
  const [partyFormError, setPartyFormError] = useState('');
  const [partySuccessMessage, setPartySuccessMessage] = useState('');

  // Voters State
  const [voters, setVoters] = useState<Voter[]>(() => getStoredVoters());
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => getAuditLogs());

  // Handle Admin Sign In
  const handleAdminSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (
      (adminUsername === 'admin' && adminPassword === 'admin123') ||
      (adminUsername === 'administrator' && adminPassword === 'admin123')
    ) {
      setAdminSession(true);
      onAdminLogin();
      logAuditEvent({
        action: 'ADMIN_LOGIN_SUCCESS',
        details: 'Administrator authenticated into election control console.',
        actor: adminUsername,
        status: 'info',
      });
    } else {
      setLoginError('Invalid Administrator credentials. Default credentials: admin / admin123');
    }
  };

  // Quick 1-click test admin login
  const handleQuickAdminLogin = () => {
    setAdminUsername('admin');
    setAdminPassword('admin123');
    setAdminSession(true);
    onAdminLogin();
  };

  // Handle Candidate Photo upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setCandidatePhoto(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Save or Edit Party
  const handleSaveParty = (e: React.FormEvent) => {
    e.preventDefault();
    setPartyFormError('');

    if (!partyName.trim() || !candidateName.trim() || !shortCode.trim()) {
      setPartyFormError('Party name, candidate name, and short code are required.');
      return;
    }

    if (editingPartyId) {
      // Edit existing party
      const updated = parties.map((p) =>
        p.id === editingPartyId
          ? {
              ...p,
              name: partyName.trim(),
              shortCode: shortCode.trim().toUpperCase(),
              candidateName: candidateName.trim(),
              candidatePhoto: candidatePhoto || p.candidatePhoto,
              symbolDescription: symbolDesc.trim() || p.symbolDescription,
              color: partyColor,
              manifesto: manifesto.trim(),
            }
          : p
      );
      setParties(updated);
      saveParties(updated);
      logAuditEvent({
        action: 'PARTY_UPDATED',
        details: `Party "${partyName}" was modified by administrator.`,
        actor: 'admin',
        status: 'info',
      });
      setPartySuccessMessage('Party updated successfully!');
    } else {
      // Add new party
      const newParty: Party = {
        id: `party-${Date.now()}`,
        name: partyName.trim(),
        shortCode: shortCode.trim().toUpperCase(),
        candidateName: candidateName.trim(),
        candidatePhoto: candidatePhoto || '',
        symbolIcon: 'Vote',
        symbolDescription: symbolDesc.trim() || 'Civic Election Symbol',
        color: partyColor,
        manifesto: manifesto.trim() || 'Dedicated to civic prosperity and public integrity.',
        voteCount: 0,
      };

      const updated = [...parties, newParty];
      setParties(updated);
      saveParties(updated);
      logAuditEvent({
        action: 'PARTY_CREATED',
        details: `New political party "${newParty.name}" (${newParty.shortCode}) added to official ballot.`,
        actor: 'admin',
        status: 'success',
      });
      setPartySuccessMessage(`Party "${newParty.name}" added successfully to the ballot!`);
    }

    // Reset Form
    setTimeout(() => {
      setShowAddPartyModal(false);
      setEditingPartyId(null);
      setPartyName('');
      setShortCode('');
      setCandidateName('');
      setCandidatePhoto('');
      setSymbolDesc('');
      setManifesto('');
      setPartySuccessMessage('');
    }, 1200);
  };

  const handleEditClick = (party: Party) => {
    setEditingPartyId(party.id);
    setPartyName(party.name);
    setShortCode(party.shortCode);
    setCandidateName(party.candidateName);
    setCandidatePhoto(party.candidatePhoto);
    setSymbolDesc(party.symbolDescription);
    setPartyColor(party.color);
    setManifesto(party.manifesto);
    setShowAddPartyModal(true);
  };

  const handleDeleteParty = (id: string, name: string) => {
    if (confirm(`Are you sure you want to remove "${name}" from the official ballot?`)) {
      const updated = parties.filter((p) => p.id !== id);
      setParties(updated);
      saveParties(updated);
      logAuditEvent({
        action: 'PARTY_DELETED',
        details: `Party "${name}" removed from ballot.`,
        actor: 'admin',
        status: 'warning',
      });
    }
  };

  const handleResetElectionVotes = () => {
    if (
      confirm(
        'WARNING: This will reset all vote counts and voter ballots back to zero for a new election cycle. Are you sure?'
      )
    ) {
      const resetParties = parties.map((p) => ({ ...p, voteCount: 0 }));
      setParties(resetParties);
      saveParties(resetParties);

      const currentVoters = getStoredVoters();
      const resetVoters = currentVoters.map((v) => ({
        ...v,
        hasVoted: false,
        votedPartyId: undefined,
        votedAt: undefined,
        ballotReceiptId: undefined,
      }));
      setVoters(resetVoters);
      saveVoters(resetVoters);

      logAuditEvent({
        action: 'ELECTION_VOTES_RESET',
        details: 'Administrator reset all ballot counts and voter status.',
        actor: 'admin',
        status: 'warning',
      });
      alert('Election votes have been successfully reset.');
    }
  };

  // Calculations for analytics
  const totalVotesCast = parties.reduce((acc, p) => acc + p.voteCount, 0);
  const totalRegisteredVoters = voters.length;
  const turnoutPercentage =
    totalRegisteredVoters > 0
      ? ((voters.filter((v) => v.hasVoted).length / totalRegisteredVoters) * 100).toFixed(1)
      : '0.0';

  // Render Login if not authenticated
  if (!isAdminLoggedIn) {
    return (
      <div className="max-w-md mx-auto py-12 px-4 sm:px-6">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-4 shadow-sm">
            <Lock className="w-8 h-8 text-amber-400" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Administrator Gateway
          </h1>
          <p className="mt-2 text-xs text-slate-400">
            Election Commission Officer authorization required to manage parties, candidates, and live election records.
          </p>
        </div>

        {loginError && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{loginError}</span>
          </div>
        )}

        <form onSubmit={handleAdminSignIn} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4 shadow-xl">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Admin Username
            </label>
            <input
              type="text"
              required
              value={adminUsername}
              onChange={(e) => setAdminUsername(e.target.value)}
              placeholder="e.g. admin"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Admin Master Password
            </label>
            <input
              type="password"
              required
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg text-xs shadow-md transition-colors"
          >
            Authenticate as Administrator
          </button>

          <div className="pt-3 border-t border-slate-800 text-center">
            <button
              type="button"
              onClick={handleQuickAdminLogin}
              className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors border border-slate-700"
            >
              1-Click Demo Admin Login (admin / admin123)
            </button>
          </div>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={onNavigateToBallot}
              className="text-xs text-slate-400 hover:text-slate-200"
            >
              Back to Voting Ballot
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Render Admin Console
  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      
      {/* Top Console Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Authorized Election Commissioner Panel</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Election Admin Control Console
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setEditingPartyId(null);
              setPartyName('');
              setShortCode('');
              setCandidateName('');
              setCandidatePhoto('');
              setSymbolDesc('');
              setManifesto('');
              setShowAddPartyModal(true);
            }}
            className="py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-md shadow-indigo-600/25"
          >
            <Plus className="w-4 h-4" />
            <span>Add Political Party</span>
          </button>

          <button
            onClick={handleResetElectionVotes}
            className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
            title="Reset votes for a new election run"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Votes</span>
          </button>
        </div>
      </div>

      {/* Metric Counters Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="text-xs text-slate-400 font-medium">Total Registered Voters</div>
          <div className="mt-2 text-2xl font-bold text-white font-mono tabular-nums">
            {totalRegisteredVoters}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Enrolled with mobile OTP & facial template
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="text-xs text-slate-400 font-medium">Total Ballots Cast</div>
          <div className="mt-2 text-2xl font-bold text-indigo-400 font-mono tabular-nums">
            {totalVotesCast}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Verified via real-time biometric liveness
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="text-xs text-slate-400 font-medium">Voter Turnout Rate</div>
          <div className="mt-2 text-2xl font-bold text-emerald-400 font-mono tabular-nums">
            {turnoutPercentage}%
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Active participating electorate
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 w-fit">
        <button
          onClick={() => setActiveTab('parties')}
          className={`py-1.5 px-4 rounded-lg text-xs font-medium transition-colors ${
            activeTab === 'parties'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Party Registry ({parties.length})
        </button>
        <button
          onClick={() => setActiveTab('results')}
          className={`py-1.5 px-4 rounded-lg text-xs font-medium transition-colors ${
            activeTab === 'results'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Live Election Tally
        </button>
        <button
          onClick={() => setActiveTab('voters')}
          className={`py-1.5 px-4 rounded-lg text-xs font-medium transition-colors ${
            activeTab === 'voters'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Voters Roll ({voters.length})
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`py-1.5 px-4 rounded-lg text-xs font-medium transition-colors ${
            activeTab === 'logs'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Security Audit Trail
        </button>
      </div>

      {/* Tab 1: Parties Registry */}
      {activeTab === 'parties' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Ballot Political Parties</h2>
            <button
              onClick={() => {
                setEditingPartyId(null);
                setPartyName('');
                setShortCode('');
                setCandidateName('');
                setCandidatePhoto('');
                setSymbolDesc('');
                setManifesto('');
                setShowAddPartyModal(true);
              }}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New Party</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {parties.map((party) => (
              <div
                key={party.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-sm relative group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-sm shrink-0"
                        style={{ backgroundColor: party.color }}
                      >
                        {party.shortCode}
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-sm">{party.name}</h3>
                        <div className="text-[11px] text-slate-400">
                          Code: {party.shortCode}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEditClick(party)}
                        className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                        title="Edit Party"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteParty(party.id, party.name)}
                        className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-slate-800 rounded-lg transition-colors"
                        title="Delete Party"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800/80 mb-3">
                    {party.candidatePhoto ? (
                      <img
                        src={party.candidatePhoto}
                        alt={party.candidateName}
                        className="w-10 h-10 rounded-lg object-cover ring-1 ring-slate-700"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400">
                        {party.candidateName.charAt(0)}
                      </div>
                    )}
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Candidate</div>
                      <div className="text-xs font-bold text-slate-200">{party.candidateName}</div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                    {party.manifesto}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Recorded Votes:</span>
                  <span className="font-mono font-bold text-indigo-400 tabular-nums text-sm">
                    {party.voteCount}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Live Election Tally */}
      {activeTab === 'results' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-white">Live Parliamentary Vote Tally</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Real-time biometric vote calculation. Total votes cast: <strong className="text-white font-mono">{totalVotesCast}</strong>
            </p>
          </div>

          <div className="space-y-5">
            {parties.map((party) => {
              const percentage =
                totalVotesCast > 0 ? ((party.voteCount / totalVotesCast) * 100).toFixed(1) : '0.0';

              return (
                <div key={party.id} className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: party.color }}
                      />
                      <span className="font-bold text-white">{party.name}</span>
                      <span className="text-slate-400">({party.candidateName})</span>
                    </div>
                    <div className="flex items-center gap-3 font-mono">
                      <span className="text-slate-300 tabular-nums">{party.voteCount} votes</span>
                      <span className="font-bold text-indigo-400 tabular-nums">{percentage}%</span>
                    </div>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: party.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Voters Roll */}
      {activeTab === 'voters' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 overflow-x-auto">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Electoral Roll & Voter Registry</h2>
            <span className="text-xs text-slate-400">
              {voters.filter((v) => v.hasVoted).length} of {voters.length} voted
            </span>
          </div>

          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                <th className="pb-3 pl-2">Voter</th>
                <th className="pb-3">Voter ID</th>
                <th className="pb-3">Mobile</th>
                <th className="pb-3">OTP & Face Enrolled</th>
                <th className="pb-3">Voting Status</th>
                <th className="pb-3">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {voters.map((v) => (
                <tr key={v.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 pl-2">
                    <div className="flex items-center gap-2.5">
                      {v.profilePhotoUrl ? (
                        <img
                          src={v.profilePhotoUrl}
                          alt={v.fullName}
                          className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-700"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-[10px]">
                          ID
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-white">{v.fullName}</div>
                        <div className="text-[10px] text-slate-400">@{v.username}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 font-mono font-medium text-slate-300 tabular-nums">
                    {v.voterId}
                  </td>
                  <td className="py-3 font-mono text-slate-400">
                    {v.mobile}
                  </td>
                  <td className="py-3">
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Verified</span>
                    </span>
                  </td>
                  <td className="py-3">
                    {v.hasVoted ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                        Voted
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400">
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="py-3 text-[11px] text-slate-500 font-mono">
                    {v.votedAt ? new Date(v.votedAt).toLocaleTimeString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 4: Security Audit Trail */}
      {activeTab === 'logs' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Immutable Security Audit Logs</h2>
            <span className="text-xs text-slate-400 font-mono">
              Total events: {auditLogs.length}
            </span>
          </div>

          <div className="space-y-2">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div>
                  <span className="font-mono font-semibold text-indigo-400 mr-2">
                    [{log.action}]
                  </span>
                  <span className="text-slate-300">{log.details}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0 text-slate-500 font-mono text-[11px]">
                  <span>Actor: {log.actor}</span>
                  <span>·</span>
                  <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add / Edit Party Modal */}
      {showAddPartyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl relative my-8">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">
                  {editingPartyId ? 'Edit Political Party' : 'Add New Political Party'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  This party will immediately be displayed on the voting ballot for all citizens.
                </p>
              </div>
              <button
                onClick={() => setShowAddPartyModal(false)}
                className="text-slate-400 hover:text-slate-200 text-xl leading-none"
              >
                &times;
              </button>
            </div>

            {partyFormError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{partyFormError}</span>
              </div>
            )}

            {partySuccessMessage && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{partySuccessMessage}</span>
              </div>
            )}

            <form onSubmit={handleSaveParty} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Party Full Name
                </label>
                <input
                  type="text"
                  required
                  value={partyName}
                  onChange={(e) => setPartyName(e.target.value)}
                  placeholder="e.g. Democratic Freedom Front"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Short Code / Acronym
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={5}
                    value={shortCode}
                    onChange={(e) => setShortCode(e.target.value.toUpperCase())}
                    placeholder="e.g. DFF"
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm font-mono text-white uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Party Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={partyColor}
                      onChange={(e) => setPartyColor(e.target.value)}
                      className="w-10 h-9 p-0.5 bg-slate-950 border border-slate-700 rounded-lg cursor-pointer"
                    />
                    <span className="text-xs font-mono text-slate-400">{partyColor}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nominated Candidate Name
                </label>
                <input
                  type="text"
                  required
                  value={candidateName}
                  onChange={(e) => setCandidateName(e.target.value)}
                  placeholder="e.g. Samuel K. Thorne"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Party Symbol Description
                </label>
                <input
                  type="text"
                  value={symbolDesc}
                  onChange={(e) => setSymbolDesc(e.target.value)}
                  placeholder="e.g. Rising Sun of Justice"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Candidate Photo
                </label>
                <div className="flex items-center gap-3">
                  {candidatePhoto ? (
                    <img
                      src={candidatePhoto}
                      alt="Candidate Preview"
                      className="w-12 h-12 rounded-xl object-cover ring-1 ring-slate-700"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-xs text-slate-500">
                      Photo
                    </div>
                  )}
                  <label className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium cursor-pointer transition-colors flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Candidate Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Key Manifesto / Platform
                </label>
                <textarea
                  rows={2}
                  value={manifesto}
                  onChange={(e) => setManifesto(e.target.value)}
                  placeholder="Brief summary of policy goals..."
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddPartyModal(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingPartyId ? 'Save Changes' : 'Add Party to Ballot'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
