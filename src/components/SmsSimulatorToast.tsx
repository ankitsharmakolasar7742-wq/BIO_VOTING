import React from 'react';
import { Smartphone, Check, Copy, X } from 'lucide-react';

interface SmsSimulatorToastProps {
  otp: string;
  mobile: string;
  messageType?: 'registration' | 'forgot_password';
  onDismiss: () => void;
  onAutoFill?: (code: string) => void;
}

export const SmsSimulatorToast: React.FC<SmsSimulatorToastProps> = ({
  otp,
  mobile,
  messageType = 'registration',
  onDismiss,
  onAutoFill,
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard?.writeText(otp);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-slate-900 border border-indigo-500/40 rounded-xl shadow-2xl p-4 animate-in slide-in-from-bottom-5 duration-300">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 text-indigo-400">
          <Smartphone className="w-4 h-4" />
          <span className="text-xs font-semibold uppercase tracking-wider">
            Simulated Mobile SMS Gateway
          </span>
        </div>
        <button
          onClick={onDismiss}
          className="text-slate-400 hover:text-slate-200 transition-colors p-0.5"
          aria-label="Close SMS alert"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs text-slate-300 mb-3 space-y-1">
        <div className="text-slate-400 font-mono text-[11px]">
          To: {mobile || '+91 98765 43210'}
        </div>
        <div className="text-slate-200">
          {messageType === 'registration' ? (
            <>
              Your Government Voter ID Verification One-Time Password is{' '}
              <strong className="text-amber-400 font-mono text-sm tracking-widest">{otp}</strong>.
              Valid for 10 minutes. Do not share.
            </>
          ) : (
            <>
              Your Bio-Voting Password Reset Code is{' '}
              <strong className="text-amber-400 font-mono text-sm tracking-widest">{otp}</strong>.
              Enter this to reset your account credentials securely.
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {onAutoFill && (
          <button
            onClick={() => onAutoFill(otp)}
            className="flex-1 py-1.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Auto-fill OTP</span>
          </button>
        )}
        <button
          onClick={handleCopy}
          className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
    </div>
  );
};
