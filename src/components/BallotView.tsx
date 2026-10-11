import React, { useState } from 'react';
import { Party, Voter } from '../types';
import { FaceVerificationModal } from './FaceVerificationModal';
import { VoteSuccessModal } from './VoteSuccessModal';
import { getStoredParties, saveParties, getStoredVoters, saveVoters, setCurrentVoter, logAuditEvent, ELECTION_SEAL_URL } from '../utils/storage';
import { ShieldCheck, CheckCircle2, Camera, Award, User, Lock, Search, Filter, AlertCircle, FileText } from 'lucide-react';

interface BallotViewProps {
  currentVoter: Voter | null;
  onNavigateToLogin: () => void;
  onNavigateToRegister: () => void;
  onVoterUpdated: (voter: Voter) => void;
}

export const BallotView: React.FC<BallotViewProps> = ({
  currentVoter,
  onNavigateToLogin,
  onNavigateToRegister,
  onVoterUpdated,
}) => {
  const [parties, setParties] = useState<Party[]>(() => getStoredParties());
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);
  const [showFaceModal, setShowFaceModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<{
    party: Party;
    receiptId: string;
    timestamp: string;
  } | null>(null);

  const [searchQuery, setSearchQuery] = useState('');

  const filteredParties = parties.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.candidateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.shortCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectPartyToVote = (party: Party) => {
    if (!currentVoter) {
      onNavigateToLogin();
      return;
    }

    if (currentVoter.hasVoted) {
      return;
    }

    setSelectedParty(party);
    setShowFaceModal(true);
  };

  const handleBiometricVerificationSuccess = () => {
    if (!selectedParty || !currentVoter) return;

    const receiptId = `REC-${selectedParty.shortCode}-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const timestamp = new Date().toISOString();

    // 1. Increment party vote count
    const updatedParties = parties.map((p) =>
      p.id === selectedParty.id ? { ...p, voteCount: p.voteCount + 1 } : p
    );
    setParties(updatedParties);
    saveParties(updatedParties);

    // 2. Mark voter as voted
    const updatedVoter: Voter = {
      ...currentVoter,
      hasVoted: true,
      votedPartyId: selectedParty.id,
      votedAt: timestamp,
      ballotReceiptId: receiptId,
    };

    const allVoters = getStoredVoters();
    const updatedVotersList = allVoters.map((v) =>
      v.id === updatedVoter.id ? updatedVoter : v
    );
    saveVoters(updatedVotersList);
    setCurrentVoter(updatedVoter);
    onVoterUpdated(updatedVoter);

    // 3. Log audit record
    logAuditEvent({
      action: 'BALLOT_CAST_BIOMETRIC_SUCCESS',
      details: `Voter ${currentVoter.fullName} (${currentVoter.voterId}) cast ballot for ${selectedParty.name} with Receipt ID ${receiptId}.`,
      actor: currentVoter.username,
      status: 'success',
    });

    // 4. Show success modal
    setLastReceipt({
      party: selectedParty,
      receiptId,
      timestamp,
    });
    setShowFaceModal(false);
    setShowSuccessModal(true);
  };

  const previouslyVotedParty = currentVoter?.votedPartyId
    ? parties.find((p) => p.id === currentVoter.votedPartyId)
    : null;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      
      {/* Top Banner / Civic Seal Lockup */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold tracking-wider uppercase">
              <ShieldCheck className="w-4 h-4" />
              <span>Official Biometric Election System</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              2026 Parliamentary General Election
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Select your political party candidate. When you click vote, the biometric camera will activate for real-time facial verification and anti-spoofing liveness validation against your enrolled profile template.
            </p>
          </div>

          {/* Voter Eligibility Status Card */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shrink-0 max-w-sm w-full shadow-lg">
            {currentVoter ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Authenticated Voter</span>
                  {currentVoter.hasVoted ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/30 px-2.5 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                      Vote Recorded
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      Eligible to Vote
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 pt-1">
                  {currentVoter.profilePhotoUrl ? (
                    <img
                      src={currentVoter.profilePhotoUrl}
                      alt={currentVoter.fullName}
                      className="w-12 h-12 rounded-xl object-cover ring-2 ring-indigo-500/50 shadow"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400">
                      <User className="w-6 h-6" />
                    </div>
                  )}
                  <div>
                    <div className="text-sm font-bold text-white">
                      {currentVoter.fullName}
                    </div>
                    <div className="text-xs font-mono text-slate-400 tabular-nums">
                      Voter ID: {currentVoter.voterId}
                    </div>
                  </div>
                </div>

                {currentVoter.hasVoted && previouslyVotedParty && (
                  <div className="pt-2 border-t border-slate-800/80 text-xs text-slate-400">
                    Ballot cast for:{' '}
                    <strong className="text-white font-medium">
                      {previouslyVotedParty.name}
                    </strong>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Voter Sign In Required</span>
                </div>
                <p className="text-xs text-slate-400">
                  You must sign in with your registered username and password to cast your ballot.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={onNavigateToLogin}
                    className="flex-1 py-1.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors text-center"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={onNavigateToRegister}
                    className="flex-1 py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition-colors text-center"
                  >
                    Enroll
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search & Party Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Registered Political Parties & Candidates
          </h2>
          <p className="text-xs text-slate-400">
            Showing {filteredParties.length} candidates on this parliamentary ballot
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search party or candidate..."
            className="w-full pl-9 pr-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Parties Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {filteredParties.map((party) => {
          const isVotedChoice = currentVoter?.votedPartyId === party.id;
          const userHasVoted = Boolean(currentVoter?.hasVoted);

          return (
            <div
              key={party.id}
              className={`bg-slate-900 border rounded-2xl p-6 transition-all shadow-md flex flex-col justify-between relative overflow-hidden ${
                isVotedChoice
                  ? 'border-indigo-500 ring-2 ring-indigo-500/20'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Header: Short Code & Color Badge */}
              <div>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white text-base shadow-sm shrink-0"
                      style={{ backgroundColor: party.color }}
                    >
                      {party.shortCode}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white leading-snug">
                        {party.name}
                      </h3>
                      <div className="text-xs text-slate-400 font-mono mt-0.5">
                        Symbol: {party.symbolDescription}
                      </div>
                    </div>
                  </div>

                  {isVotedChoice && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-full shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Your Choice
                    </span>
                  )}
                </div>

                {/* Candidate portrait & bio */}
                <div className="flex items-center gap-4 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 mb-4">
                  {party.candidatePhoto ? (
                    <img
                      src={party.candidatePhoto}
                      alt={party.candidateName}
                      className="w-16 h-16 rounded-xl object-cover ring-1 ring-slate-700 shadow-sm shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 font-bold shrink-0">
                      {party.candidateName.charAt(0)}
                    </div>
                  )}
                  <div>
                    <div className="text-[11px] text-slate-400 uppercase font-semibold">
                      Nominated Candidate
                    </div>
                    <div className="text-sm font-bold text-slate-100">
                      {party.candidateName}
                    </div>
                    <div className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                      Parliamentary Representative
                    </div>
                  </div>
                </div>

                {/* Manifesto Snippet */}
                <p className="text-xs text-slate-300 leading-relaxed mb-5">
                  &ldquo;{party.manifesto}&rdquo;
                </p>
              </div>

              {/* Bottom Action Area */}
              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-mono tabular-nums">
                  Ballot Code: {party.shortCode}-2026
                </span>

                {userHasVoted ? (
                  isVotedChoice ? (
                    <button
                      disabled
                      className="px-4 py-2 bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-semibold cursor-default"
                    >
                      Ballot Confirmed
                    </button>
                  ) : (
                    <button
                      disabled
                      className="px-4 py-2 bg-slate-800 text-slate-500 border border-slate-800 rounded-xl text-xs font-medium cursor-not-allowed opacity-50"
                    >
                      Vote Cast
                    </button>
                  )
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSelectPartyToVote(party)}
                    className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-all shadow-md shadow-indigo-600/25 flex items-center gap-2 cursor-pointer group"
                  >
                    <Camera className="w-4 h-4 text-indigo-200 group-hover:scale-110 transition-transform" />
                    <span>Cast Vote with Face ID</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredParties.length === 0 && (
        <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-2xl p-8">
          <p className="text-sm text-slate-400">
            No political parties found matching &ldquo;{searchQuery}&rdquo;.
          </p>
        </div>
      )}

      {/* Face Biometric Verification Modal */}
      {showFaceModal && selectedParty && currentVoter && (
        <FaceVerificationModal
          party={selectedParty}
          voter={currentVoter}
          onSuccess={handleBiometricVerificationSuccess}
          onCancel={() => setShowFaceModal(false)}
        />
      )}

      {/* Success Receipt Modal */}
      {showSuccessModal && lastReceipt && currentVoter && (
        <VoteSuccessModal
          party={lastReceipt.party}
          voter={currentVoter}
          receiptId={lastReceipt.receiptId}
          timestamp={lastReceipt.timestamp}
          onClose={() => setShowSuccessModal(false)}
        />
      )}

    </div>
  );
};
