import React, { useState, useEffect } from 'react';
import { Voter } from './types';
import { getCurrentVoter, setCurrentVoter, getAdminSession, setAdminSession, logAuditEvent } from './utils/storage';
import { Navbar } from './components/Navbar';
import { BallotView } from './components/BallotView';
import { RegisterView } from './components/RegisterView';
import { LoginView } from './components/LoginView';
import { AdminPortal } from './components/AdminPortal';
import { ShieldCheck, Lock, HeartHandshake } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState<'ballot' | 'register' | 'login' | 'admin'>('ballot');
  const [currentVoter, setCurrentVoterState] = useState<Voter | null>(() => getCurrentVoter());
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => getAdminSession());
  const [prefillUsername, setPrefillUsername] = useState<string>('');

  // Sync state on load
  useEffect(() => {
    const voter = getCurrentVoter();
    setCurrentVoterState(voter);
    setIsAdminLoggedIn(getAdminSession());
  }, []);

  const handleVoterLogin = (voter: Voter) => {
    setCurrentVoterState(voter);
    setCurrentVoter(voter);
    setCurrentView('ballot');
  };

  const handleVoterLogout = () => {
    if (currentVoter) {
      logAuditEvent({
        action: 'VOTER_LOGOUT',
        details: `Voter ${currentVoter.fullName} logged out.`,
        actor: currentVoter.username,
        status: 'info',
      });
    }
    setCurrentVoterState(null);
    setCurrentVoter(null);
    setCurrentView('ballot');
  };

  const handleAdminLogin = () => {
    setIsAdminLoggedIn(true);
    setAdminSession(true);
  };

  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    setAdminSession(false);
    logAuditEvent({
      action: 'ADMIN_LOGOUT',
      details: 'Administrator logged out.',
      actor: 'admin',
      status: 'info',
    });
  };

  const handleRegistrationSuccess = (username: string) => {
    setPrefillUsername(username);
    setCurrentView('login');
  };

  const handleVoterUpdated = (updatedVoter: Voter) => {
    setCurrentVoterState(updatedVoter);
    setCurrentVoter(updatedVoter);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* Universal Top Bar */}
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        currentVoter={currentVoter}
        onLogoutVoter={handleVoterLogout}
        isAdminLoggedIn={isAdminLoggedIn}
        onLogoutAdmin={handleAdminLogout}
      />

      {/* Main Viewport Router */}
      <main className="flex-1">
        {currentView === 'ballot' && (
          <BallotView
            currentVoter={currentVoter}
            onNavigateToLogin={() => setCurrentView('login')}
            onNavigateToRegister={() => setCurrentView('register')}
            onVoterUpdated={handleVoterUpdated}
          />
        )}

        {currentView === 'register' && (
          <RegisterView
            onRegistrationSuccess={handleRegistrationSuccess}
            onNavigateToLogin={() => setCurrentView('login')}
          />
        )}

        {currentView === 'login' && (
          <LoginView
            initialUsername={prefillUsername}
            onLoginSuccess={handleVoterLogin}
            onNavigateToRegister={() => setCurrentView('register')}
            onNavigateToAdmin={() => setCurrentView('admin')}
          />
        )}

        {currentView === 'admin' && (
          <AdminPortal
            isAdminLoggedIn={isAdminLoggedIn}
            onAdminLogin={handleAdminLogin}
            onAdminLogout={handleAdminLogout}
            onNavigateToBallot={() => setCurrentView('ballot')}
          />
        )}
      </main>

      {/* Quiet Civic Governance Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-400/80" />
            <span className="font-medium text-slate-400">
              National Biometric Election Commission
            </span>
            <span aria-hidden="true" className="text-slate-700">·</span>
            <span>Zero-Trust Face Liveness & OTP Protection</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-500">
            <span>Encrypted Secret Ballot</span>
            <span aria-hidden="true" className="text-slate-800">·</span>
            <span>Section 24(A) Civic Privacy Compliant</span>
            <span aria-hidden="true" className="text-slate-800">·</span>
            <span className="font-mono tabular-nums">2026</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
