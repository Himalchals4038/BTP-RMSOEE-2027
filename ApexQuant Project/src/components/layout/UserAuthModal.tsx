import React, { useState } from 'react';
import { usePortfolio } from '../../context/PortfolioContext';
import {
  X,
  UserCheck,
  KeyRound,
  CheckCircle2,
  Lock,
  Mail,
  User
} from 'lucide-react';

export const UserAuthModal: React.FC = () => {
  const {
    currentUser,
    activeUserModal,
    setActiveUserModal,
    loginUser,
    updateUserProfile,
    switchUserAccount
  } = usePortfolio();

  // Login state
  const [loginId, setLoginId] = useState(currentUser.id);
  const [password, setPassword] = useState('');
  const [loginSuccessMsg, setLoginSuccessMsg] = useState(false);

  // Password reset state
  const [resetEmail, setResetEmail] = useState(currentUser.email);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [newPass, setNewPass] = useState('');
  const [resetSuccessMsg, setResetSuccessMsg] = useState(false);

  // Edit profile state
  const [editName, setEditName] = useState(currentUser.name);
  const [editEmail, setEditEmail] = useState(currentUser.email);
  const [editDpId, setEditDpId] = useState(currentUser.dpId);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState(false);

  if (!activeUserModal) return null;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginUser(loginId || '8512437145', password);
    setLoginSuccessMsg(true);
    setTimeout(() => {
      setLoginSuccessMsg(false);
      setActiveUserModal(null);
    }, 1500);
  };

  const handleResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpSent) {
      setOtpSent(true);
    } else {
      setResetSuccessMsg(true);
      setTimeout(() => {
        setResetSuccessMsg(false);
        setOtpSent(false);
        setActiveUserModal('login');
      }, 1500);
    }
  };

  const handleEditProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({
      name: editName,
      email: editEmail,
      dpId: editDpId
    });
    setProfileSuccessMsg(true);
    setTimeout(() => {
      setProfileSuccessMsg(false);
      setActiveUserModal(null);
    }, 1500);
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setActiveUserModal(null);
        }
      }}
      className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div className="glass-card bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        {/* Header Bar */}
        <div className="bg-[var(--icici-gradient)] text-white px-5 py-3.5 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-full bg-white text-[#d32f2f] font-black text-sm flex items-center justify-center italic shadow-sm shrink-0">
              i
            </span>
            <div>
              <h3 className="text-sm font-extrabold uppercase tracking-wide text-white drop-shadow-xs">
                {activeUserModal === 'login' && 'User Login & Authentication'}
                {activeUserModal === 'reset_password' && 'Reset / Change Password'}
                {activeUserModal === 'edit_profile' && 'Edit User Profile & KYC'}
                {activeUserModal === 'switch_user' && 'Switch Trading Account'}
              </h3>
              <p className="text-xs text-amber-200 font-bold tracking-wide mt-0.5 drop-shadow-xs">ApexQuant Direct Gateway</p>
            </div>
          </div>

          <button
            onClick={() => setActiveUserModal(null)}
            className="p-1.5 rounded-full bg-white text-[#d32f2f] hover:bg-orange-100 shadow-md font-bold transition-all cursor-pointer flex items-center justify-center border border-white/50"
            title="Close Modal"
            aria-label="Close"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-5 space-y-4">
          {/* 1. LOGIN MODAL */}
          {activeUserModal === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {loginSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Authenticated Successfully! Logging into ApexQuant Terminal.
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--text-primary)]">User ID / Login ID</label>
                <div className="relative flex items-center">
                  <User className="w-4 h-4 text-[var(--text-muted)] absolute left-3" />
                  <input
                    type="text"
                    required
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                    placeholder="e.g. 8512437145"
                    className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl py-2 pl-9 pr-3 text-xs font-mono font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--icici-orange)]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-bold text-[var(--text-primary)]">Password</label>
                  <button
                    type="button"
                    onClick={() => setActiveUserModal('reset_password')}
                    className="text-[var(--icici-orange)] font-bold hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 text-[var(--text-muted)] absolute left-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl py-2 pl-9 pr-3 text-xs font-mono font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--icici-orange)]"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[var(--icici-orange)] hover:bg-[var(--icici-orange-hover)] text-white font-extrabold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <UserCheck className="w-4 h-4" />
                SECURE LOGIN TO TERMINAL
              </button>
            </form>
          )}

          {/* 2. RESET PASSWORD MODAL */}
          {activeUserModal === 'reset_password' && (
            <form onSubmit={handleResetSubmit} className="space-y-4">
              {resetSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Password Updated Successfully! Redirecting to Login...
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--text-primary)]">Registered Email Address</label>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 text-[var(--text-muted)] absolute left-3" />
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl py-2 pl-9 pr-3 text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--icici-orange)]"
                  />
                </div>
              </div>

              {otpSent && (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[var(--text-primary)] font-mono">6-Digit Security OTP</label>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      placeholder="Enter 6-digit OTP sent to email"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl py-2 px-3 text-xs font-mono font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--icici-orange)]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[var(--text-primary)]">New Password</label>
                    <input
                      type="password"
                      required
                      placeholder="Enter new password"
                      value={newPass}
                      onChange={(e) => setNewPass(e.target.value)}
                      className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl py-2 px-3 text-xs font-mono font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--icici-orange)]"
                    />
                  </div>
                </>
              )}

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[var(--icici-orange)] hover:bg-[var(--icici-orange-hover)] text-white font-extrabold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <KeyRound className="w-4 h-4" />
                {otpSent ? 'CONFIRM & RESET PASSWORD' : 'SEND SECURITY OTP TO EMAIL'}
              </button>
            </form>
          )}

          {/* 3. EDIT PROFILE MODAL */}
          {activeUserModal === 'edit_profile' && (
            <form onSubmit={handleEditProfileSubmit} className="space-y-4">
              {profileSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  User Profile Updated Successfully!
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--text-primary)]">Full Legal Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl py-2 px-3 text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--icici-orange)]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--text-primary)]">Registered Email ID</label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl py-2 px-3 text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--icici-orange)]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--text-primary)]">CDSL Demat DP ID</label>
                <input
                  type="text"
                  required
                  value={editDpId}
                  onChange={(e) => setEditDpId(e.target.value)}
                  className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl py-2 px-3 text-xs font-mono font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--icici-orange)]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[var(--icici-orange)] hover:bg-[var(--icici-orange-hover)] text-white font-extrabold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <UserCheck className="w-4 h-4" />
                SAVE PROFILE CHANGES
              </button>
            </form>
          )}

          {/* 4. SWITCH USER ACCOUNT MODAL */}
          {activeUserModal === 'switch_user' && (
            <div className="space-y-4">
              <p className="text-xs text-[var(--text-secondary)]">
                Select an active trading account tier to switch interface permissions and margin limits:
              </p>

              <div className="space-y-2">
                {[
                  { id: 'Institutional Prime', desc: '4x Margin, Direct Market Access (DMA), Custom API Keys', badge: 'Active Tier' },
                  { id: 'Retail HNI', desc: 'Standard F&O, Equity Delivery, Mutual Funds SIP', badge: 'Available' },
                  { id: 'Sandbox Demo', desc: 'Simulated Paper Trading Mode, Zero Risk', badge: 'Testing' }
                ].map(acc => (
                  <div
                    key={acc.id}
                    onClick={() => switchUserAccount(acc.id as any)}
                    className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                      currentUser.accountType === acc.id
                        ? 'bg-[var(--icici-orange)] border-transparent text-white shadow-xs font-bold'
                        : 'bg-[var(--bg-tertiary)] border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-sm">{acc.id}</div>
                      <div className="text-[11px] opacity-80 mt-0.5">{acc.desc}</div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-white/20 font-bold shrink-0">
                      {acc.badge}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
