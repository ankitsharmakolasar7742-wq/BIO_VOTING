import React, { useState, useRef } from 'react';
import { Voter } from '../types';
import { getStoredVoters, saveVoters, logAuditEvent, ELECTION_SEAL_URL } from '../utils/storage';
import { SmsSimulatorToast } from './SmsSimulatorToast';
import { Camera, Upload, CheckCircle2, AlertCircle, RefreshCw, KeyRound, Smartphone, ShieldCheck, UserCheck, ArrowRight } from 'lucide-react';

interface RegisterViewProps {
  onRegistrationSuccess: (username: string) => void;
  onNavigateToLogin: () => void;
}

export const RegisterView: React.FC<RegisterViewProps> = ({
  onRegistrationSuccess,
  onNavigateToLogin,
}) => {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [mobile, setMobile] = useState('');
  const [voterId, setVoterId] = useState('');
  
  // OTP state
  const [otpSent, setOtpSent] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [showSmsAlert, setShowSmsAlert] = useState(false);

  // Photo state
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string>('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Form error
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle OTP send
  const handleSendOtp = () => {
    if (!mobile.trim() || mobile.length < 8) {
      setFormError('Please enter a valid mobile number first.');
      return;
    }
    if (!voterId.trim() || voterId.length < 5) {
      setFormError('Please enter your Government Voter ID first.');
      return;
    }
    setFormError('');
    setOtpError('');

    // Generate random 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setOtpSent(true);
    setShowSmsAlert(true);
  };

  const handleVerifyOtp = () => {
    if (enteredOtp.trim() === generatedOtp.trim()) {
      setIsOtpVerified(true);
      setOtpError('');
    } else {
      setOtpError('Invalid OTP code. Please enter the correct 6-digit code received on mobile.');
    }
  };

  // Camera capture methods
  const startCamera = async () => {
    setCameraError('');
    setIsCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 480 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: unknown) {
      const e = err as Error;
      setCameraError(e.message || 'Camera permission denied or camera device unavailable.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = 360;
    canvas.height = 360;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Center crop capture
    const vid = videoRef.current;
    const minDim = Math.min(vid.videoWidth, vid.videoHeight);
    const sx = (vid.videoWidth - minDim) / 2;
    const sy = (vid.videoHeight - minDim) / 2;
    ctx.drawImage(vid, sx, sy, minDim, minDim, 0, 0, 360, 360);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setProfilePhotoUrl(dataUrl);
    stopCamera();
  };

  // Upload photo handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setFormError('Please select a valid image file (JPEG, PNG).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setProfilePhotoUrl(result);
    };
    reader.readAsDataURL(file);
  };

  // Submit registration
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!fullName.trim()) {
      setFormError('Full name is required.');
      return;
    }
    if (!username.trim() || username.length < 3) {
      setFormError('Username must be at least 3 characters.');
      return;
    }
    if (!password || password.length < 6) {
      setFormError('Password must be at least 6 characters.');
      return;
    }
    if (!mobile.trim()) {
      setFormError('Mobile number is required for OTP authentication.');
      return;
    }
    if (!voterId.trim()) {
      setFormError('Voter ID is required.');
      return;
    }
    if (!isOtpVerified) {
      setFormError('Please verify your Voter ID with the mobile OTP before registering.');
      return;
    }
    if (!profilePhotoUrl) {
      setFormError('Please upload or capture a profile photo for biometric face matching.');
      return;
    }

    setIsSubmitting(true);

    const existingVoters = getStoredVoters();
    const usernameTaken = existingVoters.some(
      (v) => v.username.toLowerCase() === username.trim().toLowerCase()
    );
    if (usernameTaken) {
      setFormError(`Username "${username}" is already registered. Please choose another.`);
      setIsSubmitting(false);
      return;
    }

    const voterIdTaken = existingVoters.some(
      (v) => v.voterId.toLowerCase() === voterId.trim().toLowerCase()
    );
    if (voterIdTaken) {
      setFormError(`Voter ID "${voterId}" is already registered in the election database.`);
      setIsSubmitting(false);
      return;
    }

    const newVoter: Voter = {
      id: `voter-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      fullName: fullName.trim(),
      username: username.trim(),
      password: password,
      mobile: mobile.trim(),
      voterId: voterId.trim().toUpperCase(),
      isOtpVerified: true,
      profilePhotoUrl: profilePhotoUrl,
      hasVoted: false,
      registeredAt: new Date().toISOString(),
    };

    const updated = [newVoter, ...existingVoters];
    saveVoters(updated);

    logAuditEvent({
      action: 'VOTER_REGISTRATION_SUCCESS',
      details: `Voter ${newVoter.fullName} registered with Voter ID ${newVoter.voterId} via biometric template & OTP.`,
      actor: newVoter.username,
      status: 'success',
    });

    setIsSubmitting(false);
    onRegistrationSuccess(newVoter.username);
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 mb-4 shadow-sm">
          <ShieldCheck className="w-8 h-8 text-indigo-400" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Voter Biometric Enrollment
        </h1>
        <p className="mt-2 text-sm text-slate-400 max-w-xl mx-auto">
          Register with your official credentials, verify your mobile number through OTP, and upload your facial biometric template for secure camera voting.
        </p>
      </div>

      {formError && (
        <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
          <span>{formError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
        {/* Personal Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Full Legal Name
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Ankit Sharma"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Choose Username
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. ankit_voter"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Security Password */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Create Password
          </label>
          <div className="relative">
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Voter ID & Mobile Verification */}
        <div className="p-4 sm:p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-indigo-400" />
              <span>Mobile OTP & Voter ID Verification</span>
            </h3>
            {isOtpVerified && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Verified
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Government Voter ID Number
              </label>
              <input
                type="text"
                required
                disabled={isOtpVerified}
                value={voterId}
                onChange={(e) => setVoterId(e.target.value.toUpperCase())}
                placeholder="e.g. IND774219"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm font-mono text-white placeholder-slate-500 uppercase disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Mobile Number (for OTP SMS)
              </label>
              <div className="flex gap-2">
                <input
                  type="tel"
                  required
                  disabled={isOtpVerified}
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="+91 77420 00000"
                  className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 disabled:opacity-60"
                />
                {!isOtpVerified && (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold whitespace-nowrap transition-colors"
                  >
                    {otpSent ? 'Resend OTP' : 'Send OTP'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* OTP Input Field */}
          {otpSent && !isOtpVerified && (
            <div className="pt-2 border-t border-slate-800">
              <label className="block text-xs text-slate-300 mb-1.5">
                Enter 6-Digit OTP sent to your Mobile
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  maxLength={6}
                  value={enteredOtp}
                  onChange={(e) => setEnteredOtp(e.target.value)}
                  placeholder="6-digit code"
                  className="w-36 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-base font-mono tracking-widest text-center text-amber-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Verify OTP</span>
                </button>
              </div>
              {otpError && (
                <p className="mt-1.5 text-xs text-rose-400">{otpError}</p>
              )}
            </div>
          )}
        </div>

        {/* Biometric Profile Photo Section */}
        <div className="p-4 sm:p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Camera className="w-4 h-4 text-indigo-400" />
                <span>Facial Biometric Profile Photo</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                This image will be matched against your live webcam feed when you cast your vote.
              </p>
            </div>
            {profilePhotoUrl && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Template Ready
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
            {/* Action buttons */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={startCamera}
                disabled={isCameraActive}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                <Camera className="w-4 h-4 text-indigo-400" />
                <span>Take Live Snapshot via Camera</span>
              </button>

              <label className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer">
                <Upload className="w-4 h-4 text-indigo-400" />
                <span>Upload Profile Photo from Disk</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <p className="text-[11px] text-slate-400">
                Tip: Ensure good ambient lighting and face the camera directly without sunglasses or heavy coverings.
              </p>
            </div>

            {/* Live Camera View or Profile Photo Preview */}
            <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-900 border border-slate-800 min-h-[180px]">
              {isCameraActive ? (
                <div className="relative w-full flex flex-col items-center">
                  <div className="relative w-44 h-44 rounded-xl overflow-hidden bg-black ring-2 ring-indigo-500 shadow-md">
                    <video
                      ref={videoRef}
                      playsInline
                      muted
                      className="w-full h-full object-cover transform scale-x-[-1]"
                    />
                    {/* Biometric alignment ring */}
                    <div className="absolute inset-0 border-2 border-indigo-400/60 rounded-full m-3 pointer-events-none" />
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={capturePhoto}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors"
                    >
                      Capture Photo
                    </button>
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : profilePhotoUrl ? (
                <div className="flex flex-col items-center">
                  <div className="relative w-36 h-36 rounded-xl overflow-hidden ring-2 ring-emerald-500/50 shadow-md">
                    <img
                      src={profilePhotoUrl}
                      alt="Biometric Template Preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2 bg-emerald-500 text-slate-950 p-1 rounded-full shadow">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <span className="mt-2 text-xs text-slate-300 font-medium">
                    Profile Template Registered
                  </span>
                </div>
              ) : (
                <div className="text-center py-6 text-slate-500">
                  <UserCheck className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <span className="text-xs">No profile photo selected yet</span>
                </div>
              )}

              {cameraError && (
                <p className="mt-2 text-xs text-rose-400 text-center">{cameraError}</p>
              )}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting || !isOtpVerified || !profilePhotoUrl}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Enrolling Biometrics...</span>
              </>
            ) : (
              <>
                <span>Complete Registration & Proceed to Login</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* Login redirect link */}
        <div className="text-center pt-2">
          <p className="text-xs text-slate-400">
            Already registered?{' '}
            <button
              type="button"
              onClick={onNavigateToLogin}
              className="text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-4 ml-1"
            >
              Log in to your account
            </button>
          </p>
        </div>
      </form>

      {/* Simulated SMS Toast */}
      {showSmsAlert && (
        <SmsSimulatorToast
          otp={generatedOtp}
          mobile={mobile}
          messageType="registration"
          onDismiss={() => setShowSmsAlert(false)}
          onAutoFill={(code) => {
            setEnteredOtp(code);
            setShowSmsAlert(false);
          }}
        />
      )}
    </div>
  );
};
