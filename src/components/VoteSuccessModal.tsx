import React from 'react';
import { Party, Voter } from '../types';
import { ELECTION_SEAL_URL } from '../utils/storage';
import { CheckCircle2, ShieldCheck, Printer, ArrowRight, Award, Hash, Clock } from 'lucide-react';

interface VoteSuccessModalProps {
  party: Party;
  voter: Voter;
  receiptId: string;
  timestamp: string;
  onClose: () => void;
}

export const VoteSuccessModal: React.FC<VoteSuccessModalProps> = ({
  party,
  voter,
  receiptId,
  timestamp,
  onClose,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(timestamp).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'medium',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl relative text-center">
        
        {/* Animated Success Badge */}
        <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shadow-lg shadow-emerald-500/10">
          <CheckCircle2 className="w-10 h-10 text-emerald-400" />
        </div>

        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Vote Submitted Successfully
          </h2>
          <p className="mt-1.5 text-xs text-slate-400">
            Your biometric identity was verified and your secret ballot has been cast into the sovereign election ledger.
          </p>
        </div>

        {/* Official Digital Voting Slip Card */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 text-left space-y-4 shadow-inner relative overflow-hidden">
          {/* Subtle Watermark seal */}
          <img
            src={ELECTION_SEAL_URL}
            alt=""
            aria-hidden="true"
            className="absolute -right-6 -bottom-6 w-32 h-32 opacity-10 pointer-events-none rounded-full"
          />

          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <img
                src={ELECTION_SEAL_URL}
                alt="Election Seal"
                className="w-7 h-7 rounded-md object-cover"
              />
              <div>
                <div className="text-xs font-bold text-white uppercase tracking-wider">
                  Official Ballot Receipt
                </div>
                <div className="text-[10px] text-slate-400">
                  National Election Commission
                </div>
              </div>
            </div>
            <span className="text-[10px] font-mono font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">
              VERIFIED
            </span>
          </div>

          {/* Party and Candidate Details */}
          <div className="flex items-center gap-4 py-1">
            {party.candidatePhoto ? (
              <img
                src={party.candidatePhoto}
                alt={party.candidateName}
                className="w-14 h-14 rounded-xl object-cover ring-2 ring-slate-700 shadow-md"
              />
            ) : (
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center font-bold text-white text-base shadow-md"
                style={{ backgroundColor: party.color }}
              >
                {party.shortCode}
              </div>
            )}
            <div>
              <div className="text-xs text-slate-400 font-medium">Party Selected</div>
              <div className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>{party.name}</span>
                <span className="text-xs text-indigo-400 font-mono">({party.shortCode})</span>
              </div>
              <div className="text-xs text-slate-300 mt-0.5">
                Candidate: <strong className="text-slate-100">{party.candidateName}</strong>
              </div>
            </div>
          </div>

          {/* Verification Metadata Grid */}
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800 text-xs">
            <div>
              <div className="text-[11px] text-slate-500 flex items-center gap-1">
                <Hash className="w-3 h-3" />
                <span>Receipt Hash ID</span>
              </div>
              <div className="font-mono text-slate-200 text-xs font-semibold tabular-nums truncate">
                {receiptId}
              </div>
            </div>

            <div>
              <div className="text-[11px] text-slate-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>Timestamp</span>
              </div>
              <div className="text-slate-200 text-xs tabular-nums">
                {formattedDate}
              </div>
            </div>

            <div>
              <div className="text-[11px] text-slate-500">Voter ID (Masked)</div>
              <div className="font-mono text-slate-300 text-xs">
                {voter.voterId.substring(0, 3)}***{voter.voterId.slice(-2)}
              </div>
            </div>

            <div>
              <div className="text-[11px] text-slate-500">Biometric Liveness</div>
              <div className="text-emerald-400 text-xs font-medium flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                <span>Face Verified</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Buttons */}
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={handlePrint}
            className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>Print Receipt</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-all shadow-md shadow-indigo-600/30 flex items-center gap-2"
          >
            <span>Done & Return to Overview</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
