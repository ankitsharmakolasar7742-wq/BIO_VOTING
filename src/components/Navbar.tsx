import React from 'react';
import { Voter } from '../types';
import { ELECTION_SEAL_URL } from '../utils/storage';
import { ShieldCheck, LogOut, User, Vote, Lock } from 'lucide-react';

interface NavbarProps {
  currentView: 'ballot' | 'register' | 'login' | 'admin';
  setCurrentView: (view: 'ballot' | 'register' | 'login' | 'admin') => void;
  currentVoter: Voter | null;
  onLogoutVoter: () => void;
  isAdminLoggedIn: boolean;
  onLogoutAdmin: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setCurrentView,
  currentVoter,
  onLogoutVoter,
  isAdminLoggedIn,
  onLogoutAdmin,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        
        {/* Zone 1: Single text element Brand wordmark with Insignia */}
        <div 
          onClick={() => setCurrentView('ballot')}
          className="flex items-center gap-3 cursor-pointer group shrink-0"
        >
          <img
            src={ELECTION_SEAL_URL}
            alt="Election Commission Seal"
            referrerPolicy="no-referrer"
            className="w-10 h-10 rounded-lg object-cover ring-1 ring-amber-500/30 group-hover:ring-amber-500/60 transition-all shadow-sm"
          />
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-white whitespace-nowrap">
              BIO VOTING
            </span>
            <span className="text-xs text-slate-400 whitespace-nowrap">
              Biometric Election Portal
            </span>
          </div>
        </div>

        {/* Zone 2: 4-5 concise single-line navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
          <button
            onClick={() => setCurrentView('ballot')}
            className={`transition-colors whitespace-nowrap hover:text-white ${
              currentView === 'ballot' ? 'text-indigo-400 font-semibold' : ''
            }`}
          >
            Voting Ballot
          </button>
          
          {!currentVoter && (
            <>
              <button
                onClick={() => setCurrentView('register')}
                className={`transition-colors whitespace-nowrap hover:text-white ${
                  currentView === 'register' ? 'text-indigo-400 font-semibold' : ''
                }`}
              >
                Voter Registration
              </button>
              <button
                onClick={() => setCurrentView('login')}
                className={`transition-colors whitespace-nowrap hover:text-white ${
                  currentView === 'login' ? 'text-indigo-400 font-semibold' : ''
                }`}
              >
                Voter Sign In
              </button>
            </>
          )}

          <button
            onClick={() => setCurrentView('admin')}
            className={`transition-colors whitespace-nowrap hover:text-white flex items-center gap-1.5 ${
              currentView === 'admin' ? 'text-indigo-400 font-semibold' : ''
            }`}
          >
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>Admin Portal</span>
          </button>
        </nav>

        {/* Zone 3: 1 primary action or session badge */}
        <div className="flex items-center gap-3 shrink-0">
          {currentVoter ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700">
                {currentVoter.profilePhotoUrl ? (
                  <img
                    src={currentVoter.profilePhotoUrl}
                    alt={currentVoter.fullName}
                    className="w-6 h-6 rounded-full object-cover ring-1 ring-emerald-500/50"
                  />
                ) : (
                  <User className="w-5 h-5 text-slate-400" />
                )}
                <div className="flex flex-col text-left">
                  <span className="text-xs font-semibold text-slate-200 truncate max-w-[120px]">
                    {currentVoter.fullName}
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 tabular-nums">
                    {currentVoter.voterId}
                  </span>
                </div>
              </div>

              <button
                onClick={onLogoutVoter}
                title="Sign out voter"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors whitespace-nowrap"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : isAdminLoggedIn ? (
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-amber-400 border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 rounded">
                Admin Session Active
              </span>
              <button
                onClick={onLogoutAdmin}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors whitespace-nowrap"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Exit Admin</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentView('login')}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-200 hover:text-white hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors whitespace-nowrap"
              >
                Sign In
              </button>
              <button
                onClick={() => setCurrentView('register')}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors whitespace-nowrap flex items-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Register to Vote</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};
