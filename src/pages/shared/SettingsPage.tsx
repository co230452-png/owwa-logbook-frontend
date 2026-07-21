import React, { useState } from 'react';
import { Eye, EyeOff, Lock, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { usersAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import UserLayout from '../../components/user/UserLayout';
import AdminLayout from '../../components/admin/AdminLayout';

const SettingsContent: React.FC = () => {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent]         = useState(false);
  const [showNew, setShowNew]                 = useState(false);
  const [showConfirm, setShowConfirm]         = useState(false);
  const [loading, setLoading]                 = useState(false);
  const [error, setError]                     = useState('');
  const [success, setSuccess]                 = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    if (newPassword !== confirmPassword) { setError('New passwords do not match'); return; }
    if (newPassword.length < 6)          { setError('New password must be at least 6 characters'); return; }
    if (newPassword === currentPassword)  { setError('New password must be different from current password'); return; }
    setLoading(true);
    try {
      await usersAPI.changePassword(currentPassword, newPassword);
      setSuccess(true);
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      toast.success('Password changed successfully!');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to change password';
      setError(msg);
      toast.error(msg);
    } finally { setLoading(false); }
  };

  const passwordStrength = (pwd: string) => {
    if (!pwd)        return null;
    if (pwd.length < 6)  return { label: 'Too short', color: 'text-red-500',    bar: 'bg-red-400',    width: 'w-1/4' };
    if (pwd.length < 8)  return { label: 'Weak',      color: 'text-orange-500', bar: 'bg-orange-400', width: 'w-2/4' };
    if (pwd.length < 12) return { label: 'Good',      color: 'text-blue-500',   bar: 'bg-blue-400',   width: 'w-3/4' };
    return                      { label: 'Strong',    color: 'text-green-500',  bar: 'bg-green-400',  width: 'w-full' };
  };

  const strength = passwordStrength(newPassword);

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your account settings</p>
      </div>

      {/* Profile Info */}
      <div className="card mb-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Account Info</h2>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-blue-800 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-lg font-bold">
              {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
            </span>
          </div>
          <div>
            <p className="font-semibold text-gray-800">{user?.firstName} {user?.lastName}</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              user?.role === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
            }`}>
              {user?.role === 'admin' ? 'Administrator' : 'Member'}
            </span>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="card">
        <div className="flex items-center gap-2 mb-5">
          <Lock className="w-5 h-5 text-blue-800" />
          <h2 className="text-base font-semibold text-gray-800">Change Password</h2>
        </div>

        {success && (
          <div className="mb-4 flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
            <CheckCircle className="w-4 h-4 flex-shrink-0" /> Password changed successfully!
          </div>
        )}
        {error && (
          <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">Current Password</label>
            <div className="relative">
              <input type={showCurrent ? 'text' : 'password'} value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                className="form-input pr-10" placeholder="Enter current password" required />
              <button type="button" onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="form-label">New Password</label>
            <div className="relative">
              <input type={showNew ? 'text' : 'password'} value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="form-input pr-10" placeholder="Min. 6 characters" required minLength={6} />
              <button type="button" onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {strength && (
              <div className="mt-2">
                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${strength.bar} ${strength.width}`} />
                </div>
                <p className={`text-xs mt-1 ${strength.color}`}>{strength.label}</p>
              </div>
            )}
          </div>

          <div>
            <label className="form-label">Confirm New Password</label>
            <div className="relative">
              <input type={showConfirm ? 'text' : 'password'} value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="form-input pr-10" placeholder="Repeat new password" required />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {confirmPassword && (
              <p className={`text-xs mt-1 ${newPassword === confirmPassword ? 'text-green-600' : 'text-red-500'}`}>
                {newPassword === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
              </p>
            )}
          </div>

          <button type="submit" disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 py-3 disabled:opacity-50">
            {loading
              ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Changing...</>
              : <><Lock className="w-4 h-4" /> Change Password</>}
          </button>
        </form>
      </div>
    </div>
  );
};

const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  if (user?.role === 'admin') return <AdminLayout><SettingsContent /></AdminLayout>;
  return <UserLayout><SettingsContent /></UserLayout>;
};

export default SettingsPage;
