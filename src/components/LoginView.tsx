import React, { useState } from 'react';
import { Voter } from '../types';
import { getStoredVoters, saveVoters, logAuditEvent, ELECTION_SEAL_URL } from '../utils/storage';
import { SmsSimulatorToast } from './SmsSimulatorToast';
import { Lock, User, KeyRound, Smartphone, AlertCircle, CheckCircle2, ArrowRight, ShieldCheck, HelpCircle } from 'lucide-react';

interface LoginViewProps {
  initialUsername?: string;
  onLoginSuccess: (voter: Voter) => void;
  onNavigateToRegister: () => void;
  onNavigateToAdmin: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  initialUsername = '',
  onLoginSuccess,
  onNavigateToRegister,
  onNavigateToAdmin,
}) => {
  const [username, setUsername] = useState(initialUsername);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successBanner, setSuccessBanner] = useState('');

  // Forgot password workflow states
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotInput, setForgotInput] = useState('');
  const [forgotOtpSent, setForgotOtpSent] = useState(false);
  const [forgotOtpCode, setForgotOtpCode] = useState('');
  const [forgotOtpInput, setForgotOtpInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotMobile, setForgotMobile] = useState('');
  const [matchedVoter, setMatchedVoter] = useState<Voter | null>(null);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [showSmsAlert, setShowSmsAlert] = useState(false);

  // Handle standard login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Please provide both username and password.');
      return;
    }

    const voters = getStoredVoters();
    const voter = voters.find(
      (v) =>
        v.username.toLowerCase() === username.trim().toLowerCase() &&
        v.password === password
    );

    if (!voter) {
      setError('Invalid credentials. Please verify your username and password or use "Forgot Password".');
      return;
    }

    logAuditEvent({
      action: 'VOTER_LOGIN_SUCCESS',
      details: `Voter ${voter.fullName} logged in.`,
      actor: voter.username,
      status: 'success',
    });

    onLoginSuccess(voter);
  };

  // Quick 1-click test login for convenience
  const handleQuickDemoLogin = (demoUsername: string) => {
    const voters = getStoredVoters();
    const found = voters.find((v) => v.username === demoUsername);
    if (found) {
      setUsername(found.username);
      setPassword(found.password);
      onLoginSuccess(found);
    }
  };

  // Forgot password - Step 1: Send OTP to mobile
  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');

    const voters = getStoredVoters();
    const found = voters.find(
      (v) =>
        v.username.toLowerCase() === forgotInput.trim().toLowerCase() ||
        v.mobile.replace(/\s+/g, '') === forgotInput.trim().replace(/\s+/g, '') ||
        v.voterId.toLowerCase() === forgotInput.trim().toLowerCase()
    );

    if (!found) {
      setForgotError('No voter account found matching this username, mobile number, or Voter ID.');
      return;
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setMatchedVoter(found);
    setForgotMobile(found.mobile);
    setForgotOtpCode(otp);
    setForgotOtpSent(true);
    setShowSmsAlert(true);
  };

  // Forgot password - Step 2: Verify OTP and save new password
  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');

    if (forgotOtpInput.trim() !== forgotOtpCode.trim()) {
      setForgotError('Invalid OTP code. Please enter the verification code sent to your mobile.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setForgotError('New password must be at least 6 characters long.');
      return;
    }

    if (!matchedVoter) return;

    // Update password in voters storage
    const voters = getStoredVoters();
    const updated = voters.map((v) =>
      v.id === matchedVoter.id ? { ...v, password: newPassword } : v
    );
    saveVoters(updated);

    logAuditEvent({
      action: 'PASSWORD_RESET_SUCCESS',
      details: `Password reset via mobile OTP for user ${matchedVoter.username}.`,
      actor: matchedVoter.username,
      status: 'info',
    });

    setForgotSuccess('Password updated successfully! You can now log in with your new password.');
    setTimeout(() => {
      setShowForgotModal(false);
      setUsername(matchedVoter.username);
      setPassword(newPassword);
      setSuccessBanner('Password reset successful. Please click Sign In to continue.');
      setForgotOtpSent(false);
      setForgotOtpInput('');
      setNewPassword('');
    }, 1500);
  };

  return (
    <div className="max-w-md mx-auto py-10 px-4 sm:px-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 mb-4 shadow-sm">
          <KeyRound className="w-8 h-8 text-indigo-400" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Voter Sign In
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Enter your registered username and password to access the official biometric voting booth.
        </p>
      </div>

      {successBanner && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
          <span>{successBanner}</span>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Username
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Password
              </label>
              <button
                type="button"
                onClick={() => {
                  setShowForgotModal(true);
                  setForgotError('');
                  setForgotSuccess('');
                }}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            <span>Sign In to Ballot</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-2 border-t border-slate-800 text-center">
          <p className="text-xs text-slate-400">
            Don&apos;t have an account?{' '}
            <button
              onClick={onNavigateToRegister}
              className="text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-4 ml-1"
            >
              Enroll as New Voter
            </button>
          </p>
        </div>

        {/* Quick Test Demo Accounts */}
        <div className="pt-3 border-t border-slate-800/80">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 text-center">
            Quick Test Drive Accounts
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('rahulverma')}
              className="p-2 text-left bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs transition-colors"
            >
              <div className="font-medium text-slate-200 truncate">Rahul Verma</div>
              <div className="text-[10px] text-emerald-400">Eligible to Vote</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('ananya_d')}
              className="p-2 text-left bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs transition-colors"
            >
              <div className="font-medium text-slate-200 truncate">Ananya Deshmukh</div>
              <div className="text-[10px] text-indigo-400">Vote Already Cast</div>
            </button>
          </div>
        </div>

        {/* Admin Link */}
        <div className="text-center">
          <button
            onClick={onNavigateToAdmin}
            className="text-xs text-slate-400 hover:text-slate-200 flex items-center justify-center gap-1.5 mx-auto transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Switch to Election Administrator Portal</span>
          </button>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Reset Password</h3>
                  <p className="text-xs text-slate-400">
                    Receive a temporary OTP code directly on your registered mobile
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowForgotModal(false)}
                className="text-slate-400 hover:text-slate-200 text-lg leading-none p-1"
              >
                &times;
              </button>
            </div>

            {forgotError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{forgotError}</span>
              </div>
            )}

            {forgotSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs rounded-lg flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{forgotSuccess}</span>
              </div>
            )}

            {!forgotOtpSent ? (
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Enter Username, Mobile Number, or Voter ID
                  </label>
                  <input
                    type="text"
                    required
                    value={forgotInput}
                    onChange={(e) => setForgotInput(e.target.value)}
                    placeholder="e.g. rahulverma or +91 98765 43210"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Send Reset OTP</span>
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs text-slate-300">
                  OTP sent to registered mobile{' '}
                  <strong className="text-white font-mono">{forgotMobile}</strong>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Enter 6-Digit Mobile OTP
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={forgotOtpInput}
                    onChange={(e) => setForgotOtpInput(e.target.value)}
                    placeholder="Enter 6-digit code"
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-lg text-center font-mono text-base tracking-widest text-amber-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter at least 6 characters"
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setForgotOtpSent(false)}
                    className="px-3 py-2 text-xs text-slate-400 hover:text-white"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors"
                  >
                    Confirm & Update Password
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Simulated SMS Alert */}
      {showSmsAlert && (
        <SmsSimulatorToast
          otp={forgotOtpCode}
          mobile={forgotMobile}
          messageType="forgot_password"
          onDismiss={() => setShowSmsAlert(false)}
          onAutoFill={(code) => {
            setForgotOtpInput(code);
            setShowSmsAlert(false);
          }}
        />
      )}
    </div>
  );
};
